begin;

-- Public catalogue access must enforce both publication and current availability.
drop policy if exists properties_public_read on public.properties;
create policy properties_public_read on public.properties
for select using (status = 'published' and is_available);

-- Do not expose inactive/unpublished agent records through the anonymous API.
drop policy if exists agents_public_read on public.agents;
create policy agents_public_read on public.agents
for select using (is_published);

-- View events are accepted only through the rate-limited Edge Function.
drop policy if exists property_views_insert on public.property_views;

create table public.request_rate_limits (
  bucket text not null,
  key_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  updated_at timestamptz not null default now(),
  primary key (bucket, key_hash)
);

alter table public.request_rate_limits enable row level security;

create function public.consume_rate_limit(
  p_bucket text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  allowed boolean;
begin
  if p_bucket !~ '^[a-z0-9-]{1,50}$'
    or p_key_hash !~ '^[a-f0-9]{64}$'
    or p_limit < 1 or p_limit > 10000
    or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid rate limit parameters' using errcode = '22023';
  end if;

  insert into public.request_rate_limits as limits
    (bucket, key_hash, window_started_at, request_count)
  values (p_bucket, p_key_hash, now(), 1)
  on conflict (bucket, key_hash) do update
  set
    window_started_at = case
      when limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then now()
      else limits.window_started_at
    end,
    request_count = case
      when limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1
      else limits.request_count + 1
    end,
    updated_at = now()
  returning request_count <= p_limit into allowed;

  return allowed;
end
$$;

revoke all on table public.request_rate_limits from anon, authenticated;
revoke all on function public.consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;

create function public.audit_staff_access_change() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role is distinct from new.role or old.is_active is distinct from new.is_active then
    insert into public.audit_logs(actor_id, action, table_name, record_id, old_data, new_data)
    values (
      auth.uid(),
      'staff_access_update',
      'profiles',
      new.id,
      jsonb_build_object('role', old.role, 'is_active', old.is_active),
      jsonb_build_object('role', new.role, 'is_active', new.is_active)
    );
  end if;
  return new;
end
$$;

create trigger audit_profile_staff_access
after update of role, is_active on public.profiles
for each row execute function public.audit_staff_access_change();

commit;
