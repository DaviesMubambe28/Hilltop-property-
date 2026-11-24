# Spec: Public Catalogue

## Objective
Power property browsing, details, search, filters, sorting, pagination, saved properties and saved searches from Supabase.

## Commands and structure
Use `npm run test:catalogue`, `npm run test:e2e -- catalogue` and `npm run build`. Queries live in `src/services/properties.ts`; URL parameters are the source of filter state. Inputs support query, location, listing type, price, page, page size and sort.

## Testing strategy
Cover combined filters, empty results, invalid parameters, pagination, sorting, saved-state ownership and keyboard operation.

## Boundaries and success criteria
Always paginate and encode filters in the URL. Ask before ranking changes. Never return drafts or owner details. Search and filters must update results and survive refresh. Signed-in customers can save properties and searches.

