# Spec: Platform Foundation

## Objective
Convert the static site into a maintainable TypeScript app with typed configuration and service boundaries while preserving its approved UI.

## Tech stack and commands
Vite, TypeScript, Supabase JS, Vitest, Playwright and ESLint. Use `npm ci`, `npm run dev`, `npm run build`, `npm run typecheck`, `npm run lint` and `npm test`.

## Structure and style
Use `src/` for application code, `tests/` for integration tests, `e2e/` for browser tests, `supabase/` for backend assets and `docs/` for operations. Prefer named exports and explicit contracts such as `interface PropertyRepository { list(input: PropertySearchInput): Promise<PropertySearchResult> }`.

## Testing strategy
Validate configuration and domain utilities with Vitest and render the public shell at 320, 768, 1024 and 1440 pixels with Playwright.

## Boundaries and success criteria
Always validate configuration and separate anonymous from privileged credentials. Ask before replacing Supabase or the approved design. Never expose service-role keys or commit `.env`. Installation, static checks, tests and production build must pass. Production domain and host remain deployment inputs.

