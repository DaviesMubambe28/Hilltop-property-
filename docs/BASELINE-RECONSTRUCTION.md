> Reconstructed on 26 November 2026 under explicit owner authorisation. This is not recovered v3 material or evidence of historical approval.

# Baseline reconstruction

Starting point: `e55bfd87c793f801d4e23b09914beff982b6276c`; implementation branch `reconstruction/hilltop-v4`. The original `7d633b1` and v3 references could not be recovered. The prior investigation checked local objects, refs, reflogs, stashes, unreachable commits, worktrees, advertised remote refs and available backup locations. Remote `141caf2` was fetched for inspection only and is excluded from this reconstruction.

## Evidence and provenance
- Direct evidence: existing HTML routes, TypeScript services, backend integration, unit/browser tests, retained `docs/screenshots/`, Phase 4 and earlier implementation reports.
- Brand evidence: the repository contains a CSS Hilltop wordmark/emblem and navy/gold palette; no separately authenticated original logo file exists. Preserve that mark; owner-supplied original artwork remains an external dependency.
- Photography evidence: `PHOTOGRAPHY-REQUIREMENTS.md` identifies villa and team assets as demonstration presentation, not verified property, location or employee records. They must not establish factual claims.
- Reconstructed: governance package, slice briefs, target composition SVGs and typography tokens.
- Newly introduced: compact mobile quick search, optional detailed filters, Hilltop Ledger card specification rows, optional map mode, two-property mobile comparison.
- Unvalidated: original logo fidelity, property photography rights, real inventory completeness, real staff identities, contact-detail ownership, authenticated portal runtime, real customer preference and competitor performance.

## Actual starting verification
`npm ci` succeeded. `npm run ci` succeeded: ESLint, TypeScript, 59 tests across 12 files, production build. Browser/axe results are recorded in STATE after completion. Historical 61/47/14 counts are not substituted for actual execution.

## Architecture inventory
Routes: `/`, `/properties.html`, `/property/:slug` (rewritten to property.html), `/compare.html`, `/about.html`, `/sell.html`, `/contact.html`, `/account.html`, `/admin.html`. Financial calculators are homepage native dialogs. Staff and administration share a role-gated workspace.
Reusable foundation: styles.css tokens, CSS brand, public-page headers/footer, property cards, search URL parser/serializer, native dialogs, customer/staff entry boundaries. Services remain in src/services; backend in supabase is excluded from changes.

## Verification commands
`npm ci`; `npm run ci`; `npm run test:e2e`. Chromium at `/usr/bin/chromium`. Browser screenshots use Playwright with the actual local application; unavailable Chrome DevTools MCP is replaced by isolated Playwright runtime inspection. Production preview must not expose development fixtures.
