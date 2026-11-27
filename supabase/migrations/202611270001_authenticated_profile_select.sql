begin;

-- Owner approval required before applying this migration.
grant select on table public.profiles to authenticated;

commit;
