# CRM Integration Verification

## Existing staff workflow
The staff CRM supports enquiry queue retrieval, enquiry routing, assignment, notes, follow-ups and viewing appointment queue operations through `src/admin.ts`.

## Authorization
The migration grants:
- Customers access to their own enquiries.
- Staff access within assigned/branch rules.
- Administrators broader access.
- Anonymous users no CRM read policy.
- Inactive staff denial through `is_staff`.
- Audit triggers for enquiry status, assignment, branch, notes and follow-ups.

## Viewing integrity
`viewing_appointments` uses a confirmed-status exclusion constraint with a staff assignment and timestamp range. Status history is trigger-recorded.

## Verification
Source and migration verification: complete.
Mocked CRM and role behavior: existing integration coverage remains.
Real local staff retrieval: blocked by Docker/Deno and unavailable local database.
