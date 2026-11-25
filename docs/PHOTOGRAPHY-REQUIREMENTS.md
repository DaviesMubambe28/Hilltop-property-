# Property photography requirements

## Current repository audit

- Three WebP files exist: one 1280×640 villa hero (102 KB), one 800×400 mobile derivative (50 KB), and one 1600×900 team portrait sheet (156 KB).
- The same villa image is reused for property cards, neighbourhoods, services, editorial content and track-record backgrounds. This is acceptable only as clearly labelled development presentation and is not sufficient for launch.
- No repository image is evidence of a particular live listing. Development fixtures explicitly label their imagery as demonstration content.
- No broken local image references were found in the current Playwright public-page checks.

## Owner-supplied launch package

For every property, provide written publication authority and:

- 12–25 current photographs, with exterior, main rooms, kitchen, bathrooms, grounds and material defects represented honestly;
- a 3:2 landscape primary image at least 2400×1600 px;
- landscape gallery images at least 1800 px wide, with consistent orientation and no upscaling;
- optional 4:5 portrait crops for mobile/social use;
- descriptive alt-text facts, photographer/source, capture date and rights expiry (if any);
- listing reference and room/location mapping for every filename.

For branches and neighbourhoods, provide approved location-specific images. For staff, provide individual portraits with name, role, consent and crop-safe headroom. Do not use unrelated stock imagery as a property or neighbourhood record.

## Acceptance rules

- JPEG, PNG or WebP only; reject executable or mismatched MIME content.
- Strip unnecessary metadata, especially private GPS data, before public delivery.
- Generate responsive derivatives server-side; preserve the original privately when business policy requires it.
- Use `object-fit: cover` only where cropping cannot hide a material feature. Galleries should provide an uncropped viewing mode.
- Assign explicit dimensions to prevent layout shift, lazy-load non-primary images and prioritise only the page’s primary image.
- Record owner approval before publishing. Missing or unapproved photography must show a neutral “Images coming soon” state, not a substitute property.
