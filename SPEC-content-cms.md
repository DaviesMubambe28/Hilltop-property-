# Spec: Admin Dashboard and CMS

## Objective
Allow authorized staff to manage properties, agents, locations, articles, media, enquiries and global settings.

## Commands and structure
Use `npm run test:cms`, `npm run test:e2e -- cms` and `npm run test:a11y`. Views live under `src/admin/`; forms share validation schemas; actions are create, edit, publish, archive and restore. Media uses Supabase Storage limits.

## Testing strategy
Cover role gates, validation, drafts, publishing, archiving, upload failures, concurrent edits and audit records.

## Boundaries and success criteria
Always require staff authentication and preserve audit history. Ask before bulk destruction. Never render unsanitized HTML. Editors manage content and enquiries; admins additionally manage staff and settings. Publishing defaults to one-step approval.

