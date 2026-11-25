# Spec: Identity and Access

## Objective
Provide Supabase email authentication, customer profiles, staff roles and secure sessions for public accounts and the CMS.

## Commands and structure
Use `npm run test:auth`, `npm run test:db` and `npm run test:e2e -- auth`. Auth adapters live in `src/services/auth.ts`; session UI lives in `src/components/auth/`; authorization policies live in migrations. Roles are `customer`, `editor` and `admin`.

## Testing strategy
Cover sign-up, sign-in, sign-out, recovery, session refresh, customer ownership, editor permissions and admin-only staff management.

## Boundaries and success criteria
Always authorize through policies or Edge Functions. Ask before social login or mandatory MFA. Never trust client roles or persist raw tokens. Customers manage their records, editors manage content and only admins manage staff. Email templates, sender domain and MFA policy remain deployment inputs.

