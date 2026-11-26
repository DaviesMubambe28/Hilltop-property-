# Independent UI/UX audit — reconstructed v4

Audit date: 26 November 2026. Reviewed implementation: `07fca07b1a2abf23f57eb1612b3bdac1f4017076`, followed by the narrow credibility corrections recorded in the final remediation commit. Reference version: `v4.0-reconstructed-2026-11-26`.

This review treats the browser renders as the product and does not award design credit merely because tests pass. Development fixtures, synthetic photography and unauthenticated portal entry states are evidence of presentation behaviour only.

## Verdict

The public site has a coherent Hilltop identity, strong editorial type, disciplined navy/gold colour, useful mobile discovery and unusually honest recovery states. It can frame a K8 million property with appropriate visual restraint. It cannot yet credibly *sell* that property because the review contains one repeated synthetic house image, no verified listing inventory, no genuine agent identity and no proven delivery operation. Ordinary residential customers receive clearer search, comparison and next steps than high-value buyers receive proof, provenance and advisor confidence.

Overall visual-design assessment: **79/100 — strong reconstructed foundation, below final premium-market acceptance**. This is an independent internal judgment, not user research or a competitive ranking.

| Dimension | Score | Evidence-based assessment |
|---|---:|---|
| Distinctive brand identity | 8/10 | Consistent Hilltop mark, navy/gold system and editorial voice; original logo artwork remains unauthenticated. |
| Architectural presentation | 8/10 | Strong hero and intentional galleries; the hero and listing images are explicitly illustrative. |
| Typography and composition | 8/10 | Source Serif gives hierarchy and character; Manrope is unavailable, and several utility labels use a conventional fallback. |
| Mobile usability | 9/10 | Search appears immediately, cards stack cleanly, filters use a native dialog, actions remain reachable and comparison works at 320 px. |
| Property discovery | 8/10 | Clear buy/rent/invest entry, URL state, sorting, category-aware filters, comparison and optional map. Live inventory scale is untested. |
| Photography and listing credibility | 4/10 | The same synthetic villa appears across different property types, including land. Labels are honest, but the visual evidence is unsuitable for launch. |
| Conversion and service confidence | 7/10 | Enquiry/viewing paths are clear and failure-safe. Genuine agents, WhatsApp destination, email delivery and response operations are unverified. |
| Cross-page consistency | 8/10 | Public pages, resources and safe portal entry states share the system. Authenticated role screens were not available. |
| Accessibility | 9/10 | 43 automated checks, focus regressions and readable states passed. Screen-reader and real-device testing remain outstanding. |
| Performance | 8/10 | Controlled local results meet the reconstructed mobile thresholds. Field data and populated-catalogue performance are absent. |

## Material findings

### Owner/evidence blockers

1. **Listing authenticity blocks premium acceptance.** Distinct houses, apartments and plots use the same demonstration photograph. Supply rights-cleared, property-specific media with captions and ordered galleries; do not launch synthetic fixtures.
2. **High-value advisory credibility is incomplete.** No verified advisor biography, portrait, professional registration or direct responsibility accompanies the K4.85 million demonstration listing. Provide genuine appointed-agent data or use a verified team-level contact.
3. **Business assertions need confirmation.** Office locations, phone, email, service area and legal/privacy text require owner sign-off. Maps currently search for a business name rather than a verified street address.
4. **Portal quality is unknown beyond entry states.** Customer, staff and administrative screenshots show disconnected/unavailable states. Authenticated task hierarchy, dense data tables, permissions and operational efficiency need isolated staging accounts.
5. **Conversion is interface-complete but operationally unproven.** Enquiry and viewing mocks cover success and failure; email, WhatsApp, notifications, ownership and response-time processes need real staging evidence.

### Independently actionable remediation

- The contact journey stated that a message was “securely recorded” without independent delivery/security evidence. It now says that after a successful submission the message reaches the property team, matching the guarded UI state.
- The shared footer labelled the practical resources page “The Hilltop Journal,” implying editorial content that does not exist. It now says “Property guides.”

No broader creative change is justified. The strongest next improvement is authentic content, not more styling.

## Page-level review

- **Home:** strong first-screen proposition, immediate search and responsible illustration disclosure. The long mobile page remains scannable, but genuine featured inventory would carry more authority than guidance sections.
- **Catalogue:** professional, clear and touch-friendly. Filters, sort and view mode are understandable. Repeated photography materially weakens scanning and makes different categories look interchangeable.
- **Property details:** the gallery, facts and conversion hierarchy are credible. The generic “Your agent” area is deliberately restrained but cannot support a luxury mandate without real identity and credentials.
- **Comparison:** excellent narrow-screen pairing and readable row labels. It is long at 320 px, an acceptable tradeoff for a two-property factual comparison.
- **Map:** clearly optional, approximate and recoverable. Synthetic markers correctly avoid false precision. Real coordinates and consented tile/provider policy still need acceptance.
- **Company/service pages:** typographically consistent and calmer than a template marketplace. Their credibility depends on confirmation of company claims and contact information.
- **States:** loading, empty, photo failure, recommendation failure and unconfigured-service states are clear and useful. They are a genuine strength.

## Separate readiness verdicts

1. **Engineering readiness:** ready for an authorised staging acceptance cycle; local implementation and recovery evidence are strong.
2. **Visual design quality:** strong foundation, below final premium-market acceptance because photography and advisory proof are absent.
3. **Mobile experience:** internally ready for real-device and participant validation; the 320–430 px layouts are coherent and task-focused.
4. **Competitive superiority:** unproven. Available text evidence supports feature comparison, not visual or usability superiority.
5. **Production readiness:** not ready. Genuine content, verified operations, authenticated workflows, security review and launch controls remain open.

## Final presentation refinement — 26 November 2026

A focused follow-up corrected the remaining independently actionable presentation weaknesses without changing content claims or protected systems:

- strengthened the home hero's editorial scale, image contrast and search-to-hero composition;
- upgraded shared property cards with a consistent 4:3 image stage, clearer price/title hierarchy, aligned facts and stable action placement;
- replaced the technical-looking advanced-search trigger with a clearer “More filters” affordance while preserving its accessible name;
- improved catalogue result context and mobile list/sort continuity; and
- gave the property overview and conversion panel slightly stronger reading rhythm and separation.

Representative before/after evidence is retained in `docs/screenshots/refinement-v4/` for home, catalogue and property detail at 390 px and 1440 px. All six final renders reported no page errors or horizontal overflow.

Updated internal assessment: **82/100**. The three-point increase reflects stronger typography/composition (9/10), property discovery presentation (9/10) and cross-page consistency (9/10). Photography/listing credibility remains 4/10, and conversion confidence remains 7/10; styling cannot legitimately raise those dimensions without genuine property media, advisor identity and verified operations. The 95/100 aspiration and competitive superiority therefore remain unproven.
