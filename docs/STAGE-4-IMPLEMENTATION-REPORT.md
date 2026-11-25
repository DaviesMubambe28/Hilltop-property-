# Stage 4 Implementation Report

Updated: 24 November 2026 (Africa/Lusaka)

## Implemented

- Four separate financial calculators with bounded inputs, explicit assumptions and unit tests.
- Authenticated customer dashboard for profile, saved properties, saved searches, alert controls, notifications and enquiry history.
- Persisted property alerts with deduplicated matches, in-app delivery and optional Resend email.
- Lazy-loaded, privacy-rounded OpenStreetMap listing results.
- Natural-language search Edge Function that supplies current Supabase taxonomy to the model, accepts only a strict filter schema, rate-limits callers, and routes the validated filters through the existing database search. The model cannot return listing content to the UI.

## Executed checks

- ESLint passed.
- TypeScript passed.
- 45 unit tests passed.
- Production build passed.
- Deno Edge Function checking is blocked because Deno is unavailable in this environment.
- Live AI evaluation is blocked until `OPENAI_API_KEY`, Supabase credentials and staging access are supplied.

## Safe staging configuration

Store `OPENAI_API_KEY` and `RATE_LIMIT_SECRET` only as Supabase Edge Function secrets, deploy `ai-property-search`, and test against a staging taxonomy. Do not expose either key as a `VITE_*` variable.
