import { describe, expect, it } from 'vitest';
import { whatsappUrl } from '../src/public-widgets';

describe('WhatsApp links', () => {
  it('uses the configured direct number and encodes the message', () => {
    expect(whatsappUrl('260971011019', 'Hello Hilltop & team')).toBe('https://wa.me/260971011019?text=Hello%20Hilltop%20%26%20team');
  });
});
