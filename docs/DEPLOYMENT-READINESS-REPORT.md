# Deployment readiness report

Assessment date: 26 November 2026 (Africa/Lusaka).

## Verdict

**READY FOR STAGING — not ready for production.** The database, Auth, REST and Storage paths now pass against an isolated local Supabase stack. Enquiry and viewing Edge Functions could not start because this execution environment's proxy/certificate chain prevents the Edge Runtime from downloading `https://esm.sh/@supabase/supabase-js@2`; those two hosted journeys remain mandatory staging gates. The requested hero asset set is also incomplete.

| Category | Maximum | Actual | Evidence and deductions |
|---|---:|---:|---|
| Frontend-to-backend integration | 20 | 16 | Real local database/Auth/REST/Storage pass; Edge Function execution blocked locally |
| Authentication and customer accounts | 15 | 13 | Public sign-up, sign-in, session, recovery request, sign-out and two-user isolation pass locally |
| Property and customer journeys | 15 | 11 | Real catalogue/search/save pass; enquiry and viewing Edge Functions remain unexecuted |
| Admin CMS | 10 | 8 | Real staff draft, media upload, image relation, publish and public retrieval pass |
| Security and data integrity | 15 | 13 | 41 pgTAP assertions, RLS denial checks, transactional alert idempotency and dependency audit pass |
| UI/UX, accessibility and performance | 10 | 8 | CI and automated WCAG checks pass; five-image hero unavailable |
| Deployment infrastructure and operations | 15 | 6 | Local migrations/seed pass; hosted configuration, DNS, backups and monitoring remain unverified |
| **Total** | **100** | **75** | **Staging candidate** |

Initial readiness score: 55/100. Previous score: 62/100. Current score: 75/100. Improvement from the initial assessment: 20 points.

Mandatory staging-entry gates now passing: all twelve migrations and seed apply to a fresh local stack; 41 database assertions pass; real property retrieval, Auth, customer isolation, staff authorization, Storage and transactional alert processing pass; `npm audit --audit-level=high` reports zero vulnerabilities. Production gates still open: hosted enquiry/viewing persistence, hosted Auth email delivery and redirect allow-list, environment secrets, Resend/cron delivery, monitoring, backup restore, DNS/HTTPS, owner approval and staging UAT.

## Completed in this slice

- Five dedicated authentication pages and complete password-update flow.
- Same-origin authentication return paths and deliberate sign-out confirmation.
- Site-wide deterministic property assistant.
- Configuration-aware floating direct WhatsApp launcher.
- Existing-property image uploads no longer create a conflicting primary image; failed metadata writes clean up the uploaded file.
- Alert searches and property results are paginated; match and notification creation is transactional.

Final frontend regression: lint passed, TypeScript passed, 66 unit tests passed, production build passed, 83 public Playwright tests passed with one expected desktop skip, and all 12 mocked integration Playwright tests passed. Backend verification added: Supabase CLI 3.4.0 applied twelve migrations plus seed; pgTAP passed 41/41 assertions; real local Auth, REST and Storage journeys passed; dependency audit found zero vulnerabilities.

## Backend verification evidence

- **Verified working:** public registration/sign-in/session/recovery request/sign-out; catalogue and search; customer row ownership; customer role-escalation denial; staff draft/create/publish; anonymous draft isolation; staff media upload and image metadata; customer media-upload denial; favourites; staff CRM read authorization; and idempotent transactional alert creation.
- **Blocked by execution infrastructure:** `submit-enquiry` and `submit-viewing` return non-2xx locally because the Edge Runtime cannot bootstrap the remote Supabase client import. Logs report an unsuccessful proxy tunnel for `esm.sh`; an npm-specifier diagnostic also failed with `UnknownIssuer`. No application handler executed, and the diagnostic source change was reverted.
- **Not run against a hosted project:** email receipt, hosted redirect URLs, Edge secrets, scheduled alerts, Resend delivery, backups and production-like monitoring.

## Priority remaining work

| Priority | Task | Dependency | Acceptance criteria |
|---|---|---|---|
| P0 | Deploy to an isolated Supabase staging project and rerun migrations/pgTAP | Staging Supabase access | Twelve migrations and all 41 assertions pass remotely |
| P0 | Exercise enquiry and viewing Edge Functions in staging | Staging URL/keys, Edge secrets and allowed origin | Both records persist and staff can retrieve them |
| P0 | Verify hosted Auth email and redirects | SMTP/provider configuration and redirect allow-list | Sign-up/recovery emails arrive and return to same-origin pages |
| P1 | Supply four approved hero photographs and Victoria Falls attribution | Owner-approved assets/licence | Five-image 7-second crossfade passes reduced-motion and visibility tests |
| P1 | Confirm direct WhatsApp number | Owner confirmation | Launcher opens the confirmed business conversation |
| P1 | Verify Resend, cron alerts and backup restore | Provider access | Delivery and restore evidence retained |
| P2 | Complete staging UAT, performance audit and DNS/HTTPS checks | Staging deployment | Checklist approved with no release-gate failures |

No production data was modified, and no deployment, merge, commit or remote push was performed during this verification.
