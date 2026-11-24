# Spec: Quality Assurance

## Objective
Provide automated and manual evidence that the platform is functional, accessible, secure and usable.

## Commands and structure
Use `npm run ci`, `npm test -- --coverage`, `npm run test:db`, `npm run test:e2e` and `npm run test:a11y`. Tests live beside domain modules, in `supabase/tests/`, `e2e/` and `docs/uat.md`.

## Testing strategy
Cover catalogue search, details, enquiries, authentication, saved items, CMS publishing and role denial. Accessibility targets WCAG 2.1 AA.

## Boundaries and success criteria
Always preserve failure evidence. Ask before baseline or release-criteria changes. Never skip or weaken tests. CI must pass, core journeys must work at supported breakpoints and automated accessibility checks must have no serious violations. Business UAT approvers are assigned before staging sign-off.

