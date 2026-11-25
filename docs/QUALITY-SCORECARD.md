# Hilltop Properties quality scorecard

Assessment date: 25 November 2026. Scores reflect observable repository and browser evidence in this isolated environment. They are not competitor scores.

| Category | Weight | Score | Weighted result | Evidence |
|---|---:|---:|---:|---|
| Visual design and brand identity | 15% | 8.0/10 | 1.20 | Consistent navy, yellow and cream system; photography-led public heroes; editorial typography; responsive About and comparison journeys. |
| Property discovery | 15% | 7.5/10 | 1.13 | URL-driven search, listing modes, advanced filters, sorting, pagination, saved searches, map integration and safe disconnected states. Populated API rendering remains unverified because the full local Supabase gateway could not start. |
| Property-detail experience | 15% | 6.8/10 | 1.02 | Gallery, specifications, amenities, approximate map, agent contact, WhatsApp, enquiry, viewing, offer, share and similar listings exist. A lightbox and populated visual review remain outstanding. |
| Mobile experience | 15% | 8.0/10 | 1.20 | Mobile Playwright project, responsive navigation, stacked actions, overflow checks and retained 360px/390px review captures. |
| Customer conversion experience | 10% | 7.8/10 | 0.78 | Real Edge Function enquiry and viewing paths, valuation/contact forms, telephone and WhatsApp routes, validation and truthful failure handling. |
| Trust and credibility | 10% | 8.0/10 | 0.80 | Verified status support, availability enforcement, visible demonstration labels, privacy-aware approximate maps, 32 passing RLS assertions and no fabricated testimonials or awards. |
| Functional completeness | 10% | 7.4/10 | 0.74 | Broad public, customer, CRM, CMS and operational coverage. Clean migration replay and 41 database assertions pass; API/Auth end-to-end verification is still blocked without a full local stack or authorised test project. |
| Performance | 5% | 7.5/10 | 0.38 | Optimised WebP assets, lazy-loaded secondary imagery, split page bundles and a small public application bundle. A formal Lighthouse run remains outstanding. |
| Accessibility | 5% | 7.8/10 | 0.39 | Semantic headings, skip links, labelled controls, keyboard focus indicators, live regions and reduced-motion support. Automated axe coverage is not installed. |

**Weighted total: 7.64/10**

## Highest-priority remaining deficiencies

1. Run populated public and authenticated browser journeys against a complete local Supabase stack or an authorised isolated project.
2. Add a keyboard-accessible property gallery lightbox and persistent mobile contact bar.
3. Capture genuine listing photography in multiple aspect ratios; the current repository has a deliberately small image set.
4. Execute Lighthouse and axe audits in the deployment environment and resolve measured findings.
5. Repeat direct competitor inspection when network access is available; no competitor score is currently supportable.

Database evidence and its boundaries are recorded in `PHASE-3-TEST-ENVIRONMENT.md`.
