# Phase 3 customer experience verification

Assessment date: 25 November 2026.

## Implemented slice

The dedicated property page now provides a photography-led, full-screen gallery with previous/next controls, image count, Arrow-key navigation, an accessible close control and focus restoration to the opening image. Mobile visitors receive a persistent Call and Request viewing bar. Amenities, agent contact and demonstration-state messaging have clearer hierarchy.

A development-only preview can be opened with `/property/demo-kabulonga-family-house?preview=demo`. It uses the application `Property` model, explicitly labels all content and imagery as demonstration material, and is removed by Vite's production build because activation requires `import.meta.env.DEV`. It does not bypass authentication, imitate a Supabase response or claim backend integration.

## Visual evidence

Baseline disconnected-state captures:

- `phase3-baseline-property-390.png`
- `phase3-baseline-property-1440.png`

Populated final captures were inspected at 360, 390, 768, 1024, 1440 and 1920 pixels and retained as `phase3-final-property-<width>.png`. Lightbox captures are retained at 390 and 1440 pixels.

## Accessibility findings

- Gallery triggers and controls use native buttons and accessible names.
- Focus moves to the close control on open and returns to the opening image on close.
- Arrow Left and Arrow Right change the image; native dialog Escape behavior remains available.
- The gallery caption announces image position through a polite live region.
- A rendered-page check found zero missing image alt attributes, unnamed buttons or unlabelled form controls.
- Heading inspection found one page `h1` followed by section `h2` elements.
- Automated axe could not run because the dependency is not installed and external downloads are blocked. These checks do not constitute a claim of full WCAG 2.2 AA compliance.

## Performance findings

Measured with local Vite development server, system Chromium, a 390 × 844 viewport and demonstration assets on localhost:

- LCP: 332 ms after the final layout-reservation fix.
- CLS: 0.000 after reserving initial property-content height (previously 0.153).
- INP: not representative because the run was automated on localhost without user interaction or production network conditions.

These are development measurements, not Lighthouse scores or production field data. Lighthouse was unavailable in the installed toolchain.

## Verification boundary

The preview proves rendering, responsive layout, keyboard interaction and conversion-action presentation. It does not prove Supabase API, authentication, Storage or enquiry persistence. Those remain staging checks with owner-supplied credentials.
