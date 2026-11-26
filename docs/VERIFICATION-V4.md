# Reconstructed v4 verification

Actual starting baseline: npm ci; lint; TypeScript; 59 unit tests; production build; 43 applicable public browser tests plus one pre-existing desktop skip; 14 axe checks.

## Final local checks
- ESLint and TypeScript passed.
- Vitest: 63 tests passed across 13 files. Four category/price presentation unit regressions added, plus browser regressions for missing images, land criteria, drawers, map modes, narrow comparison and enquiry/viewing recovery.
- Production build passed.
- Public Playwright: 69 passed; one pre-existing desktop skip for mobile-only navigation. Includes 22 axe page/viewport checks, all with zero serious/critical violations.
- Isolated service Playwright: 12 passed. Includes mobile/desktop successful and failed mocked P0 journeys, real loading/empty/error/missing-photo states and map-tile failure recovery. Two additional axe audits cover the mocked real Leaflet map failure state. Two related-property failure audits, six available entry-state audits (customer, staff and unavailable property) and eleven open calculator/filter/lightbox audits also passed, for 43 total executed axe checks. Authenticated portals remain unverified.
- Mutation test: inverted price-null condition in an isolated copy was rejected by regression tests. Temporary mutation files removed.
- 98 real rendered screenshots at all seven required sizes, with no page errors, broken loaded images, material page overflow or unexpected main-content elements outside the viewport. Intentional gallery/comparison/map contained scrolling excluded from geometric overflow detection.
- Backend/security integrity: no diff against e55bfd8 in supabase/, authentication, RLS-related service modules, customer account workflows or administrative operational code. No production security/runtime claim is inferred from unchanged files.

## Performance
Production output served locally with gzip for text assets, actual WOFF2/WebP files, fresh Chromium contexts at 390×844, 150ms latency, 200,000 bytes/s download, 93,750 bytes/s upload and 4× CPU slowdown. Three runs per route, no user input, measured through five seconds after load. These are controlled local laboratory observations of unconfigured production states, not field metrics or populated live-inventory benchmarks. Transfer includes navigation and all observed resources.

| Route | Median LCP ms | Maximum observed CLS | Median transferred bytes |
|---|---:|---:|---:|
| home | 1300 | 0.0003 | 243664 |
| catalogue | 1196 | 0.0306 | 191893 |
| comparison | 752 | 0.0000 | 179955 |

Comparable starting-commit home measurement (three quiet runs with the same network/CPU/viewport and gzip serving): median LCP 1,996 ms; median transfer 421,368 bytes; maximum CLS 0. The final home transfer reduction is computed below from the observed final bytes, not from a Lighthouse estimate.

Browser: Chromium 156.0.8078.79 on Debian 13.

Reproduce after `npm run build`: start `node docs/verification-scripts/gzip-preview.mjs`, then run `node docs/verification-scripts/performance-audit.mjs`. The default preview binds only 127.0.0.1:4175. Other audits use the existing dev server at 4174 unless AUDIT_BASE is set.

Font: one 76,260-byte Source Serif 4 regular WOFF2; no font preloads. The WOFF2 cmap was directly decoded and checked for required currency symbols. The media-gated mobile hero is selected without the desktop hero preload. Manrope remains a documented unavailable official dependency.

Original v3 resource budget was unavailable. Reconstructed provisional initial mobile ceiling: 300 KiB. CLS target: <=0.1; LCP aspiration: <=2.5s. Any aspiration not met is recorded as a weakness rather than hidden by a numerical score. INP, authenticated portals, real device UAT, field experience and live service delivery remain unverified.

## Verification failures investigated
Earlier concurrent Playwright runs shared artifact output and produced an ENOENT teardown failure; separate output directories resolved this. Placing traces under work/ exposed a Vite watcher issue: generated HTML snapshots triggered page reloads during tests. Generated artifacts are now explicitly ignored. Additional regressions verified gallery network-failure recovery and category-aware filters that remove inapplicable residential criteria. Unavailable detail pages no longer expose an empty related-properties section. Native calculator/auth/detail dialogs have accessible names. Expanded audits found a map visible-label mismatch and an attribution link relying on colour; both were corrected without weakening assertions. Loading screenshots hold the mocked response until capture, so filenames describe the actual rendered state. A related-property query used the underlying table name rather than its selected relationship alias; the read query now uses the alias and an inner relationship, with two request-shape regressions. Two further regressions ensure a failed recommendations request cannot replace a valid property page or its enquiry controls. The error fixture uses HTTP 400, matching an invalid query, rather than waiting through automatic retries of a 503. Detail pages no longer make unused search-option requests. A real missing favicon 404 was corrected using the existing favicon artwork. The final console audit covers fourteen routes/states after network idle.

## Scope limits
Chrome DevTools MCP was not available; isolated Playwright/Chromium provided DOM, screenshot, axe, console/pageerror and CDP performance evidence. Shared Cloud desktop competitor inspection failed before opening a page. No real customer testing, real enquiry/email delivery or authenticated role-screen acceptance is claimed. See EXTERNAL-BLOCKERS.md and COMPETITOR-BENCHMARK.md.

Observed home median transfer reduction against the measured starting commit: 42.2%. This is an unconfigured mobile lab comparison, not a live-inventory or field-performance claim.
