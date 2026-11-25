begin;

create type public.verification_request_status as enum ('submitted','under_review','approved','rejected','expired');
create table public.property_verification_requests (
  id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
  requested_by uuid not null references public.profiles(id), reviewer_id uuid references public.profiles(id),
  status public.verification_request_status not null default 'submitted', review_notes text,
  reviewed_at timestamptz, expires_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.property_verification_documents (
  id uuid primary key default gen_random_uuid(), request_id uuid not null references public.property_verification_requests(id) on delete cascade,
  storage_path text not null unique, document_type text not null check(char_length(document_type) between 2 and 80),
  original_name text not null, uploaded_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create table public.property_verification_history (
  id bigint generated always as identity primary key, request_id uuid not null references public.property_verification_requests(id) on delete cascade,
  actor_id uuid references public.profiles(id), old_status public.verification_request_status, new_status public.verification_request_status not null,
  notes text, created_at timestamptz not null default now()
);
create index verification_queue on public.property_verification_requests(status,created_at);
create trigger set_property_verification_requests_updated_at before update on public.property_verification_requests for each row execute function public.set_updated_at();

create function public.prepare_verification_review() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status in ('approved','rejected','expired') and (tg_op='INSERT' or old.status is distinct from new.status) then
    new.reviewer_id=auth.uid(); new.reviewed_at=now();
  end if;
  return new;
end $$;
create trigger verification_review_fields before insert or update of status on public.property_verification_requests for each row execute function public.prepare_verification_review();

create function public.process_verification_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' or old.status is distinct from new.status then
    insert into public.property_verification_history(request_id,actor_id,old_status,new_status,notes)
    values(new.id,auth.uid(),case when tg_op='UPDATE' then old.status end,new.status,new.review_notes);
    if new.status='approved' then
      update public.properties set verification_status='verified',verified_at=now() where id=new.property_id;
    elsif new.status in ('rejected','expired') then
      update public.properties set verification_status=case when new.status='rejected' then 'rejected' else 'unverified' end,verified_at=null where id=new.property_id;
    elsif new.status='under_review' then update public.properties set verification_status='pending' where id=new.property_id;
    end if;
  end if; return null;
end $$;
create trigger verification_change after insert or update of status on public.property_verification_requests for each row execute function public.process_verification_change();

alter table public.property_verification_requests enable row level security;
alter table public.property_verification_documents enable row level security;
alter table public.property_verification_history enable row level security;
create policy verification_staff_read on public.property_verification_requests for select using(public.is_staff());
create policy verification_staff_insert on public.property_verification_requests for insert with check(
  public.is_staff() and requested_by=auth.uid() and status='submitted'
  and reviewer_id is null and reviewed_at is null and review_notes is null
);
create policy verification_admin_update on public.property_verification_requests for update using(public.is_admin()) with check(public.is_admin());
create policy verification_requester_cleanup on public.property_verification_requests for delete using(public.is_staff() and requested_by=auth.uid() and status='submitted' and not exists(select 1 from public.property_verification_documents d where d.request_id=property_verification_requests.id));
create policy verification_documents_staff_read on public.property_verification_documents for select using(public.is_staff());
create policy verification_documents_staff_insert on public.property_verification_documents for insert with check(public.is_staff() and uploaded_by=auth.uid());
create policy verification_documents_admin_delete on public.property_verification_documents for delete using(public.is_admin());
create policy verification_history_staff on public.property_verification_history for select using(public.is_staff());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('verification-documents','verification-documents',false,10485760,array['application/pdf','image/jpeg','image/png']) on conflict(id) do nothing;
create policy verification_storage_staff_read on storage.objects for select using(bucket_id='verification-documents' and public.is_staff());
create policy verification_storage_staff_insert on storage.objects for insert with check(bucket_id='verification-documents' and public.is_staff());
create policy verification_storage_staff_delete on storage.objects for delete using(bucket_id='verification-documents' and public.is_admin());

commit;
