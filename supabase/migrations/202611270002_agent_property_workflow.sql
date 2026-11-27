-- Owner approval required before applying this migration to a hosted project.
-- The enum value must be committed before policies and functions may use it.
alter type public.app_role add value if not exists 'agent';

begin;

alter table public.properties
  add column if not exists review_status text not null default 'draft'
    check (review_status in ('draft','submitted','under_review','changes_requested','approved','rejected','published')),
  add column if not exists review_feedback text check (char_length(review_feedback) <= 4000),
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;

create index if not exists properties_review_queue
  on public.properties(review_status, updated_at desc);
create index if not exists properties_creator_queue
  on public.properties(created_by, review_status, updated_at desc);

create or replace function public.is_agent()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.profiles
    where id=auth.uid() and role='agent' and is_active
  )
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.profiles
    where id=auth.uid() and role in ('editor','admin') and is_active
  )
$$;

create or replace function public.can_manage_property(target public.properties)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin()
    or public.is_staff()
    or (
      public.is_agent()
      and target.created_by=auth.uid()
      and target.review_status in ('draft','changes_requested')
    )
$$;

revoke all on function public.is_agent() from public, anon;
revoke all on function public.can_manage_property(public.properties) from public, anon;
grant execute on function public.is_agent() to authenticated;
grant execute on function public.can_manage_property(public.properties) to authenticated;

create or replace function public.enforce_property_review_workflow()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  actor_role text;
begin
  select role::text into actor_role
  from public.profiles where id=auth.uid() and is_active;

  if actor_role is null then
    raise exception 'active staff profile required' using errcode='42501';
  end if;

  if tg_op='INSERT' then
    new.created_by := auth.uid();
    new.updated_by := auth.uid();
    if actor_role='agent' then
      if new.status<>'draft' or new.review_status<>'draft'
        or not exists(select 1 from public.agents where profile_id=auth.uid() and id=new.agent_id and is_published) then
        raise exception 'agents may only create their own draft listings' using errcode='42501';
      end if;
    elsif actor_role not in ('editor','admin') then
      raise exception 'staff role required' using errcode='42501';
    end if;
    return new;
  end if;

  new.updated_by := auth.uid();
  if actor_role='agent' then
    if old.created_by<>auth.uid() or new.created_by<>old.created_by or new.agent_id<>old.agent_id
      or old.review_status not in ('draft','changes_requested')
      or new.review_status not in (old.review_status,'submitted')
      or new.status<>'draft' then
      raise exception 'agent listing change is not permitted' using errcode='42501';
    end if;
  elsif actor_role='editor' then
    if new.created_by is distinct from old.created_by or new.agent_id is distinct from old.agent_id
      or new.status='published'
      or not (
        new.review_status=old.review_status
        or (old.review_status='submitted' and new.review_status in ('under_review','changes_requested'))
        or (old.review_status='under_review' and new.review_status='changes_requested')
      ) then
      raise exception 'editor listing change is not permitted' using errcode='42501';
    end if;
  elsif actor_role='admin' then
    if new.review_status='published' and old.review_status<>'approved' then
      raise exception 'only approved listings may be published' using errcode='23514';
    end if;
    if new.status='published' and new.review_status<>'published' then
      raise exception 'published listings require a published review state' using errcode='23514';
    end if;
  else
    raise exception 'staff role required' using errcode='42501';
  end if;

  if new.review_status='submitted' and old.review_status<>new.review_status then
    new.submitted_at := now();
    new.reviewed_at := null;
    new.reviewed_by := null;
  elsif new.review_status in ('approved','rejected','changes_requested') and old.review_status<>new.review_status then
    if actor_role<>'admin' then
      raise exception 'administrator review required' using errcode='42501';
    end if;
    new.reviewed_at := now();
    new.reviewed_by := auth.uid();
  elsif new.review_status='published' and old.review_status<>new.review_status then
    new.status := 'published';
    new.published_at := coalesce(new.published_at,now());
    new.reviewed_by := auth.uid();
  end if;
  return new;
end $$;

drop trigger if exists enforce_property_review_workflow on public.properties;
create trigger enforce_property_review_workflow
before insert or update on public.properties
for each row execute function public.enforce_property_review_workflow();

drop policy if exists properties_staff_all on public.properties;
create policy properties_admin_all on public.properties for all
  using(public.is_admin()) with check(public.is_admin());
create policy properties_editor_read on public.properties for select
  using(public.is_staff());
create policy properties_editor_insert on public.properties for insert
  with check(public.is_staff());
create policy properties_editor_update on public.properties for update
  using(public.is_staff()) with check(public.is_staff());
create policy properties_agent_read on public.properties for select
  using(public.is_agent() and created_by=auth.uid());
create policy properties_agent_insert on public.properties for insert
  with check(public.is_agent() and created_by=auth.uid());
create policy properties_agent_update on public.properties for update
  using(public.is_agent() and created_by=auth.uid() and review_status in ('draft','changes_requested'))
  with check(public.is_agent() and created_by=auth.uid());

drop policy if exists property_images_staff_all on public.property_images;
create policy property_images_admin_all on public.property_images for all
  using(public.is_admin()) with check(public.is_admin());
create policy property_images_editor_all on public.property_images for all
  using(public.is_staff()) with check(public.is_staff());
create policy property_images_agent_all on public.property_images for all
  using(exists(select 1 from public.properties p where p.id=property_id and public.can_manage_property(p)))
  with check(exists(select 1 from public.properties p where p.id=property_id and public.can_manage_property(p)));

drop policy if exists agents_staff_write on public.agents;
create policy agents_admin_all on public.agents for all
  using(public.is_admin()) with check(public.is_admin());
create policy agents_self_update on public.agents for update
  using(public.is_agent() and profile_id=auth.uid())
  with check(public.is_agent() and profile_id=auth.uid());

create or replace function public.enforce_agent_profile_scope()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if public.is_agent() and not public.is_admin() then
    if new.profile_id is distinct from old.profile_id
      or new.branch_id is distinct from old.branch_id
      or new.slug is distinct from old.slug
      or new.email is distinct from old.email
      or new.is_published is distinct from old.is_published then
      raise exception 'agent profile scope exceeded' using errcode='42501';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists enforce_agent_profile_scope on public.agents;
create trigger enforce_agent_profile_scope before update on public.agents
for each row execute function public.enforce_agent_profile_scope();

drop policy if exists property_media_staff_insert on storage.objects;
drop policy if exists property_media_staff_update on storage.objects;
drop policy if exists property_media_staff_delete on storage.objects;
create policy property_media_authorised_insert on storage.objects for insert
  with check(bucket_id='property-media' and split_part(name,'/',1) in (
    select p.id::text from public.properties p where public.can_manage_property(p)
  ));
create policy property_media_authorised_update on storage.objects for update
  using(bucket_id='property-media' and split_part(name,'/',1) in (
    select p.id::text from public.properties p where public.can_manage_property(p)
  ));
create policy property_media_authorised_delete on storage.objects for delete
  using(bucket_id='property-media' and split_part(name,'/',1) in (
    select p.id::text from public.properties p where public.can_manage_property(p)
  ));

commit;
