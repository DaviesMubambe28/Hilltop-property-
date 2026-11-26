# Authentication verification

Routes added: `/sign-in.html`, `/sign-up.html`, `/forgot-password.html`, `/reset-password.html`, and `/sign-out.html`.

Implemented controls include password visibility, matching-password checks, privacy/terms acceptance, non-disclosing recovery feedback, recovery-session validation, Supabase password update, deliberate sign-out confirmation, and same-origin return-path validation.

Verified locally: lint, TypeScript, unit tests, production build, route rendering, missing-configuration behavior, and automated WCAG checks at mobile and desktop sizes.

Still required in staging: registration email confirmation, correct/incorrect credentials, recovery email delivery, expired recovery link, session expiry, two-user isolation, hosted Auth redirect allow-list, and post-sign-out protected-route behavior.
