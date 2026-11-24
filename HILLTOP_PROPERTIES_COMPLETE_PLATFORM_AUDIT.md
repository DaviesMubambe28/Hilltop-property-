# Hilltop Properties Zambia — Complete Platform Audit

Audit date: 24 November 2026 (Africa/Lusaka)  
Audit mode: read-only implementation inspection plus non-destructive local tests  
Repository state: `feature/responsive-property-site`

## 1. Executive summary

Hilltop is a credible early full-stack foundation, not a complete international real-estate platform. The checked-in implementation contains a responsive static/Vite frontend, a Supabase catalogue service, customer authentication and saved listings, enquiry capture through an Edge Function, a basic staff CMS/admin area, a substantial PostgreSQL schema, RLS policies, public media storage, audit triggers, optional Resend email, a basic `wa.me` contact link, and GA4 event hooks.

The majority of the requested advanced product is absent. There is no AI search, interactive map, verification system, comparison engine, appointment scheduler, WhatsApp Business integration, agent workspace, landlord/tenant portals, offers/transactions, marketing automation, market-data engine, or concierge workflow. Several controls overstate capability: “Advanced search” is inert; the newsletter claims to create an alert but only displays a toast; and three calculator choices reuse the mortgage formula.

The local build is healthy: lint, type checking, six unit tests, production build, and five applicable Playwright cases passed. This verification is narrow. Live database, authentication, RLS, storage, Edge Function, email, analytics, and deployment behavior were not verifiable because no service configuration or local Supabase CLI was available. The product is **not production-ready** for the stated requirements.

## 2. Scores and counting method

The requirements document contains 386 atomic checklist bullets across 26 capability groups. Classification is based on code evidence, not visual presence. A strict weighted completeness score gives PASS=1, PARTIAL=0.5, UI ONLY/BACKEND ONLY=0.25, and MOCK/FAIL/MISSING/NOT VERIFIED=0.

| Classification | Atomic requirements |
|---|---:|
| PASS | 31 |
| PARTIAL | 47 |
| UI ONLY | 12 |
| BACKEND ONLY | 19 |
| MOCK | 0 |
| FAIL | 3 |
| MISSING | 255 |
| NOT VERIFIED | 19 |
| **Total** | **386** |

- **Overall implementation completeness: 16.1%** (62.25 weighted equivalents / 386 requirements).
- **Observable implementation completeness: 17.0%** (62.25 / 367 requirements not blocked as NOT VERIFIED).
- **Verification coverage: 7.5%** (29 atomic requirements received a relevant executed check / 386).
- **Feature groups with a full PASS: 0 of 26.**

These figures are intentionally strict. “Backend only” does not become a pass merely because a table exists, and “not verified” is excluded from successful implementation claims.

## 3. Existing architecture

```text
Browser (index/account/admin HTML + TypeScript)
  ├─ Vite-built responsive UI
  ├─ Supabase JS using public URL + anon key
  │    ├─ Auth (email/password, recovery)
  │    ├─ PostgREST (catalogue, accounts, admin/CMS)
  │    ├─ Storage: public property-media bucket
  │    └─ Edge Function: submit-enquiry
  │          ├─ service-role insert into PostgreSQL
  │          └─ optional Resend notification
  ├─ optional GA4 loader/event tracking
  └─ optional wa.me property enquiry link

Supabase PostgreSQL
  ├─ properties, media, taxonomy, locations, agents
  ├─ profiles, saved properties/searches, property views
  ├─ enquiries, notes, follow-ups
  ├─ CMS content/settings/notifications
  └─ RLS, role helpers, audit triggers, indexes
```

Frontend architecture is framework-light TypeScript attached to three HTML entry points. There is no application router: property details are a modal, which prevents property-specific URLs and server-rendered SEO. Supabase is the backend; no independent API server exists. Sensitive enquiry insertion is correctly isolated in an Edge Function with a service-role key. Deployment automation is represented by `.github/workflows/ci.yml`; hosting/domain behavior was not verified.

Primary evidence: `index.html`, `src/app.ts`, `src/account.ts`, `src/admin.ts`, `src/services/*`, `supabase/migrations/*`, `supabase/functions/submit-enquiry/index.ts`, `supabase/tests/rls.sql`.

## 4. Complete feature status table

