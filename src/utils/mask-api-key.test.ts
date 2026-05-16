import { describe, expect, it } from 'bun:test';
import { maskApiKey } from './mask-api-key.js';

describe('maskApiKey', () => {
  it('returns missing for empty values', () => {
    expect(maskApiKey('')).toBe('missing');
    expect(maskApiKey(null)).toBe('missing');
    expect(maskApiKey(undefined)).toBe('missing');
  });

  it('masks short keys (length < 8) fully', () => {
    expect(maskApiKey('1234567')).toBe('****');
    expect(maskApiKey('short')).toBe('****');
  });

  it('masks long keys (length >= 8) partially', () => {
    // Reveal first 4 chars
    expect(maskApiKey('sk-abcd1234efgh')).toBe('sk-a...****');
    expect(maskApiKey('12345678')).toBe('1234...****');
  });
});
