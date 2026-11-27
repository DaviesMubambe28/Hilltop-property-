# Frontend/backend integration matrix

| Feature | Frontend | Backend | Security boundary | Evidence | Status |
|---|---|---|---|---|---|
| Catalogue and filters | `src/app.ts` | `search_property_ids`, properties service | Public published-and-available RLS | Real local catalogue/search | VERIFIED WORKING locally |
| Property details | `src/property-detail.ts` | Supabase properties and Storage | Public property/media policies | Real staff publish and anonymous retrieval | VERIFIED WORKING locally |
| Enquiries | Public/property forms | `submit-enquiry` Edge Function | Validation, origin check, durable rate limit | Frontend and mocked integration verified; real local worker blocked | PARTIALLY VERIFIED |
| Viewing requests | Property forms | `submit-viewing` Edge Function | Validation, origin check, durable rate limit | Frontend and mocked integration verified; real local worker blocked | PARTIALLY VERIFIED |
| Sign in/up | Dedicated auth pages | Supabase Auth | Auth policy and profile trigger | Real public sign-up/sign-in/session/sign-out | VERIFIED WORKING locally |
| Recovery/reset | Dedicated recovery pages | Supabase recovery session and `updateUser` | `PASSWORD_RECOVERY` event and matching user session | Mocked navigation/reset guards; email delivery and hosted callback unverified | PARTIALLY VERIFIED |
| Saved properties/searches | Account/catalogue | Supabase tables | Owner-scoped RLS | Real two-user read/delete isolation and persistence | VERIFIED WORKING locally |
| Property alerts | Account | Scheduled Edge Function | Cron secret and service-role RPC | Real duplicate RPC call creates one notification | RPC VERIFIED; SCHEDULE UNVERIFIED |
| Staff CMS | `admin.html`, `src/admin.ts` | Supabase tables/RPC/Storage | Staff/admin RLS | Real draft/media/publish flow and customer denial | VERIFIED WORKING locally |
| Floating WhatsApp | Public widget | Configured direct `wa.me` link | Public number only | Unit/browser test | VERIFIED WORKING when configured |
| Property assistant | Public widget | Existing validated catalogue URL filters | Public catalogue only | Unit/browser test | VERIFIED WORKING deterministic assistant |
| Hero rotation | Homepage | Not applicable | Not applicable | Asset inspection | BLOCKED BY INFRASTRUCTURE |

“Locally” means the path was exercised against the isolated Supabase stack, not a hosted staging or production project.