| # | Capability | Status | Impl. | Verification | Principal finding |
|---:|---|---|---:|---:|---|
| 1 | Advanced search/discovery | PARTIAL | 28% | 12% | Database search, three visible filters, sort support, and pagination exist; most advanced filters/UI do not |
| 2 | AI-powered search | MISSING | 0% | 0% | No model, retrieval, guardrail, or handover implementation |
| 3 | Interactive map search | MISSING | 5% | 0% | Coordinates exist in schema only; no map client or spatial workflow |
| 4 | Property details | PARTIAL | 32% | 8% | Dynamic modal has basic facts, gallery, save, enquiry, WhatsApp; most rich-detail requirements absent |
| 5 | Verification/anti-fraud | MISSING | 3% | 0% | Generic publish status/audit is not a verification system |
| 6 | Property comparison | MISSING | 0% | 0% | No comparison state, UI, calculations, export, or share route |
| 7 | Calculators/investment tools | FAIL | 12% | 18% | Mortgage calculation works narrowly; three named tools incorrectly reuse it; six tools absent |
| 8 | Viewing booking | BACKEND ONLY | 12% | 0% | Enquiry type/date fields exist, but no booking UI, calendar, conflicts, reminders, or lifecycle |
| 9 | Intelligent WhatsApp | PARTIAL | 8% | 5% | Property-specific `wa.me` link only; no Business API or CRM automation |
| 10 | Customer accounts | PARTIAL | 31% | 10% | Registration/login, profile, saved listings, enquiry history exist; most dashboard modules absent |
| 11 | Smart alerts | UI ONLY | 7% | 3% | Saved-search/notification schema exists, but public alert form only displays a toast |
| 12 | Diaspora centre | MISSING | 0% | 0% | No dedicated section or workflows |
| 13 | Investment centre | UI ONLY | 9% | 0% | Investment listing type/static promotion, but no investment-centre tools or documents |
| 14 | Sell/list property | UI ONLY | 5% | 0% | Valuation CTA points to contact; no owner submission/approval workflow |
| 15 | Valuation system | BACKEND ONLY | 8% | 0% | `valuation` enquiry enum exists; required collection and report workflow absent |
| 16 | Landlord dashboard | MISSING | 0% | 0% | No ownership/tenancy domain or portal |
| 17 | Tenant portal | MISSING | 0% | 0% | No lease, rent, receipt, maintenance, or inspection domain |
| 18 | Offers/transactions | MISSING | 0% | 0% | No offer, milestone, payment, transfer, or secure transaction model |
| 19 | Real-estate CRM | PARTIAL | 27% | 4% | Persistent enquiries, assignment/status/notes/follow-up schema; admin exposes only list/status |
| 20 | Agent dashboard | MISSING | 4% | 0% | Agent records exist, but no agent role or assigned-record workspace/isolation |
| 21 | Admin dashboard | PARTIAL | 42% | 6% | Basic stats, property CRUD/uploads, enquiry status, CMS, staff roles; many operational modules missing |
| 22 | Marketing/social automation | UI ONLY | 6% | 0% | Shareable WhatsApp contact and GA hooks only; no campaign automation |
| 23 | Market intelligence | UI ONLY | 6% | 0% | Static journal cards; no sourced statistics/reports/heatmaps |
| 24 | Property concierge | MISSING | 0% | 0% | No requirements-to-match-to-agent workflow |
| 25 | Performance/accessibility | PARTIAL | 43% | 32% | Responsive, optimized hero images and keyboard mobile menu; no current CWV/WCAG/PWA proof |
| 26 | Security/reliability | PARTIAL | 45% | 15% | Good Supabase/RLS baseline; live policies untested and several important controls absent |

## 5. Feature-by-feature evidence and required next action

### 1. Advanced Property Search and Discovery — PARTIAL (28%)

- Frontend: listing tabs and location/type/price selects exist. The advanced-search button has no handler. There is no free-text input, suggestions, bed/bath, size, furnishing, verification, payment, negotiability, reduced/new, amenities, or visible sort UI.
- Backend/database: `listProperties` supports full-text query, location, property type, listing type, price, bedrooms, three sort behaviors, count, and range pagination. `locations.parent_id/province`, amenities, saved searches, and views exist but are not wired into the public journey.
- Test: only credential-free fallback was executed; real combined filtering and database results were NOT VERIFIED.
- Security/reliability: URL parameters are weakly parsed; share state omits listing type and no invalid-input schema is applied.
- Evidence: `index.html`, `src/app.ts`, `src/services/properties.ts`, tables `properties`, `locations`, `amenities`, `saved_searches`, `property_views`.
- Next: build a schema-validated filter model and complete URL-driven UI, then execute integration tests against seeded Supabase.

