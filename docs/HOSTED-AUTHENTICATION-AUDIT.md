# Hosted Authentication Audit

## Confirmed source defect

The original sign-in handler returned broad public messages based on SDK `Error.message` text and did not validate a complete session response. The registration handler reported success and stayed on the sign-up page instead of redirecting to sign-in.

## Implemented correction

- Centralized Supabase auth-code and status mapping in `src/auth-errors.ts`.
- Added registration redirect and local automatic-session cleanup in `src/services/auth.ts` and `src/auth-pages.ts`.
- Preserved safe return paths through sign-in, sign-up and registration confirmation URLs.
- Added in-flight submission guards and accessible loading labels.
- Preserved password recovery event and matching-user verification.
- Registration callbacks are informational and never establish account verification or dashboard access.
- No frontend profile insertion, service-role key or hosted record mutation was introduced.

## Hosted SQL diagnostic

Run the owner-approved read-only SQL block only in the hosted SQL editor. Its purpose is to check profile table/function/trigger/policy state. It must not be run by automated application code.

```sql
begin read only;

select to_regclass('public.profiles') as profiles_table;
select to_regprocedure('public.handle_new_user()') as profile_creation_function;
select
  count(*) as total_auth_users,
  count(*) filter (where email_confirmed_at is not null) as confirmed_email_users,
  count(*) filter (where email_confirmed_at is null) as unconfirmed_email_users
from auth.users;

select count(*) as total_profiles from public.profiles;
select count(*) as users_without_profiles
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

select tgname as trigger_name, tgenabled as enabled_state
from pg_trigger
where tgrelid = 'auth.users'::regclass and not tgisinternal;

select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
order by policyname;

rollback;
```

If `public.profiles` does not exist, stop before the dependent profile queries and investigate separately.

## Hosted manual configuration

Verify email authentication, registration permissions, email confirmation, Site URL, redirect allow-list, registration redirect, recovery redirect and SMTP configuration in Supabase Auth. Local routes:

- `http://localhost:4173`
- `http://localhost:4173/sign-in.html`
- `http://localhost:4173/reset-password.html`

Do not replace the production Site URL with localhost or disable email confirmation.

## Remaining evidence

No hosted credentials or users were modified or queried for this implementation. Registration email delivery, confirmation callbacks, recovery email delivery, real auth error codes and profile/RLS authorization require owner-authorized staging verification.
