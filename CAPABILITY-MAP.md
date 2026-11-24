# Capability Map: Hilltop Digital Property Platform

## Assumptions

1. The existing responsive website remains the public presentation layer and will be progressively upgraded rather than replaced with a different visual design.
2. Supabase provides PostgreSQL, authentication, storage, realtime updates, row-level security, and Edge Functions.
3. Public users can browse properties and submit enquiries without an account. Accounts add saved searches, saved properties, and enquiry history.
4. Staff accounts use role-based access with `editor` and `admin` roles. Editors manage content. Admins also manage staff access and settings.
5. Listings require draft, published, sold, rented, and archived states with an auditable publication workflow.
6. WhatsApp starts conversations through a configurable business number. Email delivery uses a provider-compatible Supabase Edge Function. Maps use configurable coordinates and an external map provider.
7. Analytics defaults to privacy-conscious, consent-aware tracking. The provider remains configurable until production credentials are supplied.
8. Deployment targets a static frontend host with Supabase as the managed backend. Staging and production use separate Supabase projects.
9. Production publishing and live third-party integrations require project IDs, domains, service credentials, and business accounts supplied through secure environment settings.

## Modules

| Module id | Responsibility | Depends on |
|---|---|---|
| `platform-foundation` | Application build system, typed configuration, shared domain contracts, local development, environment validation | — |
| `property-data` | Supabase schema, migrations, seed data, storage buckets, property and location queries | `platform-foundation` |
| `identity-access` | Customer authentication, staff roles, profiles, row-level security, session handling | `platform-foundation`, `property-data` |
| `public-catalogue` | Live property listing, search, filters, pagination, saved properties, saved searches | `property-data`, `identity-access` |
| `enquiries-crm` | Enquiry capture, validation, ownership, status tracking, consent and customer history | `property-data`, `identity-access` |
| `content-cms` | Staff dashboard for properties, agents, locations, articles, site settings and media | `property-data`, `identity-access`, `enquiries-crm` |
| `external-integrations` | WhatsApp, maps, transactional email and analytics adapters through validated boundaries | `enquiries-crm`, `content-cms` |
| `security-privacy` | Hardened policies, abuse controls, audit logs, retention, privacy controls and security headers | `identity-access`, `enquiries-crm`, `external-integrations` |
| `seo-performance` | Metadata, structured data, sitemap, robots policy, responsive images, caching and performance budgets | `public-catalogue`, `content-cms` |
| `quality-assurance` | Unit, integration, database-policy, accessibility, browser and usability tests | All implementation modules |
| `delivery-operations` | CI gates, staging workflow, UAT checklist, production deployment, monitoring, backups and maintenance runbooks | `security-privacy`, `seo-performance`, `quality-assurance` |

## Build order

1. `platform-foundation`
2. `property-data`
3. `identity-access`
4. `public-catalogue` and `enquiries-crm`
5. `content-cms`
6. `external-integrations`
7. `security-privacy`
8. `seo-performance`
9. `quality-assurance`
10. `delivery-operations`

## Cross-module contracts

- Browser code may use only the Supabase anonymous key. Privileged operations run through row-level policies or authenticated Edge Functions.
- Public list queries return published properties only and use stable pagination, filter and sort contracts.
- State-changing requests validate input at the boundary and return a consistent error shape.
- Enquiry submission is idempotent and records consent without exposing customer information to public clients.
- Staff mutations create audit records containing actor, operation, resource and timestamp.
- Third-party responses are treated as untrusted input and validated before storage or display.
- Staging and production data, credentials, storage and analytics remain isolated.

## Completion definition

- A visitor can search, filter, view, save and enquire about a published property.
- A customer can sign in and manage saved items and enquiry history.
- Authorized staff can manage listings, agents, locations, articles, enquiries and media.
- Supabase migrations reproduce the complete database with tested row-level security.
- WhatsApp, map, email and analytics adapters work when their environment settings are supplied.
- Automated checks cover domain logic, database access policies, accessibility and core browser journeys.
- Staging and production deployment configurations are documented and reproducible.
- Security, privacy, SEO, performance, backup, monitoring and maintenance requirements have measurable checks.