### 2. AI-Powered Property Search — MISSING (0%)

No UI, API, model provider, retrieval layer, property-grounding contract, multilingual support, or human-handover workflow was found. Next: defer until the catalogue has complete structured fields; then implement retrieval constrained to live property IDs and explicit no-match behavior.

### 3. Interactive Map Search — MISSING (5%)

Latitude/longitude fields exist on locations, branches, and properties, but there is no map SDK, marker rendering, viewport query, geospatial index, privacy offset, directions, travel-time, boundary, or nearby-place service. Evidence: initial migration only. Next: select a map provider and add privacy-safe spatial queries and filtered marker tests.

### 4. Comprehensive Property Detail Pages — PARTIAL (32%)

- Dynamic modal renders reference, listing type, title, price, description, bedrooms, bathrooms, location, images, enquiry, and optional WhatsApp. Save is available on cards.
- Missing: dedicated URL/page, explicit availability, floor/land display in modal, full-screen media, video/360/floor plans, utilities, ownership status, terms/costs, map/nearby data, agent presentation, compare/share, viewing booking, brochure, dates, similar listings.
- Tests did not exercise a real listing because Supabase was unconfigured.
- Evidence: `src/app.ts`, `src/services/properties.ts`, `properties`, `property_images`, `property_features`, `property_amenities`.
- Next: create canonical property routes and a typed detail query before expanding media and enquiry actions.

### 5. Property Verification and Anti-Fraud — MISSING (3%)

Publishing and generic audit logs exist, but there is no verification status, evidence/document domain, reviewer decision, fraud report, duplicate detector, reconfirmation date/reminder, or confidential bucket. A published status must not be represented as verified. Next: add a separate approval/verification state machine and private evidence storage with reviewer audit records.

### 6. Property Comparison — MISSING (0%)

No implementation found. Next: first normalize the comparable fields and verification metadata, then add a maximum-four selection model, URL-safe IDs, derived price/m², and export/share tests.

### 7. Financial Calculators — FAIL (12%)

The mortgage formula produces a monthly estimate and passed one mobile and one desktop browser test. However interest is hardcoded at 15%, assumptions are not disclosed, currency is fixed, and edge validation is weak. Affordability, rental yield, and buying cost buttons only change the heading while reusing mortgage inputs/formula; ROI, rent-versus-buy, deposit, installment, converter, and price/m² are absent. Evidence: `index.html`, `script.js`, `e2e/public-site.spec.ts`. Next: separate each calculator into tested domain functions with explicit Zambia-specific assumptions.

### 8. Viewing Booking — BACKEND ONLY (12%)

`enquiry_type=viewing` and `preferred_date` are supported by schema, validation, and Edge Function, but the public form always submits `type: property`. There is no time selector, availability, appointment table, uniqueness/conflict rule, assignment, confirmation, reminders, reschedule/cancel, feedback, or calendar integration. Next: model appointments separately and enforce conflicts transactionally.

### 9. Intelligent WhatsApp — PARTIAL (8%)

Property detail can open `wa.me` with title/reference. This is a redirect, not WhatsApp Business. There are no inbound webhooks, templates, FAQ automation, recommendations, booking/reminders, brochure delivery, agent routing, consent, or CRM conversation linkage. Evidence: `src/app.ts`, `.env.example`. Next: integrate the Business API server-side with verified webhook signatures and CRM message records.

### 10. Customer Accounts — PARTIAL (31%)

Supabase registration/login/recovery, auto-created profile, profile update, saved listings, removal, and enquiry history exist. RLS scopes profile/saved data/enquiries to the authenticated user. Missing saved-search UI, recent views, upcoming viewings, alerts, documents, comparisons, preferences/privacy/notifications, and transactions. Live isolation was not verified. Evidence: `src/services/auth.ts`, `src/account.ts`, `account.html`, related RLS policies. Next: execute two-user isolation tests before adding dashboard modules.

### 11. Smart Alerts — UI ONLY (7%)

The database has `saved_searches.alert_enabled` and `system_notifications`, but there is no matching job, database trigger, scheduler, delivery provider, preferences, or consent workflow. The newsletter handler claims success without persistence. Evidence: `script.js`, initial migration. Next: remove the misleading success state until an authenticated subscription and scheduled matcher/delivery pipeline exists.

