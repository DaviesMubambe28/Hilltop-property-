# Spec: Delivery and Operations

## Objective
Provide reproducible staging and production releases with approvals, rollback, monitoring, backups and maintenance procedures.

## Commands and structure
Use `npm run ci`, `npm run deploy:staging`, `npm run build` and `npm run smoke -- --base-url "$SITE_URL"`. CI lives in `.github/workflows/`; host configuration at the root; runbooks in `docs/operations/`.

## Testing strategy
Pull requests run static checks and tests. Staging runs migrations, browser tests and UAT. Production requires approved UAT, backups and a rollback target.

## Boundaries and success criteria
Always isolate environments, back up before migrations and verify after deploy. Ask before production deployment, DNS changes or destructive migrations. Never deploy failing builds or commit credentials. CI, staging recreation, rollback and monitoring must be operational. Hosting, domains, project references and alert destinations remain deployment inputs.
