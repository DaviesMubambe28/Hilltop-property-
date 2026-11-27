export type LeadSubmissionState =
  | 'idle'
  | 'submitting'
  | 'success'
  | 'validation-error'
  | 'rate-limited'
  | 'unavailable'
  | 'unconfirmed'
  | 'error';

export function createSubmissionController() {
  let pending = false;
  let attemptKey: string | null = null;
  let attemptFingerprint: string | null = null;

  return {
    get isPending() {
      return pending;
    },
    begin(fingerprint: string): string | null {
      if (pending) return null;
      if (!attemptKey || attemptFingerprint !== fingerprint) {
        attemptKey = crypto.randomUUID();
        attemptFingerprint = fingerprint;
      }
      pending = true;
      return attemptKey;
    },
    finish(outcome: 'confirmed' | 'rejected' | 'unknown') {
      pending = false;
      if (outcome === 'confirmed' || outcome === 'rejected') {
        attemptKey = null;
        attemptFingerprint = null;
      }
    },
    reset() {
      pending = false;
      attemptKey = null;
      attemptFingerprint = null;
    },
  };
}

export function parseLeadResponse(value: unknown): { id: string; status?: string } {
  if (!value || typeof value !== 'object') throw new Error('The submission outcome could not be confirmed.');
  const response = value as Record<string, unknown>;
  if (typeof response.id === 'string' && response.id.trim()) {
    return { id: response.id, status: typeof response.status === 'string' ? response.status : undefined };
  }
  throw new Error(
    typeof response.error === 'object' &&
    response.error &&
    typeof (response.error as Record<string, unknown>).message === 'string'
      ? String((response.error as Record<string, unknown>).message)
      : 'The submission outcome could not be confirmed.',
  );
}

export function formatViewingDateTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid appointment date.');
  return new Intl.DateTimeFormat('en-ZM', {
    timeZone: 'Africa/Lusaka',
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function lusakaLocalToIso(localDateTime: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localDateTime)) {
    throw new Error('Choose a valid viewing date and time.');
  }
  const [datePart, timePart] = localDateTime.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  let guess = Date.UTC(year, month - 1, day, hour - 2, minute);

  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Lusaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(guess));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const represented = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
    );
    const desired = Date.UTC(year, month - 1, day, hour, minute);
    const correction = desired - represented;
    guess += correction;
    if (correction === 0) break;
  }

  const result = new Date(guess);
  if (!Number.isFinite(result.getTime())) throw new Error('Choose a valid viewing date and time.');
  return result.toISOString();
}

export function lusakaMinimumLocal(minutesAhead = 60): string {
  const date = new Date(Date.now() + minutesAhead * 60_000);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lusaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}
