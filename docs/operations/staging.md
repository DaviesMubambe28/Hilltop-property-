# Staging Setup

1. Create a separate Supabase project and record its project reference.
2. Link the CLI, apply migrations and deploy all functions in `supabase/functions`.
3. Add `SITE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `STAFF_NOTIFICATION_EMAIL`, `RATE_LIMIT_SECRET`, `PROPERTY_ALERT_CRON_SECRET` and `OPENAI_API_KEY` as Edge Function secrets.
4. Schedule a POST to `process-property-alerts` with `x-cron-secret: <PROPERTY_ALERT_CRON_SECRET>` at the desired alert interval. Never put this secret in frontend variables.
5. Configure the staging host with the public `VITE_*` variables from `.env.example`.
6. Add the staging URL to Supabase Authentication redirect URLs.
7. Create test users through Supabase Auth and promote roles using the `set_staff_role` RPC from an existing administrator session.
8. Execute CI, browser tests and `docs/uat.md`. Use synthetic contact information only.

