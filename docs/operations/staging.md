# Staging setup

## Owner prerequisites

1. Create a Supabase project dedicated to staging. Never reuse production.
2. Enable managed backups and record a restore-test owner, retention period and recovery objective.
3. Create a staging hosting project and HTTPS URL. Add only that URL and local development URLs to Supabase Auth redirect allow-lists.

## Database and Storage

1. Authenticate the Supabase CLI, run `supabase link --project-ref <STAGING_PROJECT_REF>`, review `supabase db push --dry-run`, then run `supabase db push`.
2. Run `supabase test db` and retain the pgTAP output before accepting the migration.
3. Load `supabase/seed.sql` only after confirming the project is staging. Every synthetic property must retain its `[DEMO]` title and `DEMO-` reference.
4. Verify `property-media` is public and verification/owner-document buckets are private, with their configured MIME and size limits.
5. Upload only authorised demonstration imagery to staging Storage. Do not reuse customer documents.

## Public client configuration

Set the staging host values documented in `.env.example`, including `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`, optional `VITE_WHATSAPP_NUMBER`, map configuration and analytics identifiers. The anonymous key is designed for browser use and remains constrained by RLS.

Never expose `SUPABASE_SERVICE_ROLE_KEY`, email provider keys, cron secrets or AI provider keys as `VITE_*` variables.

## Server and Edge Function secrets

Deploy every directory under `supabase/functions`, then configure `SITE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `STAFF_NOTIFICATION_EMAIL`, `RATE_LIMIT_SECRET`, `PROPERTY_ALERT_CRON_SECRET` and `OPENAI_API_KEY` through Supabase Function secrets. Set the service-role key only in the managed server environment.

Schedule a POST to `process-property-alerts` with `x-cron-secret: <PROPERTY_ALERT_CRON_SECRET>` at the agreed interval. Send all staging email to approved test recipients.

## Test identities

Create separate synthetic customer, staff and administrator users through Supabase Auth. Promote roles using `set_staff_role` from an existing administrator session. Assign staff to test branches and verify that ordinary staff cannot manage roles or access another branch's private leads.

## Acceptance and recovery

1. Run `npm run ci`, `npm run test:e2e`, `supabase test db` and `docs/uat.md` against staging.
2. Complete a real controlled enquiry and viewing request, confirm database persistence and email delivery, then manage each record through an authorised staff account.
3. Verify Storage upload restrictions, expired-session handling, rate limiting and anonymous denial of private tables.
4. Take a staging backup, restore it to a disposable project, and verify property, enquiry and user-profile record counts.
5. Record Lighthouse and axe results for mobile and desktop. Resolve critical findings before production approval.

## Single owner hand-off

The complete owner-supplied inputs and launch gates are maintained in `../PHASE-4-VERIFICATION-REPORT.md` and `../PRODUCTION-READINESS-CHECKLIST.md`. Verify the project reference and hostname verbally or through the provider console before linking the CLI; a plausible project name is not sufficient identity evidence.

