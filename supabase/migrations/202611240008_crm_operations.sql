begin;
<<<<<<< Updated upstream
alter table public.profiles add column if not exists branch_id uuid references public.branches(id) on delete set null;
alter table public.agents add column if not exists profile_id uuid unique references public.profiles(id) on delete set null;
alter table public.enquiries add column if not exists branch_id uuid references public.branches(id) on delete set null;
=======

-- Added 'if not exists' to all three alter table statements to prevent crashes if columns already exist
alter table public.profiles add column if not exists branch_id uuid references public.branches(id) on delete set null;
alter table public.agents add column if not exists profile_id uuid unique references public.profiles(id) on delete set null;
alter table public.enquiries add column if not exists branch_id uuid references public.branches(id) on delete set null;

>>>>>>> Stashed changes
create index enquiries_branch_queue on public.enquiries(branch_id,status,created_at desc);
create index enquiries_assignee_queue on public.enquiries(assigned_to,status,created_at desc);
create index follow_ups_staff_due on public.follow_ups(staff_id,completed_at,due_at);

create function public.can_access_enquiry(target public.enquiries) returns boolean language sql stable security definer set search_path='' as $$
  select public.is_admin() or (public.is_staff() and (target.assigned_to=auth.uid() or target.branch_id is null or target.branch_id=(select branch_id from public.profiles where id=auth.uid())))
$$;
revoke all on function public.can_access_enquiry(public.enquiries) from public;
revoke all on function public.can_access_enquiry(public.enquiries) from anon;
grant execute on function public.can_access_enquiry(public.enquiries) to authenticated;

drop policy enquiries_customer_read on public.enquiries;
drop policy enquiries_staff_write on public.enquiries;
create policy enquiries_customer_read on public.enquiries for select using(customer_id=auth.uid());
create policy enquiries_staff_read on public.enquiries for select to authenticated using(public.can_access_enquiry(enquiries));
create policy enquiries_staff_update on public.enquiries for update to authenticated using(public.can_access_enquiry(enquiries)) with check(public.can_access_enquiry(enquiries));
drop policy enquiry_notes_staff on public.enquiry_notes;
create policy enquiry_notes_staff_read on public.enquiry_notes for select to authenticated using(exists(select 1 from public.enquiries e where e.id=enquiry_id and public.can_access_enquiry(e)));
create policy enquiry_notes_staff_insert on public.enquiry_notes for insert to authenticated with check(author_id=auth.uid() and exists(select 1 from public.enquiries e where e.id=enquiry_id and public.can_access_enquiry(e)));
drop policy follow_ups_staff on public.follow_ups;
create policy follow_ups_staff_read on public.follow_ups for select to authenticated using(exists(select 1 from public.enquiries e where e.id=enquiry_id and public.can_access_enquiry(e)));
create policy follow_ups_staff_insert on public.follow_ups for insert to authenticated with check(staff_id=auth.uid() and exists(select 1 from public.enquiries e where e.id=enquiry_id and public.can_access_enquiry(e)));
create policy follow_ups_staff_update on public.follow_ups for update to authenticated using(staff_id=auth.uid() or public.is_admin()) with check(staff_id=auth.uid() or public.is_admin());

create function public.audit_crm_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.audit_logs(actor_id,action,table_name,record_id,old_data,new_data) values(auth.uid(),lower(tg_op),tg_table_name,coalesce(new.id,old.id),case when tg_op='INSERT' then null else to_jsonb(old) end,case when tg_op='DELETE' then null else to_jsonb(new) end);
  return coalesce(new,old);
end $$;
create trigger audit_enquiry_change after update on public.enquiries for each row when(old.status is distinct from new.status or old.assigned_to is distinct from new.assigned_to or old.branch_id is distinct from new.branch_id) execute function public.audit_crm_change();
create trigger audit_enquiry_note after insert on public.enquiry_notes for each row execute function public.audit_crm_change();
create trigger audit_follow_up after insert or update on public.follow_ups for each row execute function public.audit_crm_change();

commit;