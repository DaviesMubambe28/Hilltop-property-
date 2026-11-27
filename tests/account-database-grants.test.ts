import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migrationPath = new URL(
  '../supabase/migrations/202611270003_authenticated_account_grants.sql',
  import.meta.url,
);

describe('authenticated account database grants', () => {
  it('grants each account table the operations used by the browser', () => {
    const sql = readFileSync(migrationPath, 'utf8').toLowerCase().replace(/\s+/g, ' ');

    expect(sql).toContain('grant select, insert, delete on table public.saved_properties to authenticated');
    expect(sql).toContain('grant select, insert, update, delete on table public.saved_searches to authenticated');
    expect(sql).toContain('grant select, update on table public.system_notifications to authenticated');
    expect(sql).toContain('grant select, insert, update on table public.property_submissions to authenticated');
    expect(sql).toContain('grant select, insert on table public.property_submission_documents to authenticated');
    expect(sql).toContain('grant select on table public.leases to authenticated');
    expect(sql).toContain('grant select, insert on table public.maintenance_requests to authenticated');
    expect(sql).toContain('grant select, insert, update on table public.property_offers to authenticated');
    expect(sql).toContain('grant select on table public.transaction_milestones to authenticated');
    expect(sql).toContain('grant select, insert on table public.property_service_requests to authenticated');
    expect(sql).toContain('grant select on table public.enquiries to authenticated');
  });

  it('does not bypass row-level security or grant account data to anonymous users', () => {
    const sql = readFileSync(migrationPath, 'utf8').toLowerCase().replace(/\s+/g, ' ');

    expect(sql).not.toContain('disable row level security');
    expect(sql).not.toMatch(/grant [^;]+ to anon\s*;/);
  });
});
