# Security Operations

- Browser code receives only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- The service-role key exists only in Supabase Edge Function secrets.
- RLS is enabled on every application table. Anonymous reads are restricted to published content.
- Role checks use server-controlled profiles and security-definer helpers with fixed search paths.
- Enquiries are validated twice, rate limited, idempotent and inserted by an Edge Function.
- Public catalogue access requires both published and available state. CRM access is branch/assignment-aware; leases, offers, owner submissions and service cases are participant-scoped.
- Public property media accepts approved image types. Verification and owner evidence use separate private buckets restricted to PDF/JPEG/PNG and 10 MB by both Storage and application checks.
- Customer offer withdrawals are database-restricted to a status-only transition; reviewer, assignee and completion states are staff-controlled.
- Deployment headers restrict framing, content types, browser permissions and content sources.
- Logs contain identifiers and result codes, never enquiry bodies or credentials.

Quarterly review tasks include dependency audit, RLS tests for each role, staff access review, Storage policy review and recovery testing. For an incident, disable affected accounts or functions, preserve audit evidence, rotate credentials, assess affected records and notify management and counsel.