### 12. Diaspora Property Centre — MISSING (0%)

No meaningful implementation. Next: define service ownership and compliance requirements before implementing remote booking, document exchange, currency/time-zone presentation, progress, and dedicated agent workflows.

### 13. Property Investment Centre — UI ONLY (9%)

The catalogue supports an `investment` listing type and the home page promotes investment content. No dedicated categories, opportunity profiles, memoranda, feasibility/site plans, confidentiality requests, yield data, or consultation booking exist. Next: define an investment-specific schema and private-document request process.

### 14. Sell or List Your Property — UI ONLY (5%)

The sell/valuation banner links to the generic contact area. There is no owner intake, specification/media/document upload, preference, verification, approval, or progress tracking. Staff-only property creation prevents automatic public owner publication, but no submission workflow exists. Next: implement a separate owner-submission table and private uploads with staff approval.

### 15. Property Valuation — BACKEND ONLY (8%)

The enquiry enum and Edge Function accept `valuation`, but the UI cannot submit the required valuation data and there are no comparable records, appointments, assignments, reports, history, or rental estimate. Next: build professional valuation case management and clearly label any later automated estimate.

### 16. Landlord Dashboard — MISSING (0%)

No property ownership authorization, tenancy, statement, balance, maintenance, document, reporting, or communication model exists. Next: this requires a new bounded domain and stricter property-level RLS, not an extension of the customer page.

### 17. Tenant Portal — MISSING (0%)

No implementation found. Next: establish lease/tenant authorization, verified payment-instruction controls, receipts, private documents, maintenance cases, inspections, and renewal workflows.

### 18. Offers and Transaction Tracking — MISSING (0%)

No offers, histories, milestones, due diligence, agreements, payments, transfer, secure communications, or documents exist. Next: design an auditable transaction state machine and private storage before exposing UI.

### 19. Real Estate CRM — PARTIAL (27%)

Public enquiries can be persistently inserted through an Edge Function. Database fields cover customer, property, assignee, source, status; tables cover notes and follow-ups; the admin shows enquiries and updates status. Missing public end-to-end verification, assignment UI, customer requirements/budgets, branch/category routing, duplicate-person detection, notes/follow-up UI, pipeline/loss analysis, appointments, WhatsApp conversation linkage, performance, attribution detail, and commission. Evidence: `enquiries`, `enquiry_notes`, `follow_ups`, Edge Function, `src/admin.ts`. Next: verify lead capture end-to-end, then expose assignment/notes/follow-ups with audit coverage.

### 20. Agent Dashboard — MISSING (4%)

An `agents` directory table exists, but application roles are only customer/editor/admin. Editors receive broad staff policies rather than assigned-agent isolation. There is no agent workspace, calendar, leads, tasks, offers, statistics, commissions, or documents. Next: define agent identity and record-level assignment policies before building the portal.

### 21. Complete Admin Dashboard — PARTIAL (42%)

Available: aggregate dashboard counts/recent enquiries; property create/edit/archive/publish fields and uploads; enquiry list/status; pages/articles/FAQs/testimonials/branches/partners/projects; role assignment and account disabling. Missing or incomplete: customer management, agent management, viewings, verification, analytics, documents, marketing, site settings UI, listing approval workflow, bulk import, audit-log UI, full media/gallery management, exports, notifications, and comprehensive website configuration. Content form exposes only generic fields and cannot manage every table field. Next: prioritize operational workflows and test editor/admin separation.

### 22. Marketing and Social Automation — UI ONLY (6%)

There is a property-specific WhatsApp URL and optional GA event loader. No brochure generator, social captions/QR, social APIs, email marketing/newsletters, campaign pages/reporting, UTM attribution model, scheduler, or stale-promotion cleanup exists. Next: correct the fake alert UI, then add attributable campaigns only after consent/delivery governance.

### 23. Local Market Intelligence — UI ONLY (6%)

The journal contains hardcoded guide cards. No CMS-rendered guide pages, sourced market data, trend calculations, heatmaps, rental reports, or downloads were found. Next: establish data provenance and publishing/review dates before presenting statistics.

### 24. Personal Property Concierge — MISSING (0%)

No structured requirements, matching, dedicated assignment, shortlist, viewing, or progress workflow exists. Next: reuse a mature CRM/customer-preference model once built.

### 25. Performance and Accessibility — PARTIAL (43%)

