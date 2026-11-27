begin;

-- Owner approval required before applying this migration.
--
-- PostgreSQL privileges are checked before row-level security policies. The
-- account UI already has ownership/staff RLS policies, but authenticated API
-- users also need the table-level operations used by each account workflow.
-- These grants do not expose rows on their own: every table below remains
-- protected by its existing RLS policies.

grant usage on schema public to authenticated;

grant select on table public.properties to authenticated;

grant select, insert, delete
  on table public.saved_properties to authenticated;

grant select, insert, update, delete
  on table public.saved_searches to authenticated;

grant select, update
  on table public.system_notifications to authenticated;

grant select, insert, update
  on table public.property_submissions to authenticated;

grant select, insert
  on table public.property_submission_documents to authenticated;

grant select
  on table public.leases to authenticated;

grant select, insert
  on table public.maintenance_requests to authenticated;

grant select, insert, update
  on table public.property_offers to authenticated;

grant select
  on table public.transaction_milestones to authenticated;

grant select, insert
  on table public.property_service_requests to authenticated;

grant select
  on table public.enquiries to authenticated;

commit;
