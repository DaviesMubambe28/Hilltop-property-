# Production acceptance checklist

Status as of 26 November 2026. “Internal” means verified locally against reconstructed v4. “Owner/external” requires authorised people, systems or source material.

## Content and business truth

- [ ] **Owner:** import genuine available inventory and confirm price, currency, listing type, status, location and category facts.
- [ ] **Owner:** provide rights-cleared, property-specific photography, ordering, alt text and publication expiry.
- [ ] **Owner:** approve legal company name, service area, office addresses, registration details, phone and email.
- [ ] **Owner:** appoint genuine agents and approve names, roles, biographies, portraits, direct contact and listing responsibility.
- [ ] **Owner/legal:** approve privacy, terms, consent wording, retention, deletion and calculator disclaimers.
- [x] **Internal:** preview fixtures and illustrative images are clearly disclosed; unsupported staff, counts and testimonials are absent.

## Customer conversion and delivery

- [ ] **Owner/staging:** verify the WhatsApp number, property-specific message and mobile/desktop handoff.
- [ ] **Owner/staging:** verify enquiry email/CRM delivery, sender authentication, reply handling, spam protection and failure alerting.
- [ ] **Owner/staging:** verify viewing requests, time zones, duplicate handling, notifications, ownership and cancellation/rescheduling.
- [ ] **Owner:** define response-time responsibility, escalation and after-hours behaviour.
- [x] **Internal:** guarded enquiry/viewing interfaces and mocked success/failure paths pass without false success.

## Authenticated operations

- [ ] **Owner/staging:** supply isolated customer, staff/editor and administrator test accounts with synthetic data.
- [ ] **Owner/staging:** execute sign-in, reset, saved properties, alerts, enquiries, viewing history and account/privacy workflows.
- [ ] **Owner/staging:** execute staff listing creation/edit/publication, media management, enquiry ownership and audit history.
- [ ] **Owner/staging:** execute administrator role/permission workflows and verify least privilege.
- [x] **Internal:** safe unconfigured entry states render consistently; no security boundary was bypassed.

## Quality and accessibility

- [x] **Internal:** lint, TypeScript, 63 unit tests, production build, 69 public browser passes plus one existing skip, and 12 mocked integration passes.
- [x] **Internal:** 43 automated axe checks pass without serious or critical findings.
- [x] **Internal:** 98 renders cover seven required viewport sizes with clean geometry/runtime metadata.
- [ ] **Owner/external:** test current iOS Safari, Android Chrome, desktop Safari/Firefox/Edge and representative low-memory hardware.
- [ ] **Owner/external:** complete NVDA/Firefox, JAWS/Chrome and VoiceOver/Safari task testing.
- [ ] **Owner/external:** run participant sessions across buyers, renters, sellers and high-value investors; record task success and confusion.

## Performance and resilience

- [x] **Internal:** controlled slow-network/4× CPU measurements meet provisional LCP, CLS and transfer targets on three unconfigured routes.
- [ ] **Staging:** repeat with genuine image payloads, realistic catalogue volume, maps, consent state and backend latency.
- [ ] **Production:** establish field Core Web Vitals, error monitoring, uptime alerts, delivery-failure alerts and data-retention monitoring.
- [ ] **Operations:** test provider outage, missing media, expired listing, email failure, rate limiting and recovery ownership.

## Security, data and restoration

- [x] **Internal:** migrations, RLS, authentication and protected operational modules remain unchanged from the accessible baseline; no production-security claim follows from that preservation.
- [x] **Internal:** committed-history scan found no non-example environment file, private-key or JWT candidate; the recovery package excludes working environment files.
- [ ] **Authorised security review:** verify RLS and role matrices against staging, abuse/rate controls, dependency findings, headers/CSP, privacy rights and log redaction.
- [ ] **Operations:** configure encrypted database/media backups, retention, restore ownership and a timed restoration exercise.
- [x] **Internal:** the portable Git bundle was extracted, cloned and object-verified with exact commit/tree equality.

## Hosting, release and rollback

- [ ] **Owner/operations:** approve hosting region, DNS, TLS, environment variables, Supabase origins, caching, image policy and budget.
- [ ] **Owner/operations:** create isolated staging and production projects; document access and separation.
- [ ] **Owner/operations:** define CI quality gates, deployment approvals, migration procedure and monitoring links.
- [ ] **Owner/operations:** document rollback triggers, previous-artifact retention, database compatibility and decision owner.
- [ ] **Owner:** grant explicit production deployment approval after all blocking items above are signed off.

Production acceptance remains open until every owner/external blocker relevant to launch is evidenced, not verbally assumed.
