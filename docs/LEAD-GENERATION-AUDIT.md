# Lead-Generation Architecture Audit

## Enquiry journey
1. Customer opens a property or public enquiry form.
2. Frontend Zod validation trims and validates fields, consent and idempotency.
3. Frontend prevents duplicate concurrent submissions and preserves the idempotency key for unknown outcomes.
4. `submitEnquiry` calls `submit-enquiry`.
5. Edge Function validates method, origin, body size and Zod fields.
6. Durable enquiry IP/address and viewing/IP rate limits execute when configured.
7. Published, available property identity is validated.
8. Database uniqueness on `idempotency_key` prevents duplicate persistence.
9. Existing-key payload mismatches are rejected without returning another customer's record.
10. Staff CRM reads authorized enquiries through RLS.

## Viewing journey
1. Property detail or catalogue viewing form collects local Zambia date/time.
2. Frontend converts `Africa/Lusaka` local values to UTC.
3. Zod requires a future time at least 30 minutes ahead.
4. `submitViewingRequest` calls `submit-viewing`.
5. The Edge Function validates property, rate limit and idempotency.
6. Database trigger calculates an appointment range.
7. Confirmed staff assignments remain protected by the migration exclusion constraint.
8. Status history records insert/status changes.

## Classification
- Frontend enquiry/viewing forms: implemented and mocked-browser verified.
- Backend response parsing: implemented and mocked-browser verified.
- Idempotency backend checks: implemented and source verified.
- Database persistence: source/migration and schema verified; real local execution blocked.
- Edge handler execution: blocked by Docker/Deno availability.
- Staff CRM: source and role policy verified; real local retrieval blocked.
