> Reconstructed on 26 November 2026 under explicit owner authorisation. This is not recovered v3 material or evidence of historical approval.

# Reconstructed UI/UX master specification

## Capability map and build order
Foundation → homepage → shared property presentation → catalogue → detail/conversion → authenticity/P0 → comparison → map → company/resources → portals → verification → evaluation.
Existing service contracts are preserved. No new backend capabilities are introduced.

## Source and commands
HTML route entries at repository root; shared styles.css; public-pages.css and admin.css; src for TypeScript; tests for Vitest; e2e for Playwright; docs/references for authored target compositions; docs/screenshots/reconstruction for actual renders. Run `npm run ci`, `npm run test:e2e`, `npm run dev -- --host 127.0.0.1`.
Use existing TypeScript types, escaped dynamic HTML via safeText and native DOM controls. Example: `button.setAttribute('aria-pressed', String(selected));`.

## Foundation
Single token system for colour, fonts, spacing and radii. Sans body/control text, serif editorial headings. Font assets only from official repositories, with licence notices. Swap rendering, no unnecessary font preload, responsive image preload and measured mobile transfer/CLS. Fallback fonts remain acceptable if official retrieval fails.

## Homepage
Shared navigation; compact architectural presentation explicitly labelled illustrative when not genuine; immediate quick search; curated collection; Explore Zambia text links without unsupported counts/photographs; Signature advice without invented estate data; honest company assistance; tools/resources and professional footer. Search must not be preceded by long promotional sections. No homepage map.

## Cards and catalogue
Ledger: image or neutral missing-photo state; listing/verification status; price including period; title; location; category-specific facts; save, compare and detail controls. No bedrooms on plots; no residential room claims for offices. One column on mobile, two on tablet, three on wide screens. Catalogue header compact; quick search, sorting, optional advanced drawer; URL persists filters and result/map mode through history. Loading, zero matches, API failure and configuration absence have helpful recovery paths.

## Details and conversion
Meaningful primary gallery; native lightbox with keyboard navigation, Escape and focus return; reference/type/location/price before detailed facts; category-specific specification ledger; sticky enquiry sidebar desktop and mobile action bar. Property-specific WhatsApp when configured. Enquiry/viewing status must reflect actual service persistence; preview submissions must explicitly fail without claiming delivery. Preserve offer and account workflows. Approximate map only with public coordinates, external map fallback, related discovery.

## Comparison and map
Two-property comparison usable at 320px with label/value context retained. Up to four on desktop; intentional contained scrolling for larger sets. Differences identified without colour alone. Map is opt-in and lazy; list remains available on map errors. No map-only information; approximate coordinates and omitted locations explained.

## Company, resources and portals
Keep public forms and calculators. Add substantive practical resource content where links previously looped. Use existing verified information; unknown business claims omitted. Apply tokens to portals without bypassing role boundaries. Unconfigured/unauthenticated states are distinct from verified authenticated operational screens.

## Test strategy and boundaries
Preserve all existing tests except update exact copy expectations when customer-facing technical wording changes; retain equivalent behavioural assertions. Add focused logic and browser regression tests before fixes. Always verify runtime and document limitations. Never edit migrations, backend security or production data. Do not introduce paid services or publish changes.
