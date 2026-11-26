# Reconstruction implementation review

Reviewed against owner reconstruction requirements and the reconstructed v4 brief. Original v3 approval is not implied.

- Correctness: new regression tests reproduce default map, horizontal mobile browsing, inaccessible filter state, unreadable narrow comparison and the enquiry exception before catch. Fixed guarded submission using the loaded property record; service success/failure remains explicit. Preserved offer validation and server contracts. Search context now carries from homepage results into catalogue.
- Readability: shared PropertyFact/propertyPrice/card module replaces divergent display rules. Existing minified legacy modules remain a maintenance weakness; broad unrelated reformatting was avoided.
- Architecture: existing static HTML/Vite/TypeScript service boundaries retained. Shared public headers and footers use the same markup; native dialog handles mobile focus and Escape. New code does not introduce an application framework or paid dependency.
- Security: no schema, migration, authentication, authorisation, RLS, operational admin or customer workflow module modified. Dynamic listing text escaped using safeText. Mock integration environment uses an explicit .invalid domain and synthetic public key; no real delivery is claimed. No production data access.
- Performance: catalogue/map remains lazy and opt-in. Homepage omits the map node. Only Source Serif regular is shipped; no font preload. Responsive hero preloads are media-gated. Gallery displays at most three preview images while the lightbox retains all images. Mobile optional filters are hidden before JS to avoid measured CLS.

Mutation experiment: inverted the price-null condition in an isolated temporary copy of the presentation module; the rent-period regression failed as expected. Removed the temporary module and test afterward. Normal source was not mutated. Full clean verification is recorded separately.

Material findings corrected: preview enquiry promise escaped its catch; two-image gallery left avoidable blank space; map iframe made external failure look like an empty content panel; related cards lacked their save/compare event handlers; search-to-catalogue link discarded filters; listing tabs did not update selection consistently outside the homepage; optional-field relocation caused mobile CLS. Related cards now share app handlers and comparison link; public menu handling is present on details.

Final review findings corrected: the related-property request filtered the underlying relationship name while the selected response used an alias. The query now applies an inner relationship through that alias, and request-shape regressions cover the successful and failed paths. Recommendation failures are isolated from the primary property and conversion controls. Detail pages skip irrelevant catalogue-option reads, the missing favicon response is resolved using the existing artwork, and the fourteen-route network-idle console audit is clear.

Remaining limitations: independent review/customer validation unavailable; authenticated portals and real service delivery unverified; photography/logo/contact authenticity needs owner source material; official Manrope unavailable; typography is a documented partial integration. No merge or deployment acceptance is issued by this local review.
