# Customer Account Access Audit

## Root cause

The account entry and account module both called `currentProfile()`, creating duplicate authentication and profile reads. The entry catch block also combined profile, import and initialization failures into one generic message.

## Implemented correction

- `currentProfile()` now returns only a verified matching `auth.getUser()` identity and profile row.
- Authentication and profile query failures are wrapped as structured `AccountAccessError` values.
- Account entry now redirects only for an absent session and keeps profile permission failures on an explicit profile error state.
- The account module receives the verified session once and no longer repeats `currentProfile()`.
- Account sections load independently; one failed section does not prevent profile or other sections from rendering.
- Raw Supabase error messages are removed from customer-facing account states.
- Protected account content remains hidden until verification and initialization complete.
- Account initialization has a 12-second timeout boundary.

## Hosted evidence

Owner SQL evidence confirms an authentication account, confirmed email, matching profile row, customer role and active profile. It does not verify browser Data API access or grants. No hosted data or permissions were changed.

## Permission check for owner

```sql
select
  has_schema_privilege('authenticated', 'public', 'USAGE') as schema_access,
  has_table_privilege('authenticated', 'public.profiles', 'SELECT') as profile_select,
  has_table_privilege('authenticated', 'public.profiles', 'UPDATE') as profile_update;
```

Any permission migration requires separate owner approval. No automatic hosted change was made.

## Routing correction — 27 November 2026

The general My Account entry now requests `/account.html`. The legacy homepage return `/` is normalized to `/account.html` after sign-in. Property-specific actions continue to preserve their current property or catalogue destination.

Table-level `SELECT` remains missing on hosted `public.profiles`; this is not resolved until the proposed migration is owner-approved and applied through hosted migration history.
