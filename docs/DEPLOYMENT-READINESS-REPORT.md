# Deployment readiness report

Assessment date: 26 November 2026 (Africa/Lusaka).

## Verdict

**NOT READY FOR DEPLOYMENT — development testing.** The local frontend quality gates pass, but core hosted Supabase journeys remain unverified and the requested hero asset set is incomplete.

| Category | Maximum | Actual | Evidence and deductions |
|---|---:|---:|---|
| Frontend-to-backend integration | 20 | 13 | Services and policies exist; no live end-to-end backend run |
| Authentication and customer accounts | 15 | 10 | Dedicated flows implemented; hosted Auth and isolation unverified |
| Property and customer journeys | 15 | 9 | Demo/browser and unit coverage; real catalogue/enquiry unverified |
| Admin CMS | 10 | 6 | Broad implementation and image fix; live role/CRUD testing absent |
| Security and data integrity | 15 | 10 | RLS, validation and transactional alert fix exist; pgTAP not run |
| UI/UX, accessibility and performance | 10 | 8 | CI and automated WCAG checks pass; five-image hero unavailable |
| Deployment infrastructure and operations | 15 | 6 | Runbooks and Netlify config exist; hosting, DNS, backups and monitoring unverified |
| **Total** | **100** | **62** | **Development testing** |

Initial readiness score: 55/100. Final readiness score: 62/100. Improvement: 7 points.

Mandatory release gates currently passing: recovery/rollback documentation, no known critical/high source finding, and local core browser checks. Gates still open: production database connectivity, real property retrieval, real enquiry persistence, live admin authorization, production environment configuration, owner deployment approval, and staging database/auth/storage tests.

## Completed in this slice

- Five dedicated authentication pages and complete password-update flow.
- Same-origin authentication return paths and deliberate sign-out confirmation.
- Site-wide deterministic property assistant.
- Configuration-aware floating direct WhatsApp launcher.
- Existing-property image uploads no longer create a conflicting primary image; failed metadata writes clean up the uploaded file.
- Alert searches and property results are paginated; match and notification creation is transactional.

Final local verification: lint passed, TypeScript passed, 66 unit tests passed, production build passed, and 83 Playwright tests passed with one expected desktop skip for the mobile-only navigation test.

## Priority remaining work

| Priority | Task | Dependency | Acceptance criteria |
|---|---|---|---|
| P0 | Apply migrations to isolated staging and run pgTAP | Staging Supabase access | All DB assertions pass |
| P0 | Exercise catalogue, enquiry, viewing, Auth and admin roles end to end | Staging credentials and test accounts | Controlled journeys persist and respect access boundaries |
| P1 | Supply four approved hero photographs and Victoria Falls attribution | Owner-approved assets/licence | Five-image 7-second crossfade passes reduced-motion and visibility tests |
| P1 | Confirm direct WhatsApp number | Owner confirmation | Launcher opens the confirmed business conversation |
| P1 | Verify Resend, cron alerts and backup restore | Provider access | Delivery and restore evidence retained |
| P2 | Complete staging UAT, performance audit and DNS/HTTPS checks | Staging deployment | Checklist approved with no release-gate failures |

No production data was modified, and no deployment, merge or remote push was performed.
