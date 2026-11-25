# Hilltop Properties competitive benchmark

## Access note

Direct inspection of Homes Platinum Zambia, Pam Golding Zambia and Broadleaf Homes was attempted on 25 November 2026. All three domains were blocked by the execution environment's outbound proxy with HTTP 403 responses. No claims about their current rendered interfaces are included here because they could not be verified.

A Phase 4 retry used HTTPS HEAD requests, redirects and a standard browser user agent. The proxy rejected each CONNECT tunnel before the origin site responded. This confirms an environment access limitation, not an outage or behaviour of any competitor website.

## Evidence used

- The product goals and benchmark criteria supplied by Hilltop.
- Browser captures of Hilltop at mobile and desktop sizes.
- Inspection of every public, customer and staff entry point in this repository.
- The existing navy, yellow, cream and white visual system and approved homepage direction.

## Hilltop design direction

Hilltop should compete through a distinctly Zambian, service-led experience rather than imitating an international franchise. The interface contract is:

- Photography leads property discovery; navy provides authority and yellow identifies primary action.
- Editorial serif headings establish a premium tone while a neutral sans-serif keeps operational interfaces readable.
- Search is the primary homepage task and remains URL-driven, shareable and backed by live Supabase records.
- Every prominent action leads to an implemented page, form or authenticated workflow.
- Trust comes from verified listing state, real agent and branch data, explicit availability and clear error states—not invented statistics or testimonials.
- Mobile uses stacked actions, horizontal discovery rails where appropriate and compact, touch-safe filters.
- Customer and staff portals use the same tokens but favour denser panels and tables over marketing layouts.

## Initial verified weaknesses

1. Account and admin entry points threw unhandled configuration errors and displayed misleading empty interfaces.
2. Customer sections lacked panel hierarchy and created excessive empty vertical space.
3. Staff navigation had limited focus and hover feedback and was not sticky on large screens.
4. Several public navigation items previously returned to homepage anchors rather than dedicated journeys; catalogue, selling and contact pages now address the highest-value gaps.
5. Live competitor comparison remains blocked until those domains are available from an approved browser/network environment.

## Implemented visual response

- Introduced dedicated catalogue, selling, contact and About journeys so primary navigation no longer depends on homepage anchors.
- Extended the approved photographic hero treatment to public service and comparison pages.
- Rebuilt the property comparison shell with clear hierarchy, full navigation, a complete footer and actionable empty/error states.
- Added consistent keyboard focus indicators and reduced-motion handling across the public experience.
- Strengthened property-detail specification grids, action grouping and responsive behavior without changing listing data or business rules.
- Added safe, designed configuration states for customer and staff portals.
- Added automated checks for major-page horizontal overflow and broken internal destinations.
- Added a photography-led property gallery with an accessible full-screen lightbox and persistent mobile conversion actions, verified at six responsive widths.
- Exercised populated homepage, catalogue, category-aware property cards, approximate map discovery and comparison states with explicitly synthetic development fixtures; this is independent Hilltop evidence, not a competitor observation.

## Remaining evidence limitation

The three named competitor domains still cannot be reached from this execution environment. A final side-by-side scoring exercise should be repeated from an approved browser environment before making claims about Hilltop outperforming any competitor's current production interface.

## Patterns to avoid

- Fake listings, reviews, agents, projects or performance statistics.
- Decorative actions without a real destination.
- Oversized mobile typography that displaces property information.
- Animation-heavy presentation, generic gradient cards or an unrelated visual palette.
- Weakening authenticated or RLS-protected workflows for presentation purposes.
