import { describe, expect, it } from 'vitest';
import { readConfig } from '../src/config';

describe('runtime configuration', () => {
  it('accepts public Supabase configuration', () => {
    expect(readConfig({ VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'a'.repeat(30), VITE_SITE_URL: 'https://example.com' })).toMatchObject({ VITE_SUPABASE_URL: 'https://example.supabase.co' });
  });
  it('rejects missing or malformed configuration', () => {
    expect(readConfig({ VITE_SUPABASE_URL: 'not-a-url', VITE_SUPABASE_ANON_KEY: 'short' })).toBeNull();
  });
});
