import { describe, expect, it } from 'vitest';
import { publicMapCoordinates } from '../src/property-map';

describe('public property map coordinates', () => {
  it('rounds supplied coordinates to avoid exposing exact residential positions', () => expect(publicMapCoordinates({ latitude: -15.416789, longitude: 28.283456 } as never)).toEqual([-15.417, 28.283]));
  it('omits listings without both coordinates', () => expect(publicMapCoordinates({ latitude: null, longitude: 28.2 } as never)).toBeNull());
});
