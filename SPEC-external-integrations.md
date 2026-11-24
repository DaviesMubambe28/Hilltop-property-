# Spec: External Integrations

## Objective
Integrate WhatsApp, maps, transactional email and analytics through configurable and validated adapters.

## Commands and structure
Use `npm run test:integrations`, `npm run test:functions` and `npm run smoke:integrations`. Browser-safe adapters live in `src/integrations/`; secret-backed calls live in Edge Functions. Every adapter supports a disabled state.

## Testing strategy
Contract tests use local fakes. Staging smoke tests verify configured endpoints without production traffic.

## Boundaries and success criteria
Always obtain analytics consent and validate provider responses. Ask before provider changes. Never expose secrets or send personal data to analytics. WhatsApp, maps, email and analytics work when configured. Provider identities remain deployment inputs.

