# Stage 1 — Critical Foundation Implementation Report

Date: 24 November 2026 (Africa/Lusaka)

## Scope completed

- Public property RLS now requires both `published` status and current availability.
- Anonymous users can only read published agent records.
- Direct anonymous/authenticated inserts into `property_views` are removed.
- Property views are sent through a dedicated Edge Function which validates the listing, checks the request origin, applies a persistent rate limit, pseudonymises the source with HMAC, and suppresses repeat views for 30 minutes.
- Enquiry protection now combines strict schemas, a hidden honeypot, origin validation, persistent atomic limits per pseudonymous IP and IP/email pair, idempotency, and published-property validation.
- Staff role/activation changes create privacy-minimised audit records.
- Search URL parameters validate UUIDs, accepted price ranges, query length, and page bounds before reaching Supabase.
- Mortgage inputs reject zero prices, negative or excessive rates, deposits greater than price, and invalid terms. The UI discloses its rate and exclusions.
- Non-functional calculator choices were removed until their Stage 4 implementations exist.
- The fake property-alert success flow was replaced with an honest advisor contact message.
- Database pgTAP coverage increased from 5 to 10 assertions, and CI now invokes `supabase test db`.

## Files added

- `src/search.ts`
- `src/calculators.ts`
- `supabase/migrations/202611240003_stage1_security_hardening.sql`
- `supabase/functions/_shared/security.ts`
- `supabase/functions/track-property-view/index.ts`
- `tests/search.test.ts`
- `tests/calculators.test.ts`
- `tests/edge-security.test.ts`

## Verification performed

| Check | Result |
|---|---|
| ESLint | Passed |
| TypeScript | Passed |
| Vitest | Passed: 20 tests |
| Production build | Passed |
| Playwright mobile/desktop | Passed: 9 applicable tests; one mobile-only case skipped on desktop |
| Migration/RLS pgTAP | Blocked: local Supabase images exhausted the Docker filesystem during extraction |

The database test result is not reported as passed. The GitHub Actions database job now runs reset, pgTAP, and database lint in an environment with sufficient container capacity.

## Required deployment configuration

Before deploying the updated Edge Functions, create a cryptographically random secret of at least 32 characters and set it only in Supabase Edge Function secrets as `RATE_LIMIT_SECRET`. Keep `SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and email secrets server-side. Apply migration `202611240003_stage1_security_hardening.sql` before deploying either Edge Function.

## Remaining Stage 1 blockers

- Execute `supabase db reset`, `supabase test db`, and `supabase db lint --level warning` on CI or a workstation with enough Docker storage.
- Deploy and exercise `submit-enquiry` and `track-property-view` against a configured staging project.
- Confirm production proxy headers so the selected source-IP precedence matches the hosting path.
- Add a managed challenge provider if real traffic shows automated abuse beyond the honeypot and persistent limits.
- Verify production HTTPS/security headers, backup restoration, and monitoring; these require deployment access.

Stage 2 has not been started.
