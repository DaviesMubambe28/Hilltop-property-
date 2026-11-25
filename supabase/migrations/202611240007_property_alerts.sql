begin;
alter table public.saved_searches add column last_checked_at timestamptz,
  add constraint saved_search_name_length check(char_length(trim(name)) between 2 and 120) not valid,
  add constraint saved_search_filters_object check(jsonb_typeof(filters)='object') not valid;
create table public.property_alert_matches (
  id uuid primary key default gen_random_uuid(), saved_search_id uuid not null references public.saved_searches(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  notification_id uuid references public.system_notifications(id) on delete set null,
  emailed_at timestamptz, email_error text, created_at timestamptz not null default now(), unique(saved_search_id,property_id)
);
create index property_alert_matches_search on public.property_alert_matches(saved_search_id,created_at desc);
alter table public.property_alert_matches enable row level security;
create policy property_alert_matches_owner_read on public.property_alert_matches for select using(exists(select 1 from public.saved_searches s where s.id=saved_search_id and s.user_id=auth.uid()));
grant execute on function public.search_property_ids(text,uuid,text,uuid,uuid,uuid,public.listing_type,numeric,numeric,integer,integer,numeric,numeric,text,text,text,text[],text,integer,integer) to service_role;
commit;
