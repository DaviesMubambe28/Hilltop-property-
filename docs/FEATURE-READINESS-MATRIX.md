# Feature readiness matrix

Assessment date: 25 November 2026. “Verified” means evidence was produced in this repository or isolated test environment; it does not imply live staging verification.

| Capability | Status | Verification and evidence | Outstanding work / dependency | Production readiness |
|---|---|---|---|---|
| Public navigation and responsive layout | Fully implemented and locally verified | 29 applicable Playwright journey checks; overflow and internal-link checks at mobile and desktop sizes | Repeat on the deployed hostname | Ready after staging smoke test |
| Property search, filters, sort and pagination | Implemented; live data unverified | Unit search tests and development catalogue journey with 11 visibly labelled fixtures | Authorised staging Supabase inventory | Blocked |
| Property catalogue data | Implemented; fixture-verified | Supabase query layer, migrations and synthetic development preview | Owner-approved real inventory | Blocked |
| Property detail and similar listings | Implemented; fixture-verified | Responsive preview, route, gallery and conversion-action Playwright checks | Verify real records, missing-image behaviour and availability against staging | Blocked |
| Gallery lightbox | Fully implemented and locally verified | Keyboard arrows, close, focus restoration and axe scan | Real listing photography | Ready after content approval |
| Comparison | Implemented; fixture-verified | Two-property development comparison journey | Live listing query and persistence on staging | Blocked |
| Map discovery | Partially verified | Approximate-coordinate privacy handling and unit coverage | Map provider token, approved coordinates and staging browser test | Blocked |
| Saved properties | Implemented; live flow unverified | Customer code and RLS policies exist | Authenticated staging account and cross-user denial test | Blocked |
| Saved searches and alerts | Implemented; live delivery unverified | Truthful failure state, DB schema and alert Edge Function | Scheduler, email provider and staging persistence/delivery test | Blocked |
| Enquiries | Implemented; live flow unverified | Validated Edge Function, rate-limit design, RLS tests and failure-state browser tests | Function deployment, secrets, email provider and controlled staging submission | Blocked |
| Viewing appointments | Implemented; live flow unverified | Migration constraints, Edge Function, portal and CRM paths | End-to-end customer/staff staging journey and delivered notification | Blocked |
| Seller submission | Implemented; live flow unverified | Customer submission form, private document design and policies | Storage/Auth staging test with authorised files | Blocked |
| Customer registration, login and recovery | Implemented; live flow unverified | Supabase Auth integration and safe unconfigured state | Auth redirect allow-list, mail configuration and staging accounts | Blocked |
| Customer portal | Implemented; live flow unverified | Profile, saved items, alerts, submissions, services, enquiries and appointments code | Authenticated staging journey and cross-user isolation checks | Blocked |
| Staff CRM | Implemented; database-verified only | CRM migration, role functions and isolated PostgreSQL policy assertions | Staff staging account, branch assignment and browser workflow | Blocked |
| Admin and staff access | Implemented; database-verified only | RBAC/RLS migrations; 32/32 isolated RLS assertions passed previously | Verify Supabase Auth claims and role administration on staging | Blocked |
| Storage and media uploads | Implemented; service unverified | Bucket policies and upload restrictions in migrations | Complete Supabase Storage service and malicious-file tests | Blocked |
| Mortgage calculator | Fully implemented and locally verified | Amortisation, zero-interest, invalid, non-finite and boundary unit/browser tests | Owner/legal review of assumptions copy | Ready after business review |
| Affordability calculator | Fully implemented and locally verified | Repayment-ratio, zero-interest and invalid-capacity tests | Owner review of 10–60% configurable ratio | Ready after business review |
| Rental-yield calculator | Fully implemented and locally verified | Gross/net, zero rent and expense-boundary tests | Owner review of expense assumptions | Ready after business review |
| Buying-cost estimator | Fully implemented and locally verified | Supplied-cost total and negative-value tests | Current Zambian fee/tax values must be supplied by the user; no rates are fabricated | Ready as user-input estimate |
| WhatsApp links | Implemented; configuration-dependent | Property-aware message construction | Approved business number and staging device check | Blocked |
| Email notifications | Implemented; service unverified | Edge Function integration points and secret separation | Resend credentials, verified sender and staging recipients | Blocked |
| Analytics | Configuration-dependent | Consent-aware integration points | Approved GA4 identifier, consent policy and staging validation | Blocked |
| SEO metadata, sitemap and robots | Implemented; hostname review required | Page metadata and production files in `public/` | Confirm final hostname, routes and indexing policy | Conditional |
| Accessibility | Automated checks passed; manual audit incomplete | Axe: 14/14 representative mobile/desktop checks with no critical/serious findings; keyboard flows covered | Manual screen-reader, zoom and device review | Conditional |
| Performance | Production-build laboratory verified | Lighthouse mobile: performance 96–99, accessibility 95–100, CLS 0–0.028 | Homepage LCP 2.7 s misses 2.5 s target; repeat on staging/CDN; no field INP data | Conditional |
| Database migrations and RLS | Isolated database verified | Clean migration replay; 32 RLS and 9 demo-data assertions previously passed | Full Supabase service test and authorised staging dry-run/push | Blocked |
| Backup and recovery | Documented, not exercised | Staging/production runbooks | Managed backup, disposable restore and recorded RTO/RPO | Blocked |
| Competitor benchmark | Blocked by access | Precise limitations in `COMPETITOR-BENCHMARK.md` | Legitimate access to named sites | Not a launch blocker |

## Readiness summary

The frontend and database design are substantial and locally testable, but no authorised staging project or live inventory was available. Authentication, Storage, Edge Function delivery, notification delivery and cross-user privacy must therefore remain blocked rather than being inferred from fixtures or standalone PostgreSQL tests.
