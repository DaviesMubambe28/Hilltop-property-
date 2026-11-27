# Authentication Slideshow Verification

## Approved assets

The desktop editorial panel uses existing local architectural images:

- `/assets/hero-villa.webp`
- `/assets/hero/family-home.webp`
- `/assets/hero/apartments.webp`
- `/assets/hero/country-estate.webp`
- `/assets/hero/victoria-falls.webp`

The official logo is `/assets/brand/hilltop-logo.png`.

## Behavior

- Five desktop slides rotate every six seconds.
- Crossfade duration is 850ms.
- Reduced-motion users receive no autoplay.
- Mobile viewports hide the editorial panel and do not request slideshow images.
- Hidden tabs pause and resume through browser visibility events.
- A failed image is skipped; the navy fallback remains.
- Pause/play controls stop and restart a single interval.

## Automated verification

- Unit tests: 121 passed.
- Authentication navigation/slideshow tests: 22 passed across mobile and desktop.
- Mocked authentication journeys: 8 passed across mobile and desktop.
- Production build and TypeScript pass.

Visual screenshots have not yet been captured or visually signed off for the account-and-slideshow acceptance matrix.
