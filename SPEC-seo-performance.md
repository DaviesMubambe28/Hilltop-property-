# Spec: SEO and Performance

## Objective
Make published content discoverable while keeping the public experience fast on mobile networks.

## Commands and structure
Use `npm run build`, `npm run test:seo`, `npm run lighthouse` and `npm run test:bundle`. Metadata builders live in `src/seo/`; sitemap and robots output are generated. Images have dimensions, modern formats and lazy loading.

## Testing strategy
Validate unique metadata, canonical URLs, social cards, structured data, crawl rules, sitemap and budgets.

## Boundaries and success criteria
Always exclude private routes and drafts. Ask before canonical-domain or crawl changes. Never add deceptive metadata or blocking scripts. Targets are LCP below 2.5s, CLS below 0.1 and INP below 200ms on representative staging tests. Domain and Search Console ownership remain deployment inputs.

