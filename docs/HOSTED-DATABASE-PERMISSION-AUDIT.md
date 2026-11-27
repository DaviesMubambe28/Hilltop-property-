# Hosted Database Permission Audit

## Confirmed evidence

The hosted owner diagnostic reported:

- `schema_access = true`
- `profile_select = false`
- `profile_update = false`
- `rls_enabled = true`

The authenticated role therefore has schema access but lacks table-level SELECT permission on `public.profiles`.

## Proposed migration

The repository includes a new, unapplied migration:

- `supabase/migrations/202611270001_authenticated_profile_select.sql`

It contains only:

```sql
begin;

grant select on table public.profiles
to authenticated;

commit;
```

This migration must be owner-reviewed and reconciled with hosted migration history before execution. It was not applied automatically.

## Account operation matrix

| Resource | Operation | Role | Existing policy/grant concern |
|---|---|---|---|
| `public.profiles` | SELECT | authenticated | RLS enabled; table-level SELECT confirmed missing |
| `public.profiles` | UPDATE full_name/phone | authenticated | Table-level UPDATE and column policy require review |
| `public.saved_properties` | SELECT/INSERT/DELETE | authenticated | Existing ownership filters in account code; verify grants and RLS |
| `public.saved_searches` | SELECT/INSERT/UPDATE/DELETE | authenticated | Existing user-id filters; verify grants and RLS |
| `public.system_notifications` | SELECT/UPDATE | authenticated | Existing user-id filters; verify grants and RLS |
| `public.property_submissions` | SELECT/INSERT/UPDATE | authenticated | Existing `owner_id` filters; verify grants and RLS |
| `public.property_submission_documents` | INSERT/SELECT/DELETE | authenticated | Submission ownership must remain enforced by RLS |
| `public.leases` | SELECT | authenticated | Tenant/landlord ownership filter must be preserved |
| `public.maintenance_requests` | SELECT/INSERT | authenticated | Linked lease authorization must remain enforced |
| `public.property_offers` | SELECT | authenticated | Buyer ownership filter must be preserved |
| `public.transaction_milestones` | SELECT | authenticated | Expose only through authorized offers |
| `public.property_service_requests` | SELECT/INSERT | authenticated | Existing customer-id filter must be preserved |
| `public.enquiries` | SELECT | authenticated | Existing customer-id filter must be preserved |
| `owner-submission-documents` storage | Upload/read/remove | authenticated | Path ownership and bucket/RLS policy require review |

No anonymous customer profile access or unrestricted UPDATE grant is proposed.
