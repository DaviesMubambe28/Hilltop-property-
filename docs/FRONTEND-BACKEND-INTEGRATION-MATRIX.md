# Frontend/backend integration matrix

| Feature | Frontend | Backend | Security boundary | Evidence | Status |
|---|---|---|---|---|---|
| Catalogue and filters | `src/app.ts` | `search_property_ids`, properties service | Public published-and-available RLS | Unit/build only | IMPLEMENTED BUT UNVERIFIED |
| Property details | `src/property-detail.ts` | Supabase properties and Storage | Public property/media policies | Demo browser journey | PARTIALLY WORKING |
| Enquiries | Public/property forms | `submit-enquiry` Edge Function | Validation, origin check, durable rate limit | Source/unit only | IMPLEMENTED BUT UNVERIFIED |
| Viewing requests | Property forms | `submit-viewing` Edge Function | Validation, origin check, durable rate limit | Source/unit only | IMPLEMENTED BUT UNVERIFIED |
| Sign in/up | Dedicated auth pages | Supabase Auth | Hosted Auth policy | Build and credential-free browser tests | IMPLEMENTED BUT UNVERIFIED |
| Recovery/reset | Dedicated recovery pages | Supabase recovery session and `updateUser` | Recovery token/session | Unit/build/browser shell | IMPLEMENTED BUT UNVERIFIED |
| Saved properties/searches | Account/catalogue | Supabase tables | Owner-scoped RLS | Unit/source only | IMPLEMENTED BUT UNVERIFIED |
| Property alerts | Account | Scheduled Edge Function | Cron secret and service-role RPC | Source/build only | IMPLEMENTED BUT UNVERIFIED |
| Staff CMS | `admin.html`, `src/admin.ts` | Supabase tables/RPC/Storage | Staff/admin RLS | Source/build only | IMPLEMENTED BUT UNVERIFIED |
| Floating WhatsApp | Public widget | Configured direct `wa.me` link | Public number only | Unit/browser test | VERIFIED WORKING when configured |
| Property assistant | Public widget | Existing validated catalogue URL filters | Public catalogue only | Unit/browser test | VERIFIED WORKING deterministic assistant |
| Hero rotation | Homepage | Not applicable | Not applicable | Asset inspection | BLOCKED BY INFRASTRUCTURE |

“Implemented but unverified” means source code exists but a configured Supabase environment has not exercised the path.
