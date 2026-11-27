# Lead-Generation Verification

## Implementation
Added `src/lead-submission.ts` with:
- Submission controller preventing concurrent duplicate requests.
- Unknown-outcome key reuse.
- Changed-payload key replacement.
- Confirmed response parsing.
- Zambia-local date formatting and conversion.

Updated `src/services/enquiries.ts`, property detail, catalogue viewing and public enquiry handlers to distinguish persisted success from validation, service failure and unknown outcomes.

## Verification
- Unit tests: 105 total after lead tests.
- Lead unit coverage: controller, malformed responses, backend errors, Zambia conversion and validation.
- Mocked lead browser integration: 10/10 across mobile and desktop.
- Complete integration suite: 30/30.
- Complete public suite: 107 passed, 1 expected mobile-only desktop skip.
- ESLint, TypeScript and production build pass.

## Enquiries
Confirmed mocked persistence displays a thank-you receipt only after an `id` is returned.
Malformed responses remain unconfirmed.
Rate-limited and failed requests remain recoverable and do not promise delivery.
Rapid duplicate clicks are prevented.

## Viewing appointments
Physical and virtual modes remain supported by existing schema.
New appointments display requested-state wording, not confirmed wording.
Zambia local date/time is explicitly converted to UTC before invoking the backend.
The database appointment range and exclusion constraint remain untouched.

## Local database and Edge limitations
Docker Desktop is not running and Deno is absent. `supabase status` and `supabase functions serve` cannot inspect or start the local stack. Therefore no real local database or real Edge Function journey was claimed.
