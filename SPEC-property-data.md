# Spec: Property Data

## Objective
Store properties, agents, locations, articles, media and site settings in Supabase PostgreSQL with reproducible migrations and safe public read models.

## Tech stack and commands
Supabase PostgreSQL, Storage and generated TypeScript types. Use `supabase start`, `supabase db reset`, `npm run test:db` and `npm run db:types`.

## Structure and style
Keep migrations in `supabase/migrations/`, deterministic records in `supabase/seed.sql` and generated types in `src/types/database.ts`. Tables use UUID keys, timestamps, constrained enums, foreign keys and indexed search fields.

## Testing strategy
SQL tests verify constraints, published visibility, indexes, storage rules and repeatable seed data.

## Boundaries and success criteria
Always use migrations and RLS. Ask before destructive migrations. Never store secrets or unbounded HTML. A clean reset must build and seed the schema. Public clients may read published content only. Final taxonomy and retention are UAT decisions.

