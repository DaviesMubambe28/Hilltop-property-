# Authentication Hardening Report

## Starting repository state
- Starting HEAD: `52279dc`
- Branch: `fix/local-verification`
- Existing slideshow, browser isolation and authentication audit work remained uncommitted and was preserved.

## Confirmed defects corrected
- Public account entry used a disabled homepage button and inconsistent legacy links.
- Public account links could lose the original return destination.
- Password reset accepted an ordinary existing Supabase session instead of requiring `PASSWORD_RECOVERY`.
- Direct customer-account access could return through the homepage instead of the dedicated sign-in page.

## Files modified
- `vite.config.ts`
- `src/app.ts`
- `src/account-entry.ts`
- `src/account.ts`
- `src/public-widgets.ts`
- `src/auth-navigation.ts`
- `src/auth-pages.ts`
- `src/auth-recovery.ts`
- `src/services/auth.ts`
- `reset-password.html`
- `tests/auth-navigation.test.ts`
- `tests/auth-recovery.test.ts`
- `e2e/authentication-navigation.spec.ts`
- `e2e-integration/authentication-journey.spec.ts`

## Navigation architecture
Public headers now render real account anchors pointing to `/sign-in.html` with a same-origin `returnTo` destination. JavaScript updates the anchor to the actual current pathname, query, and hash. Authenticated profiles update the label and destination to `/account.html`.

## Return URL validation
`safeReturnPath()` rejects external origins, protocol-relative paths, control characters, backslashes, encoded slash/backslash sequences, authentication routes and auth-like routes. `buildSignInUrl()` constructs the centralized sign-in URL.

## Customer account access
`account-entry.ts` waits for profile verification before displaying account content. Anonymous users are sent to sign-in with `/account.html` as the return destination. Profile lookup failures display a recoverable unavailable state instead of exposing account content or redirecting indefinitely.

## Recovery implementation
The reset page is hidden until a `PASSWORD_RECOVERY` Auth event supplies a verified user ID. Ordinary `SIGNED_IN` and `INITIAL_SESSION` events cannot unlock it. Before update, the application verifies the current SDK user matches the recovery user. Password mismatch and minimum length reject submission before SDK update.

The recovery request now derives the redirect from validated `VITE_SITE_URL`. The UI uses a non-disclosing recovery request message and distinguishes service outages through SDK errors.

This implementation is a browser workflow guard only. Supabase server-side authorization remains authoritative.

## Role and sign-out boundaries
Existing role checks in `src/admin.ts` remain unchanged. Customers, anonymous visitors and failed role lookups fail closed. The sign-out page remains confirmation-only; it does not terminate a session merely when opened.

## Automated evidence
- Unit tests: 94 passed across 16 test files.
- Authentication navigation browser tests: 18 passed.
- Authentication mocked integration tests: 8 passed.
- Slideshow targeted tests: 6 passed.
- Complete integration suite: 20 passed.
- Targeted affected public suite: 51 passed, 1 expected desktop skip.
- Complete public browser suite: 107 passed, 1 expected mobile-only desktop skip.
- Complete mocked integration suite: 20 passed.
- Slideshow regression suite: 6 passed.
- Authentication-specific public tests: 18 passed.
- Authentication-specific mocked integration tests: 8 passed.
- ESLint passed.
- TypeScript passed.
- Production build passed.

The final complete public suite was rerun after the reset message correction and is recorded by Playwright output; final totals are reported only after that run completes.

## Security verification
No production Supabase project was accessed. Public tests used invalid synthetic credentials. Integration tests used `hilltop-test.invalid` and route interception. No hosted migration, policy change, Edge Function deployment or credential exposure occurred.

## Remaining hosted requirements
- Hosted registration and recovery email delivery.
- Hosted redirect allow-list configuration.
- Real `PASSWORD_RECOVERY` callback verification.
- Hosted role authorization and profile lookup.
- Real session expiry behavior.
- Hosted recovery and sign-out state cleanup.

## Screenshot evidence
Actual unconfigured-browser captures are stored in `docs/screenshots/authentication-verification/` for 320, 390, 768, 1024 and 1440 widths across sign-in, sign-up, forgot-password, invalid reset, sign-out, account and admin states.
