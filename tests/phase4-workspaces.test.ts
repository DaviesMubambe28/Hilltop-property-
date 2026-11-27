import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('Phase 4 operational workspaces', () => {
  it('provides dedicated agent and editor routes', () => {
    const agent = read('agent.html');
    const editor = read('editor.html');
    expect(agent).toContain('data-workspace="agent"');
    expect(agent).toContain('Submit for review');
    expect(agent).toContain('Assigned enquiries');
    expect(editor).toContain('data-workspace="editor"');
    expect(editor).toContain('Review queue');
    expect(editor).toContain('Content');
  });

  it('keeps administrator decisions separate from agent submission', () => {
    const admin = read('admin.html');
    expect(admin).toContain('Property approval queue');
    expect(admin).toContain('Secure agent invitation');
    expect(admin).toContain('Publish approved property');
    expect(admin).toContain('id="dashboard-stats"');
  });

  it('prepares a least-privilege database workflow', () => {
    const migration = read('supabase/migrations/202611270002_agent_property_workflow.sql');
    expect(migration).toContain("add value if not exists 'agent'");
    expect(migration).toContain('agents may only create their own draft listings');
    expect(migration).toContain('only approved listings may be published');
    expect(migration).toContain('properties_agent_update');
  });

  it('uses confirmation-based sign-out and the six-second hero interval', () => {
    expect(read('sign-out.html')).toContain('Opening this page has not signed you out');
    expect(read('src/auth-pages.ts')).toContain("location.replace('/')");
    expect(read('script.js')).toContain('const delay = 6000');
  });
});
