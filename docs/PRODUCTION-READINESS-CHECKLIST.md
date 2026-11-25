# Production readiness checklist

Assessment date: 25 November 2026. Allowed states are **Passed**, **Failed**, **Blocked**, and **Not yet tested**.

| Launch gate | State | Evidence / required action |
|---|---|---|
| Verified isolated staging project | Blocked | Owner must provide and identify a non-production Supabase project and staging hostname. |
| Migrations reviewed and applied to staging | Blocked | Run dry-run, backup, push and database tests only after project identity verification. |
| Authenticated buyer and tenant journeys | Blocked | Requires customer account, real staging data, enquiry/viewing persistence and notification delivery. |
| Seller submission reaches authorised staff | Blocked | Requires Auth, private Storage and staff workflow on staging. |
| Staff listing/CRM journey | Blocked | Requires branch-assigned staff account. |
| Administrator permissions and audit trail | Blocked | Requires distinct admin and ordinary staff accounts plus denial tests. |
| Owner-approved property inventory | Blocked | No genuine inventory supplied. |
| Genuine authorised photography | Blocked | See `PHOTOGRAPHY-REQUIREMENTS.md`. |
| No known critical functional defects | Passed locally | CI and 43 applicable Playwright checks pass; live-service defects remain unknowable until staging. |
| No known critical security defects | Passed for tested scope | Isolated RLS assertions passed previously; complete Auth/Storage/API privacy testing remains blocked. |
| Automated accessibility review | Passed | Axe found no critical/serious issues on seven representative pages at mobile and desktop after fixes. |
| Manual accessibility review | Not yet tested | Owner/UAT team must perform screen-reader, zoom, keyboard and device review. |
| Production-build performance review | Passed with exception | Lighthouse performance 96–99 and CLS ≤0.028; homepage LCP 2.7 s misses the 2.5 s target. |
| Backup restoration verification | Blocked | Restore a staging backup into a disposable project and record duration/count checks. |
| Monitoring and error reporting | Blocked | Owner must configure provider/project, alert recipients and escalation policy. |
| Email sender and recipient safety | Blocked | Configure verified sender and approved staging recipients. |
| Domain, HTTPS, sitemap and robots review | Blocked | Confirm final domain and hosting deployment. |
| UAT completed | Not yet tested | Execute `docs/uat.md` against staging and record exceptions. |
| Owner production approval | Not yet tested | Written approval is required after all blocking gates pass. |

## Verdict

**Not ready for production.** The codebase passes its local quality gates, but staging integration, genuine content, service delivery, backup restoration and owner UAT are mandatory unresolved launch gates.
