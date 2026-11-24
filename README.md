# Hilltop Properties Zambia

Production-oriented real-estate platform using a Vite/TypeScript frontend and Supabase PostgreSQL, Auth, Storage, RLS and Edge Functions.

## Local development

1. Copy `.env.example` to `.env.local` and provide a Supabase URL and anonymous key.
2. Run `npm ci`.
3. Run `supabase start` and `supabase db reset` for a local backend.
4. Run `npm run dev -- --host 0.0.0.0`.

The public site is at `/` and the protected staff CMS is at `/admin.html`.

## Verification

Run `npm run ci` for lint, types, unit tests and production build. Run `npm run test:e2e` for browser journeys. Database migrations and linting require the Supabase CLI and Docker.

## Supabase deployment

Migrations are in `supabase/migrations/`, reference seed data is in `supabase/seed.sql`, and the secure enquiry handler is in `supabase/functions/submit-enquiry/`. Configure Edge Function secrets separately from browser variables.

## Documentation

- [Architecture and capabilities](CAPABILITY-MAP.md)
- [Database schema](docs/database.md)
- [Security](docs/security.md)
- [Privacy](docs/privacy.md)
- [Staging setup](docs/operations/staging.md)
- [Production deployment](docs/operations/production.md)
- [Maintenance and recovery](docs/operations/maintenance.md)
- [UAT checklist](docs/uat.md)

Live deployment requires external Supabase, hosting, domain, email, WhatsApp and analytics accounts. Their credentials must be supplied through the relevant platform secret stores.
