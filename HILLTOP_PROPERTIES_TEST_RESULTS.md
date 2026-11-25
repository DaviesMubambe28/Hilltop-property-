# Hilltop Properties Zambia — Test Results

Audit date: 24 November 2026 (Africa/Lusaka)  
Repository state tested: `feature/responsive-property-site`  
Environment: local Codex workspace; no Supabase URL/key, Resend key, WhatsApp Business credentials, map key, hosting account, or production access was available.

## Test scope and limitations

Tests were executed against the checked-out source without modifying application code, schemas, or data. Browser tests ran against Vite's local server in the application's deliberate “unconfigured Supabase” state. No test records were created. Database/RLS, live authentication, storage, Edge Functions, email, analytics delivery, and production HTTPS could not be exercised without a running Supabase stack or deployment credentials.

## Automated command results

| ID | Command / case | Expected | Observed | Result |
|---|---|---|---|---|
| T-001 | `npm run lint` | ESLint completes without errors | Completed without reported errors | PASS |
| T-002 | `npm run typecheck` | TypeScript completes without errors | `tsc --noEmit` completed successfully | PASS |
| T-003 | `npm test` | Unit tests pass | 2 files, 6 tests passed | PASS |
| T-004 | `npm run build` | Production bundle builds | Vite transformed 156 modules and produced `dist`; build completed | PASS |
| T-005 | Playwright, mobile: site usable without credentials | Page loads and configuration fallback appears | Passed in 963 ms | PASS |
| T-006 | Playwright, mobile: navigation keyboard/touch operable | Menu opens, exposes links, and closes | Passed in 663 ms | PASS |
| T-007 | Playwright, mobile: calculator repayment estimate | Mortgage inputs produce an estimate | Passed in 871 ms | PASS |
| T-008 | Playwright, desktop: site usable without credentials | Page loads and configuration fallback appears | Passed in 621 ms | PASS |
| T-009 | Playwright, desktop: mobile navigation | Not applicable to desktop project | Explicitly skipped by test | SKIPPED |
| T-010 | Playwright, desktop: calculator repayment estimate | Mortgage inputs produce an estimate | Passed in 688 ms | PASS |
| T-011 | `npm run test:db` | Supabase starts test DB and executes pgTAP | Command failed before tests: `supabase: not found` | NOT VERIFIED |

Overall automated result: lint, type check, 6 unit tests, build, and 5 applicable browser tests passed; one browser test was intentionally skipped. The 5 pgTAP RLS assertions were not executed.

## Unit cases executed

| Case | Expected | Observed | Result |
|---|---|---|---|
| Environment parser accepts a valid Supabase URL and anon key | Returns typed public configuration | Passed | PASS |
| Environment parser handles missing configuration | Returns the application's unconfigured state | Passed | PASS |
| Enquiry validation accepts valid input | Schema returns success | Passed | PASS |
| Enquiry validation rejects invalid email | Schema returns validation failure | Passed | PASS |
| Enquiry validation requires consent | Schema rejects false consent | Passed | PASS |
| HTML text escaping neutralises unsafe characters | Reserved characters are encoded | Passed | PASS |

Source: `tests/config.test.ts`, `tests/validation.test.ts`.

## Static workflow verification

These checks establish that code paths exist; they are not end-to-end passes.

| Workflow | Expected | Observed | Outcome |
|---|---|---|---|
| Catalogue query | Published, available records filtered and paginated from Supabase | `listProperties` builds an RLS-backed Supabase query with location, type, listing type, price, bedrooms, sort, and range | BACKEND ONLY / NOT LIVE-VERIFIED |
| Property enquiry | Valid form invokes Edge Function and persists one CRM record | Client validates and calls `submit-enquiry`; Edge Function validates, de-duplicates by UUID, rate-limits by email, inserts, and optionally emails staff | NOT VERIFIED end-to-end |
| Customer account | Authenticated user sees own profile, saved listings, and enquiries | UI and owner-scoped queries exist; RLS owner policies exist | NOT VERIFIED end-to-end |
| Admin access | Only active editor/admin can open admin UI | Client guard plus RLS helpers/policies exist | NOT VERIFIED against live roles |
| Property administration | Staff can create/update/archive properties and upload images | UI and Supabase operations exist; storage restrictions exist | NOT VERIFIED end-to-end |
| CMS | Staff manages seven content collections | Generic UI and table operations exist | NOT VERIFIED end-to-end |
| Staff role update | Admin changes application role | `set_staff_role` checks `is_admin()` and is granted only to authenticated users | NOT VERIFIED in database |
| Anonymous data isolation | Anonymous cannot read enquiries/drafts or write properties/audit logs | Five pgTAP assertions exist | NOT VERIFIED; Supabase CLI unavailable |

## Negative and edge-case findings

| ID | Test / inspection | Expected | Observed | Result |
|---|---|---|---|---|
| N-001 | Open Affordability calculator | Affordability-specific fields/formula | Mortgage fields and mortgage formula reused; only title changes | FAIL |
| N-002 | Open Rental yield calculator | Rent/value inputs and yield calculation | Mortgage fields and mortgage repayment formula reused | FAIL |
| N-003 | Open Buying cost estimator | Zambia purchase-cost inputs and disclosed assumptions | Mortgage fields and mortgage repayment formula reused | FAIL |
| N-004 | Submit newsletter/property alert form | Persist preference and configure delivery | Toast says alert was created; no database/API call occurs | UI ONLY |
| N-005 | Click Advanced search | Open advanced filters | Button has no event handler or target workflow | UI ONLY |
| N-006 | Property unavailable but published | Public policy should enforce intended public availability | Service filters `is_available=true`, but RLS permits every published row to be directly selected | SECURITY GAP |
| N-007 | Anonymous view-event insertion | Abuse-resistant tracking | RLS permits anonymous inserts; no server-side rate limit or validation path was found | SECURITY GAP |
| N-008 | Enquiry abuse | Robust spam/rate controls | Limit is five submissions/10 minutes per submitted email; no CAPTCHA, IP/device control, or durable limiter | PARTIAL |
| N-009 | Calculator zero/negative/edge inputs | Validation and finite, accurate results | Price/deposit allow zero, deposit may exceed price, assumptions are undisclosed, and only browser `min` constraints exist | FAIL / PARTIAL |
| N-010 | Search invalid URL inputs | Invalid values safely rejected | `page` may become `NaN`; price values are converted without schema validation | PARTIAL |

## Coverage gaps

No executed tests currently cover:

- A live Supabase catalogue query, combined filters, pagination data, or query performance.
- Registration, login, password recovery, session expiry, or cross-account isolation.
- Enquiry persistence, duplicate submission race behavior, email delivery, or failure recovery.
- Admin property CRUD, archive, uploads, CMS, staff roles, or audit records.
- Editor-versus-admin and agent-level authorization boundaries.
- Storage MIME spoofing/content inspection or private document access.
- WhatsApp delivery, Google Analytics ingestion, maps, browser notifications, or calendar integrations.
- Screen-reader behavior, WCAG 2.2 AA conformance, INP, LCP, CLS, PWA support, or multi-browser compatibility.
- Backup restoration, incident monitoring, vulnerability scanning, retention, or privacy workflows.

## Test conclusion

The local quality gates prove the checked-in frontend compiles and a narrow set of credential-free interactions works. They do not prove that the platform works as a connected real-estate system. Production claims must remain blocked until Supabase migrations and pgTAP run in an isolated environment and the core visitor-to-enquiry-to-staff workflow is exercised with real configured services.
