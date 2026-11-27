# Authentication Navigation Audit

## Current authentication architecture
Supabase is optional and initialized through `src/config.ts` and `src/supabase.ts`. All dedicated authentication forms are handled by `src/auth-pages.ts`, with request operations delegated to `src/services/auth.ts`.

## Existing navigation routes
- `/sign-in.html`
- `/sign-up.html`
- `/forgot-password.html`
- `/reset-password.html`
- `/sign-out.html`
- `/account.html`
- `/admin.html`

## Public account entry mechanisms
### Confirmed dedicated routes
The homepage button in `src/app.ts` opens `/sign-in.html?returnTo=...` for an anonymous visitor and `/account.html` for a loaded profile.

Account links rewritten by `src/public-widgets.ts` open `/sign-in.html?returnTo=<current path and query>`, preserving the intended current page.

### Legacy mechanisms
`vite.config.ts` still contains two older mechanisms:
- The homepage uses a disabled `<button data-account-entry>` that is enabled asynchronously by `src/app.ts`.
- Other pages use `<a href="/?account=required">`.

This legacy public-page link does not directly enter `sign-in.html`. It relies on the homepage account handler, which then redirects with the homepage URL as `returnTo`. This loses the original public-page destination.

## Customer, staff, and administrator entry
- `/account.html` calls `currentProfile()` and redirects anonymous sessions to `/?account=required`.
- `src/admin.ts` allows only active `editor` and `admin` profiles. Customers are redirected to `/?staff-access=required`.
- `src/admin-entry.ts` clearly replaces the staff workspace with a configuration message when Supabase is unconfigured.

## Session management
Supabase client configuration in `src/supabase.ts` persists the session, refreshes tokens, and detects the session in the URL.

Profile loading is implemented by `src/services/auth.ts`. Backend profile and role values determine customer/staff/admin behaviour.

## Password recovery
`src/services/auth.ts` sends recovery email with `/reset-password.html` as `redirectTo`.

`src/auth-pages.ts` updates the password after calling `getSession()`. The recovery page does not verify that the active session is specifically a recovery session; a normal authenticated session could reach the page and pass `getSession()`.

Invalid or expired recovery links can still display the form. The current validation occurs only when submitted, and the message is generic and accurate enough to recover by requesting a new link.

## Redirect validation
`src/auth-navigation.ts` uses `safeReturnPath()` to reject missing, protocol-relative, cross-origin, and invalid values and fall back to `/account.html`. Relative paths are resolved against the current origin and only same-origin pathname/search/hash values are returned.

## Security findings
### Confirmed defects
1. `vite.config.ts` public account controls conflict with dedicated authentication navigation: other public pages go through `/?account=required` rather than directly to sign-in.
2. Direct customer portal access in `src/account.ts` loses a precise `returnTo=/account.html` destination.
3. Password reset validates `getSession()` only, not a valid recovery state.

### Potential risks
- Expired sessions: portal behavior depends on hosted profile/Auth responses and is not mocked comprehensively.
- Authentication failure output: the UI exposes Supabase error messages directly in several flows.
- JavaScript-disabled navigation: authentication forms have no server-side fallback or HTML `action`/`method`, so submitting with JavaScript unavailable is not safely handled.
- Staff authorization is frontend-gated and also depends on backend RLS for real security.

## Accessibility findings
Automated axe checks passed for all five authentication pages. Status feedback uses `role="status"` and password visibility controls expose `aria-pressed`.

JavaScript-disabled state messaging and sign-out confirmation cannot be guaranteed accessible until navigation behavior is exercised without JavaScript.

## Recommended implementation changes
Make the shared public account control a same-origin link to `/sign-in.html?returnTo=<encoded current destination>` everywhere. Remove legacy `/?account=required` and `data-account-entry` homepage handling, or centralize both behind one shared navigation helper.

In `src/account.ts`, send anonymous users directly to `/sign-in.html?returnTo=%2Faccount.html` rather than the homepage.

In `src/auth-pages.ts`, initialize invalid recovery sessions explicitly and disable reset submission until a real recovery context is confirmed. Supabase's recovery event/session semantics should be handled before calling `updatePassword`.

Add an HTML fallback to authentication forms, or disable and explain form submission when JavaScript is unavailable.

## Exact source files requiring modification
- `vite.config.ts`
- `src/app.ts`
- `src/account.ts`
- `src/public-widgets.ts`
- `src/auth-navigation.ts`
- `src/auth-pages.ts`
- `src/services/auth.ts`
- `src/admin.ts`
- `src/admin-entry.ts`
- Authentication HTML pages

## Proposed acceptance tests
- Anonymous navigation from homepage, catalogue, detail, and any public page preserves the exact same-origin destination.
- External and protocol-relative `returnTo` values fall back to `/account.html`.
- Authenticated profile and role controls route to the expected portal.
- Sign-out requires confirmation and cancel preserves the account page.
- Normal sessions cannot update passwords through `/reset-password.html`.
- Valid and expired recovery links receive distinct, accurate outcomes.
- Unconfigured and failed backend requests show accurate non-production-safe messages.
- No real Supabase host is contacted by public or integration browser tests.
- Authentication controls remain usable and accessible with keyboard and screen-reader navigation.

## Unverified hosted dependencies
Hosted Supabase Auth email delivery, hosted password recovery links, hosted role/session behavior, and hosted Edge Function authorization remain unverified. Mocked browser evidence must not be represented as hosted authentication verification.

## Phase 2 resolution status
- Public account navigation: unified on dedicated sign-in anchors; the legacy homepage button and legacy `/?account=required` mechanism were removed.
- Return validation: centralized and hardened in `src/auth-navigation.ts`.
- Customer account: direct anonymous access now reaches sign-in with `/account.html` as the safe return destination.
- Password recovery: ordinary sessions and direct reset access remain locked until a `PASSWORD_RECOVERY` event supplies a matching user.
- Sign-out: preserved as a deliberate confirmation flow.
- Hosted recovery, email delivery and role authorization remain unverified.
