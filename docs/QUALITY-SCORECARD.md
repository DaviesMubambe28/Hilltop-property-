# Hilltop Properties quality scorecard

Assessment date: 25 November 2026. Scores reflect observable repository and browser evidence in this isolated environment. They are not competitor scores.

| Category | Weight | Score | Weighted result | Evidence |
|---|---:|---:|---:|---|
| Visual design and brand identity | 15% | 8.0/10 | 1.20 | Consistent navy, yellow and cream system; photography-led public heroes; editorial typography; responsive About and comparison journeys. |
| Property discovery | 15% | 7.5/10 | 1.13 | URL-driven search, listing modes, advanced filters, sorting, pagination, saved searches, map integration and safe disconnected states. Populated API rendering remains unverified because the full local Supabase gateway could not start. |
| Property-detail experience | 15% | 7.8/10 | 1.17 | Photography-led gallery, accessible full-screen lightbox, specifications, amenities, approximate map, agent contact, enquiry, viewing, offer, share and similar-listing path. Populated responsive review completed with clearly labelled demonstration content. |
| Mobile experience | 15% | 8.4/10 | 1.26 | Mobile Playwright project, responsive image rail, persistent Call/Request viewing actions, overflow checks and retained 360px/390px review captures. |
| Customer conversion experience | 10% | 8.2/10 | 0.82 | Persistent mobile contact actions, concise contextual enquiry/viewing forms, telephone and WhatsApp routes, validation and truthful failure handling. Live persistence remains a staging check. |
| Trust and credibility | 10% | 8.0/10 | 0.80 | Verified status support, availability enforcement, visible demonstration labels, privacy-aware approximate maps, 32 passing RLS assertions and no fabricated testimonials or awards. |
| Functional completeness | 10% | 7.5/10 | 0.75 | Broad public, customer, CRM, CMS and operational coverage. Clean migration replay and 41 database assertions pass; API/Auth end-to-end verification is still blocked without a full local stack or authorised test project. |
| Performance | 5% | 7.7/10 | 0.39 | Optimised WebP assets, lazy-loaded secondary imagery, split page bundles and measured local property-page LCP of 332 ms with CLS 0.000. Formal production Lighthouse and field measurement remain outstanding. |
| Accessibility | 5% | 8.1/10 | 0.41 | Semantic headings, labelled controls, keyboard-operated dialog, focus restoration, live image counter, reduced-motion support and rendered-control checks. Automated axe coverage is not installed. |

**Weighted total: 7.92/10**

## Highest-priority remaining deficiencies

1. Run populated public and authenticated browser journeys against a complete local Supabase stack or an authorised isolated project.
2. Capture genuine listing photography in multiple aspect ratios; the current repository has a deliberately small image set.
3. Execute Lighthouse and axe audits in the deployment environment and resolve measured findings.
4. Verify enquiry, viewing, save and comparison persistence using authorised staging accounts.
5. Repeat direct competitor inspection when network access is available; no competitor score is currently supportable.

Database evidence and its boundaries are recorded in `PHASE-3-TEST-ENVIRONMENT.md`.
Property-detail visual, accessibility and performance evidence is recorded in `PHASE-3-CUSTOMER-EXPERIENCE.md`.
