# Staging Setup

1. Create a separate Supabase project and record its project reference.
2. Link the CLI, apply migrations and deploy `submit-enquiry`.
3. Add `SITE_URL`, `RESEND_API_KEY`, `EMAIL_FROM` and `STAFF_NOTIFICATION_EMAIL` as Edge Function secrets.
4. Configure the staging host with the public `VITE_*` variables from `.env.example`.
5. Add the staging URL to Supabase Authentication redirect URLs.
6. Create test users through Supabase Auth and promote roles using the `set_staff_role` RPC from an existing administrator session.
7. Execute CI, browser tests and `docs/uat.md`. Use synthetic contact information only.

