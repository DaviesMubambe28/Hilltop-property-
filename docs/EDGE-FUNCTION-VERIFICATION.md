# Edge Function Verification

## Runtime configuration
- Supabase CLI: 3.1.0
- Docker CLI: installed
- Docker daemon: unavailable
- Deno: not installed
- Node: v24.19.0
- npm: 11.17.0

## Attempted verification
`supabase status --output json` failed because Docker Desktop's Linux engine pipe was unavailable.
`supabase functions serve submit-enquiry --no-verify-jwt` failed at local database inspection before application handler execution.

## Dependency imports
Both submission handlers changed from `https://esm.sh/@supabase/supabase-js@2` to pinned `npm:@supabase/supabase-js@2.47.10`, matching the application's installed Supabase SDK major/minor context.

This change could not be runtime-executed locally because Edge runtime infrastructure is unavailable.

## Security source review
- Methods and CORS are restricted.
- Body size, Zod validation and property availability are server checked.
- Service-role credentials remain server-side.
- Public clients cannot supply privileged customer or staff identity directly.
- Existing durable rate-limit RPC is used.
- Idempotency keys are unique in the database.
- Existing keys now also reject mismatched payloads in the submitted application handler.

## Verification status
Source: implemented.
Mocked browser: implemented and verified.
Real local Edge: blocked.
Hosted staging: required.
