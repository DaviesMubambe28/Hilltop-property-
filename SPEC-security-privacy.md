# Spec: Security and Privacy

## Objective
Protect customer and business data using least privilege, hardened boundaries, auditability, abuse controls and privacy procedures.

## Commands and structure
Use `npm audit --audit-level=high`, `npm run test:db`, `npm run test:security` and `npm run test:headers`. Security headers live in deployment configuration, RLS in migrations and runbooks in `docs/security.md` and `docs/privacy.md`.

## Testing strategy
Attempt unauthorized operations as anonymous, customer, editor and admin users. Test oversized input, malformed IDs, repeated submissions and unsafe uploads.

## Boundaries and success criteria
Always use least privilege, redacted logs and explicit retention. Ask before production exports or deletion. Never weaken TLS, RLS or integrity checks. Policy tests must prove isolation and high-severity dependency findings must be resolved. Legal review owns the final privacy notice.

