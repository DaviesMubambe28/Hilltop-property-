# Hilltop Properties quality scorecard

Assessment date: 25 November 2026. Scores reflect observable repository and browser evidence in this isolated environment. They are not competitor scores.

| Category | Weight | Score | Weighted result | Evidence |
|---|---:|---:|---:|---|
| Visual design and brand identity | 15% | 8.2/10 | 1.23 | Consistent navy, yellow and cream system; photography-led public heroes; editorial typography; populated catalogue and comparison reviewed across six widths. Genuine listing photography remains limited. |
| Property discovery | 15% | 8.3/10 | 1.25 | URL-driven search, listing modes, advanced filters, sorting, counts, removable filter chips, category-aware cards, pagination, comparison and map/result interaction were exercised with eleven labelled fixtures. Live API rendering remains unverified. |
| Property-detail experience | 15% | 7.8/10 | 1.17 | Photography-led gallery, accessible full-screen lightbox, specifications, amenities, approximate map, agent contact, enquiry, viewing, offer, share and similar-listing path. Populated responsive review completed with clearly labelled demonstration content. |
| Mobile experience | 15% | 8.4/10 | 1.26 | Mobile Playwright project, responsive image rail, persistent Call/Request viewing actions, overflow checks and retained 360px/390px review captures. |
| Customer conversion experience | 10% | 8.2/10 | 0.82 | Persistent mobile contact actions, concise contextual enquiry/viewing forms, telephone and WhatsApp routes, validation and truthful failure handling. Live persistence remains a staging check. |
| Trust and credibility | 10% | 8.0/10 | 0.80 | Verified status support, availability enforcement, visible demonstration labels, privacy-aware approximate maps, 32 passing RLS assertions and no fabricated testimonials or awards. |
| Functional completeness | 10% | 7.8/10 | 0.78 | Broad public, customer, CRM, CMS and operational coverage plus populated public discovery and comparison journeys. Clean migration replay and 41 database assertions pass; API/Auth end-to-end verification remains blocked. |
| Performance | 5% | 8.0/10 | 0.40 | Production-build mobile Lighthouse performance was 96–99 with CLS 0–0.028 across homepage, catalogue and comparison. Catalogue/comparison LCP passed; homepage LCP was 2.7 s and remains above the 2.5 s target. No field INP data exists. |
| Accessibility | 5% | 8.6/10 | 0.43 | Axe now covers seven representative pages at mobile and desktop; all 14 checks pass with no critical/serious findings after contrast, name and keyboard fixes. Manual screen-reader/device review remains outstanding. |

**Weighted total: 8.14/10**

## Highest-priority remaining deficiencies

1. Run populated public and authenticated browser journeys against a complete local Supabase stack or an authorised isolated project.
2. Capture genuine listing photography in multiple aspect ratios; the current repository has a deliberately small image set.
3. Repeat Lighthouse and axe audits on staging, reduce the homepage LCP below 2.5 seconds and complete manual accessibility review.
4. Verify enquiry, viewing, save and comparison persistence using authorised staging accounts.
5. Repeat direct competitor inspection when network access is available; no competitor score is currently supportable.

Database evidence and its boundaries are recorded in `PHASE-3-TEST-ENVIRONMENT.md`.
Property-detail visual, accessibility and performance evidence is recorded in `PHASE-3-CUSTOMER-EXPERIENCE.md`.
Populated discovery evidence and its fixture boundary are recorded in `FLAGSHIP-DISCOVERY-IMPLEMENTATION.md`.
