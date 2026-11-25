# Viewing Appointment Workflow

Implemented on 24 November 2026:

- Public physical/virtual viewing request with contact consent, preferred date/time, honeypot and stable idempotency key.
- Server-side property availability validation and persistent HMAC-keyed rate limiting.
- Optional Resend notification when credentials are configured.
- Customer ownership and staff RLS; anonymous clients cannot read or insert appointments directly.
- Staff queue with assignment, alternative time and status management.
- Requested, confirmed, rejected, proposed, cancelled and completed statuses with immutable history rows.
- PostgreSQL exclusion constraint preventing overlapping confirmed appointments for the same assigned staff member.
- Fifteen pgTAP assertions now cover public catalogue, search, CRM privacy and viewing-request privacy.

Apply `202611240005_viewing_appointments.sql`, configure `RATE_LIMIT_SECRET`, and deploy `submit-viewing` before enabling this workflow in staging. Live persistence, email delivery and conflict behavior remain unverified until a Supabase environment is available.