Responsive layout, compressed responsive hero images, lazy-loaded gallery images, keyboard/touch mobile menu, semantic labels, visible error states, and catalogue retry exist. The build is modest except a 300 kB validation/shared chunk. No audit in this run measured LCP, INP, CLS, WCAG 2.2 AA, or search latency. Low-data mode, progressive gallery placeholders, PWA, offline behavior, and multi-browser tests are absent. Tests only use Chromium mobile/desktop projects. Next: run Lighthouse/axe and Web Vitals against configured staging, then fix measurable failures.

### 26. Security and Reliability — PARTIAL (45%)

Strengths: Supabase Auth, no service-role key in frontend, server-side Zod validation, RLS enabled on all application tables, role helpers, admin-only role RPC, file size/type restrictions, escaped HTML interpolation, idempotency key, safe generic Edge Function errors, and selected audit triggers.

Gaps: pgTAP policies were not executed; no admin MFA enforcement; property media bucket is public and no private document store exists; published-but-unavailable properties remain readable via direct API; anonymous property-view inserts are abuseable; rate limiting is email-only and race-prone; no CAPTCHA/bot service; agents have no per-assignment isolation; audit coverage omits profiles/role changes and several supporting tables; no verified HTTPS/deployment headers, backup restore, vulnerability scan, error monitor, retention/deletion/export, or privacy-request workflow. Evidence: migrations, Edge Function, `.env.example`, admin/client services. Next: P0 policy tests and abuse hardening, then MFA/private documents/audit/backup restoration.

## 6. Successfully tested workflows

- Lint and TypeScript quality gates.
- Six configuration/validation/escaping unit tests.
- Production bundle generation.
- Credential-free page fallback on mobile and desktop.
- Mobile menu keyboard/touch operation.
- Mortgage repayment output on mobile and desktop.

Full observed results are in `HILLTOP_PROPERTIES_TEST_RESULTS.md`.

## 7. Failed and unverified tests

- Database/RLS suite was not executed: the `supabase` CLI is absent. The five assertions therefore remain NOT VERIFIED, not passed.
- Affordability, rental yield, and buying-cost UI paths are functionally incorrect because each invokes the mortgage calculation.
- No configured service environment existed, so the core catalogue → property → enquiry → CRM → staff-status journey could not be tested.
- No live external integration could be verified.

## 8. Mock/demo and misleading-state findings

No hardcoded catalogue records or fake customer records are used as the dynamic catalogue. The home page does contain static editorial/property-marketing sections. The most material misleading state is the newsletter handler: it says “Your property alert has been created” without persistence or delivery. The calculator selector similarly presents four tools while implementing only one formula. These are classified UI ONLY/FAIL, not mock backend functionality.

`supabase/seed.sql` contains configuration/taxonomy/branch seed data and does not establish production listings. It should not be mistaken for live inventory.

## 9. Database and backend findings

The schema is coherent for the current foundational scope: UUID keys, constraints, foreign keys, timestamps, query indexes, generated full-text search, update triggers, RLS, and role helpers are present. Core catalogue and enquiry queries avoid raw SQL injection. The Edge Function properly owns service-role usage.

Important limitations:

- The domain model does not represent verification, appointments, documents, offers/transactions, leases/payments, maintenance, campaigns, or agent commissions.
- Public availability enforcement is split between client query and RLS; direct API consumers can read any published record even if `is_available=false`.
- The public agents policy does not filter `is_published`; all agent rows are selectable.
- Anonymous view tracking has no controlled server endpoint.
- Audit triggers cover selected primary tables, not role changes or all sensitive operations.
- The admin property form omits relationships and many schema fields, so the database is richer than the CMS.

## 10. Security findings

### P0/P1 findings

1. **RLS is not verified in execution.** Policies look directionally sound, but the local database suite could not run.
2. **Public-policy mismatch.** `properties_public_read` checks only `status='published'`; intended availability filtering is client-side.
3. **No confidential document boundary.** The only bucket is public property media. Ownership/customer/transaction documents must never use it.
4. **No agent isolation model.** Editors have broad staff access; this cannot satisfy assigned-agent confidentiality.
5. **Weak abuse controls.** Enquiry limit keys on attacker-controlled email and property-view inserts are open to anonymous writes.
6. **Role-change audit gap.** `set_staff_role` changes privileges but `profiles` is not included in audit triggers.

No committed secret was found during targeted configuration inspection; placeholders are used. This is not a full repository-history secret scan or dependency vulnerability audit.

## 11. Performance and accessibility findings

