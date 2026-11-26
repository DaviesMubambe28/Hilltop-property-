# v4 reference comparisons

Replacement reference version: v4.0-reconstructed-2026-11-26. These are schematic composition references authored before implementation, not the missing v3 golden images. Comparisons assess hierarchy and layout, not invented pixel-perfect approval.

| Interface | Target composition | Implementation response | Remaining weakness |
|---|---|---|---|
| Home | Brand navigation, architecture, quick search, collection, Explore Zambia, Signature advice, assistance/footer | Same order; mobile quick search in first viewport; no homepage map; invented team/counts/statistics/estate removed | Hero is labelled illustrative; genuine curated inventory/photography unavailable |
| Catalogue | Compact header/search, optional filters, sort/view controls, Ledger results | Native mobile drawer, stacked mobile cards, optional map and URL state | Live inventory/filter-option completeness needs staging |
| Property | Intentional gallery, title/price/facts, enquiry sidebar/mobile actions, map fallback/related | Bounded gallery preview, full native lightbox, category facts, guarded submissions, contact bar and shared related cards | Real property photography, verified advisors and delivery unavailable |
| Comparison | Two contextual property columns on mobile | Paired responsive table with row labels, period-aware prices and category facts; differences filter | Larger sets intentionally scroll; participant validation unavailable |
| Map | Intentional mode, readable results, failure recovery | Optional map appears before results on mobile; list remains available; approximate markers and tile error notice | External tiles can fail; fixture map is explicitly synthetic |
| Company/services | Editorial heading, verified content/form, next step/footer | Shared foundation, existing enquiry forms/calculators, substantive ownership/rental/investment guides | Business contact/logo/legal source confirmation outstanding |
| Customer/staff/admin | Shared tokens, role-aware task hierarchy, safe unavailable state | Consistent typography/surfaces and safe entry states | Authenticated operational screens not rendered without staging credentials; no fabricated portal evidence |
| States | Reserved loading geometry, clear empty/error recovery | Busy state, zero-match clear action, service retry/contact and neutral photo fallback | Automatic checks do not establish complete assistive-technology usability |

Material defects found and corrected during inspection: long mobile search; unintended map column; mobile horizontal property rails; repeated unrelated property/location photography; fictitious staff/counts; gallery whitespace with two images; blank external map panel; unreadable two-property comparison; missing detail-page public menu/footer; mobile optional-field layout jump. Expanded axe found map labels that omitted visible location text; labels corrected, assertions retained. Final inspection also corrected an empty unavailable-property related section, inaccessible dialog names, irrelevant category filters and failed-image gallery controls. Recommendations now fail independently of the primary property and enquiry panel.

Final capture matrix and runtime results live under docs/screenshots/reconstruction/final-v4. Representative populated, empty, error and loading captures are also retained under states. These are actual browser renders; development fixtures and mocked service evidence remain explicitly distinguished from public inventory.
