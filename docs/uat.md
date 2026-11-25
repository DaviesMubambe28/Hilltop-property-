# Staging UAT Checklist

- [ ] Staging uses its own Supabase project and non-production email recipients.
- [ ] Two customers cannot read each other's saved searches, alerts, submissions, offers or specialist service requests.
- [ ] A landlord and tenant can read only leases in which they participate and can create maintenance cases only for those leases.
- [ ] Anonymous visitors cannot read verification evidence, owner documents, leases, maintenance cases, offers or transaction milestones.
- [ ] A customer can withdraw an offer but cannot alter its amount, listing, buyer or conditions during withdrawal.
- [ ] Staff can review submissions, offers, maintenance and service cases; customers cannot set reviewer, assignee or completed states.
- [ ] Migrations and seed reference data apply to an empty database.
- [ ] Anonymous visitors see published properties only.
- [ ] Search combinations, sorting and pagination return correct properties.
- [ ] Details, galleries, WhatsApp links and map directions are accurate.
- [ ] Enquiry and viewing requests persist once and notify the configured recipients.
- [ ] Registration, login, recovery, sign-out, saved properties and history work.
- [ ] Editors manage properties, galleries, enquiries and content without admin access.
- [ ] Admins can assign and disable staff roles.
- [ ] Anonymous, customer and editor attempts against restricted records are denied.
- [ ] Mobile, tablet and desktop layouts pass keyboard and screen-reader review.
- [ ] Metadata, canonical URLs, sitemap and robots rules match staging policy.
- [ ] Error monitoring, backup, restore and rollback procedures are exercised.
- [ ] Business owner records approval, date and known exceptions.

