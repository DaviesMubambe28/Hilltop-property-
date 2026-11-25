# Spec: Enquiries and CRM

## Objective
Capture buyer, renter, seller and valuation enquiries, route them to staff, record consent and expose safe status history.

## Commands and structure
Use `npm run test:enquiries`, `npm run test:functions` and `npm run test:e2e -- enquiries`. Submission runs through `supabase/functions/submit-enquiry/`. Statuses are `new`, `contacted`, `qualified`, `closed` and `spam`; inputs include an idempotency key.

## Testing strategy
Cover validation, consent, throttling, duplicate submission, assignment, status changes and customer-history isolation.

## Boundaries and success criteria
Always normalize public input and atomically honour idempotency. Ask before retention changes. Never expose enquiries publicly or send their content to analytics. A valid retry creates one record and staff can manage it. Retention and SLA remain business-policy inputs.

