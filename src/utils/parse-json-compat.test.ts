import { describe, expect, it } from 'bun:test';
import { parseJsonCompat } from './parse-json-compat.js';

describe('parseJsonCompat', () => {
  it('parses standard JSON', () => {
    expect(parseJsonCompat('{"a": 1}')).toEqual({ a: 1 });
  });

  it('parses JSON5 (with comments and trailing commas)', () => {
    const raw = `
      {
        // comment
        "a": 1,
      }
    `;
    expect(parseJsonCompat(raw)).toEqual({ a: 1 });
  });

  it('returns undefined for invalid content', () => {
    expect(parseJsonCompat('invalid')).toBeUndefined();
  });
});
