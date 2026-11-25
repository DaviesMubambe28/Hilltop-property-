# Phase 3 isolated test environment

Assessment date: 25 November 2026.

## Scope and isolation

No production Supabase project, credentials or customer data were available or used. Database verification ran in a disposable local container based on `ghcr.io/supabase/postgres:15.20.0.002`. The container was removed after the checks completed.

The full Supabase development stack could not start because this environment's outbound proxy returned HTTP 403 while the CLI attempted to retrieve newer service images. The standalone PostgreSQL verification therefore covers migrations, constraints, seed integrity and PostgreSQL RLS. It does not claim to verify the API gateway, Auth service, Storage service or Edge Function delivery.

## Reproduced Supabase platform prerequisites

The standalone PostgreSQL image does not include the Storage service schema or the API-role default grants normally provisioned by a Supabase project. The isolated harness supplied only:

- minimal `storage.buckets`, `storage.objects` and `storage.foldername` definitions required to apply the repository migrations;
- the standard table and sequence privileges for `anon`, `authenticated` and `service_role` before exercising RLS.

No application policy was bypassed. The test role remained `anon` for the anonymous assertions, and sensitive helper functions remained revoked.

## Verified results

- All migrations replayed in filename order on a clean schema through `202611240011_crm_function_permissions.sql`.
- The property viewing overlap exclusion constraint was present after replay.
- `anon` had no execute permission on `public.can_access_enquiry(public.enquiries)`.
- `supabase/seed.sql` loaded eleven visibly labelled `[DEMO]` properties across sale, rent and investment scenarios, including available, reserved, sold and rented inventory, plus synthetic agents, an enquiry and a viewing request.
- `supabase/tests/rls.sql`: 32 of 32 pgTAP assertions passed.
- `supabase/tests/phase3_demo_data.sql`: 9 of 9 pgTAP assertions passed.

## Remaining integration work

Before launch, run `npm run test:db` against the complete Supabase local stack or an authorised staging project, then exercise registration, authentication, Storage uploads, Edge Functions, enquiry persistence and staff management through the API. The demonstration seed must remain confined to development or staging and must never be presented as genuine inventory.
