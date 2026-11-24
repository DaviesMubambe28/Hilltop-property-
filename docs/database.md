# Database Schema

The schema is created by ordered files in `supabase/migrations/`.

## Main relationships

- `auth.users` has one `profiles` record created by a database trigger.
- `profiles` can represent customers or staff and may link to one `agents` record.
- `properties` belong to optional categories, types, locations, branches and agents.
- `property_images`, `property_features` and `property_amenities` belong to properties.
- `saved_properties`, `saved_searches` and `property_views` connect customers to catalogue activity.
- `enquiries` optionally connect customers and properties and have notes and follow-ups.
- Pages, articles, FAQs, testimonials, partners, projects and navigation provide CMS content.
- `audit_logs` records staff mutations on operational and content tables.

All externally writable tables use constraints and RLS. Public access is limited to published content. Service-role access is confined to Edge Functions.

Apply locally with `supabase start && supabase db reset`. Apply to a linked remote project with `supabase link --project-ref PROJECT_REF` followed by `supabase db push`. Review the generated migration diff before every production push.

