# Authentication verification

Routes added: `/sign-in.html`, `/sign-up.html`, `/forgot-password.html`, `/reset-password.html`, and `/sign-out.html`.

Implemented controls include password visibility, matching-password checks, privacy/terms acceptance, non-disclosing recovery feedback, recovery-session validation, Supabase password update, deliberate sign-out confirmation, and same-origin return-path validation.

Phase 2 also unified public account links around `/sign-in.html?returnTo=...`, added account-profile loading protection, and required a Supabase `PASSWORD_RECOVERY` event before enabling reset submission. Ordinary sessions and direct reset access remain locked.

Verified locally: lint, TypeScript, unit tests, production build, route rendering, missing-configuration behavior, and automated WCAG checks at mobile and desktop sizes.

Still required in staging: registration email confirmation, correct/incorrect credentials, recovery email delivery, expired recovery link, session expiry, two-user isolation, hosted Auth redirect allow-list, and post-sign-out protected-route behavior.

## Hosted authentication hardening — 27 November 2026

Registration now preserves `returnTo`, redirects accepted submissions to sign-in, and requires manual sign-in. Where Supabase creates an automatic session, the frontend performs local-session cleanup before navigation. Cleanup failures remain locked until a dedicated retry succeeds.

Authentication errors are mapped from Supabase auth codes and service status; arbitrary SDK/database messages are not rendered. Sign-in and sign-up forms use duplicate-submission guards and accessible loading labels.

Mocked verification passed: 116 unit tests, 18 targeted public authentication-navigation tests, and 8 targeted mocked authentication integration tests across mobile and desktop. ESLint, TypeScript and production build pass. Hosted callback delivery and real Supabase error-code verification remain separate staging work.

## Customer account and authentication slideshow — 27 November 2026

The customer account entry now verifies the profile once through `getUser()` and structured profile access, and account sections load independently. The account module receives the verified session rather than repeating profile verification.

Sign-in and sign-up use the approved logo and five existing local real-estate photography assets in a desktop-only slideshow. Mobile hides the editorial panel and does not request slideshow imagery.

Verified locally: 121 unit tests pass, 22 authentication/slideshow browser tests pass, 8 mocked authentication integration tests pass, and lint/typecheck/build pass. A real owner sign-in remains required before declaring the hosted account-loading defect resolved.

## Routing and hosted permission correction — 27 November 2026

General My Account links now use `/sign-in.html?returnTo=%2Faccount.html`. A legacy return destination of `/` is normalized to `/account.html`, while safe property and catalogue destinations remain unchanged.

Hosted evidence confirms RLS is enabled but the authenticated role lacks table-level SELECT and UPDATE permissions on `public.profiles`. A narrowly scoped proposed SELECT migration is documented but was not applied. Real hosted sign-in and account Data API access remain unverified.