The UI is responsive and the executed Chromium journeys are usable. Image assets are WebP and hero variants support mobile. Gallery images use native lazy loading. Error/loading/empty states exist for the catalogue.

No fresh Lighthouse, axe, screen-reader, INP, LCP, CLS, network-throttling, or search-load test was executed, so no score is claimed. Property details in a modal weaken deep linking and SEO, and focus restoration/trapping was not explicitly tested. All four calculator modes share a single form, causing usability and correctness failures.

## 12. Third-party integration findings

| Integration | Implementation | Verification |
|---|---|---|
| Supabase | Auth/PostgREST/Storage/Edge Function code and migrations | NOT VERIFIED live |
| Resend | Optional server-side enquiry notification | NOT VERIFIED; credentials absent |
| WhatsApp | `wa.me` redirect with property reference | Static code inspected; not Business API |
| Google Analytics 4 | Optional script/event hooks | NOT VERIFIED; measurement ID absent |
| Maps | None | MISSING |
| Calendar | None | MISSING |
| Browser push | None | MISSING |

## 13. Technical debt and blockers

- Framework-light scripts duplicate behavior: legacy `script.js` intercepts the search and alert forms while TypeScript also owns search behavior.
- `src/admin.ts` and `src/account.ts` are compressed into long statements, increasing review and maintenance risk.
- The client type model is handwritten; generated database types are not present despite a script.
- Rich domain tables exist without corresponding CMS controls, creating operational gaps.
- Tests cover validation/fallback, not the business-critical connected system.
- External blockers: configured staging Supabase, CLI/container access for migrations, email/GA credentials, WhatsApp Business/provider decisions, map provider, hosting/domain access, and business rules for verification/transactions.

## 14. Development priorities

### P0 — Critical

- Provision isolated staging; apply migrations; run and expand pgTAP for anonymous/customer/editor/admin and cross-user isolation.
- Fix public availability/agent publication policies and add a private documents bucket before any confidential upload.
- Execute catalogue → property → enquiry → CRM workflow; harden rate limits and bot protection.
- Audit and log privilege changes; enforce production secret, HTTPS, backup, and restore controls.
- Remove or relabel false-success alert and incorrect calculator experiences.

### P1 — Essential

- Build canonical property detail pages with agent, availability, structured fields, share/brochure, and viewing actions.
- Implement appointment scheduling with transactional conflict prevention and reminders.
- Complete CRM assignment, notes, follow-ups, routing, and audit UI.
- Implement verification/approval/reconfirmation with private evidence.
- Define agent identity and record-level access before an agent dashboard.
- Replace `wa.me`-only assumptions with a consent-aware Business API workflow where required.

### P2 — Competitive

- Complete advanced URL search, saved searches/recent views, maps, comparison, smart alerts, customer dashboard, calculators, investment and diaspora services.
- Introduce grounded AI search only after structured catalogue completeness and evaluation tests.

### P3 — Advanced

- Landlord/tenant portals, transaction management, valuation cases, marketing automation, sourced market intelligence, and concierge matching.

## 15. Production-readiness assessment

**Verdict: NOT READY for production against the stated platform scope.**

The repository is suitable as a foundation or controlled pre-production prototype. It can only be considered for a limited catalogue/enquiry launch after P0 database/RLS tests, configured end-to-end verification, security-policy fixes, real monitoring/backups, legal/privacy review, staging acceptance, and removal of misleading UI. It does not currently deliver the broader 26-capability platform promised by the requirements.

## 16. Audit evidence index

- Frontend: `index.html`, `account.html`, `admin.html`, `script.js`, `styles.css`, `admin.css`.
- Application code: `src/app.ts`, `src/account.ts`, `src/admin.ts`, `src/services/auth.ts`, `src/services/properties.ts`, `src/services/enquiries.ts`, `src/integrations/analytics.ts`, `src/validation.ts`.
- Backend/database: `supabase/migrations/202611240001_initial_schema.sql`, `supabase/migrations/202611240002_audit_and_admin.sql`, `supabase/functions/submit-enquiry/index.ts`, `supabase/tests/rls.sql`, `supabase/seed.sql`.
- Tests/configuration: `tests/*`, `e2e/public-site.spec.ts`, `package.json`, `playwright.config.ts`, `vite.config.ts`, `.github/workflows/ci.yml`, `.env.example`.
- Detailed executed results: `HILLTOP_PROPERTIES_TEST_RESULTS.md`.
