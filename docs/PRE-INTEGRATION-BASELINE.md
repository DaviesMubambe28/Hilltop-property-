# Pre-integration baseline

Recorded 26 November 2026 on branch `work` at `563e36d` before this integration slice.

- Vite multi-page TypeScript frontend with Supabase Auth, PostgreSQL, Storage and Edge Functions.
- `npm run ci` passed: lint, type checking, 63 unit tests and production build.
- Dedicated sign-in, registration, recovery, password-update and sign-out pages did not exist. Password recovery redirected to the homepage, which could not complete a password update.
- Public WhatsApp links existed only within selected property views. No site-wide configured launcher existed.
- No public property-assistant widget existed.
- The repository contained one hero photograph plus its mobile crop, not the requested five approved hero photographs.
- Live Supabase, RLS, Storage, Edge Function, email and production hosting verification was unavailable because project credentials and a local Supabase CLI/runtime were unavailable.
- Review identified primary-image conflicts on existing properties and alert-worker pagination/partial-failure risks.
