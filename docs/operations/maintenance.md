# Maintenance and Recovery

- Daily: monitor uptime, Edge Function failures, enquiry notification failures and database resource alerts.
- Weekly: review failed enquiries, Storage growth, slow queries and authentication anomalies.
- Monthly: install tested dependency updates, run the full CI suite and review Search Console and Core Web Vitals.
- Quarterly: review staff access, RLS policies, security headers, retention queues and restore a backup into an isolated project.
- Before releases: capture a backup, review migrations, verify rollback target and run staging UAT.

Supabase-managed backups should be supplemented by scheduled logical exports stored encrypted with access logging and retention controls. Recovery tests must record date, operator, backup identifier, restore duration and verification results.

