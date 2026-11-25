# Flagship property discovery implementation

Assessment date: 25 November 2026.

## Implemented

- Extended the development-only preview from one property to the eleven records represented by the synthetic database seed.
- Populated the homepage and catalogue with available demonstration listings while retaining reserved, sold, rented and draft records for fixture integrity checks.
- Added functional preview filtering for listing type, keywords, province, property type, price, bedrooms, bathrooms and size, plus sorting and pagination.
- Added truthful result counts, individually removable filter chips and clear-all behavior.
- Made card specifications category-aware so land, farms, estates and commercial listings do not present irrelevant residential facts.
- Added a labelled, keyboard-operable development map using synthetic approximate coordinates without external map-tile requests.
- Populated comparison with imagery, price, location, category-aware specifications, amenities, missing information, removal controls and property-detail routes.
- Prevented preview save and alert actions from presenting fake persistence.

Preview activation requires both a Vite development build and `preview=demo`. Fixture modules are loaded dynamically behind `import.meta.env.DEV`; production-build inspection must find no demonstration references.

## Visual evidence

Baseline captures document the prior disconnected homepage, catalogue and comparison at 390 and 1440 pixels. Final catalogue captures are retained at 360, 390, 768, 1024, 1440 and 1920 pixels. Final homepage and comparison captures are retained at 390 and 1440 pixels.

The baseline and final catalogue states are not like-for-like data comparisons: baseline could not populate without Supabase, while final uses explicitly labelled synthetic fixtures.

## Verification boundary

These browser journeys verify presentation, local filtering, URL state, map-to-result navigation and comparison interactions. They do not verify Supabase queries, authentication, saved-property persistence, enquiry delivery or staff authorization. Those require the isolated staging project described in `operations/staging.md`.

## Controlled measurements

On the Vite development server with system Chromium at 390 × 844, the populated sale catalogue measured LCP at 116 ms and CLS at 0.000. The rendered audit found zero horizontal overflow, missing image alt attributes, unnamed buttons or unlabelled form controls. These are localhost development measurements, not Lighthouse scores or production field data.
