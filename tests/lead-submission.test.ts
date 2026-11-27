import { describe, expect, it } from 'vitest';
import {
  createSubmissionController,
  formatViewingDateTime,
  lusakaLocalToIso,
  lusakaMinimumLocal,
  parseLeadResponse,
} from '../src/lead-submission';

describe('lead submission controller', () => {
  it('prevents concurrent submissions', () => {
    const controller = createSubmissionController();
    expect(controller.begin('payload-a')).not.toBeNull();
    expect(controller.begin('payload-a')).toBeNull();
  });

  it('reuses the key after an uncertain outcome', () => {
    const controller = createSubmissionController();
    const first = controller.begin('payload-a');
    controller.finish('unknown');
    expect(controller.begin('payload-a')).toBe(first);
  });

  it('generates a new key after success', () => {
    const controller = createSubmissionController();
    const first = controller.begin('payload-a');
    controller.finish('confirmed');
    expect(controller.begin('payload-a')).not.toBe(first);
  });

  it('does not reuse a key for a changed payload', () => {
    const controller = createSubmissionController();
    const first = controller.begin('payload-a');
    controller.finish('unknown');
    expect(controller.begin('payload-b')).not.toBe(first);
  });
});

describe('lead responses', () => {
  it('accepts an existing persisted response', () => {
    expect(parseLeadResponse({ id: 'lead-123' })).toEqual({ id: 'lead-123', status: undefined });
  });

  it('rejects malformed success responses', () => {
    expect(() => parseLeadResponse({ ok: true })).toThrow();
  });

  it('returns a backend error message', () => {
    expect(() => parseLeadResponse({ error: { message: 'Too many enquiries.' } })).toThrow('Too many enquiries.');
  });
});

describe('Zambia viewing dates', () => {
  it('formats an ISO timestamp in Africa/Lusaka', () => {
    expect(formatViewingDateTime('2026-12-01T10:30:00Z')).toContain('2026');
  });

  it('converts Zambia local time to UTC', () => {
    expect(lusakaLocalToIso('2026-12-01T12:30')).toBe('2026-12-01T10:30:00.000Z');
  });

  it('rejects invalid local dates', () => {
    expect(() => lusakaLocalToIso('not-a-date')).toThrow();
  });

  it('provides a future Zambia-local minimum', () => {
    expect(lusakaMinimumLocal()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
