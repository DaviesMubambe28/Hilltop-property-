# Production Deployment and Rollback

Production access is intentionally required for release.

1. Complete and approve staging UAT.
2. Create or verify the isolated production Supabase project, PITR/backups and Auth redirect URLs.
3. Export a verified backup before schema changes.
4. Link the Supabase CLI to the production reference and run `supabase db push --dry-run` for review, then `supabase db push`.
5. Deploy the Edge Function and set secrets through `supabase secrets set`. Never pass values in committed files.
6. Configure hosting variables, build with `npm ci && npm run ci && npm run build`, and deploy the immutable `dist/` output.
7. Configure DNS and HTTPS, then verify headers, homepage, catalogue query, authentication and a controlled enquiry.
8. Enable monitoring and analytics only after consent and account configuration are verified.

Rollback uses the previous immutable frontend deployment. For database failure, stop writes, preserve evidence and restore the verified pre-deployment backup or apply a reviewed forward-fix migration. Never reset the production database.

## Monitoring and incident response

Before launch, assign named owners and escalation contacts for hosting, Supabase, email delivery and customer enquiries. Monitor availability, browser errors, Edge Function failures, database saturation, authentication anomalies and notification delivery without logging message bodies, credentials or customer documents.

For a suspected incident: restrict affected access, preserve audit evidence, rotate compromised credentials through provider consoles, notify the accountable owner, assess affected records and legal notification duties, then restore service using the last verified deployment or backup. Record timestamps, decisions, affected systems and follow-up actions. Never paste production secrets or personal data into issue trackers.

