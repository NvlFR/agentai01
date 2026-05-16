import { describe, expect, it } from 'bun:test';
import { safeParseJson, safeStringifyJson } from './safe-json.js';

describe('safe-json', () => {
  describe('safeParseJson', () => {
    it('parses valid JSON', () => {
      const result = safeParseJson('{"a": 1}');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({ a: 1 });
      }
    });

    it('returns error for invalid JSON', () => {
      const result = safeParseJson('{invalid}');
      expect(result.ok).toBe(false);
    });
  });

  describe('safeStringifyJson', () => {
    it('stringifies simple objects', () => {
      expect(safeStringifyJson({ a: 1 })).toBe('{"a":1}');
    });

    it('handles BigInt', () => {
      expect(safeStringifyJson({ a: 10n })).toBe('{"a":"10"}');
    });

    it('handles Error', () => {
      const err = new Error('test');
      const json = safeStringifyJson(err);
      expect(json).toContain('"message":"test"');
      expect(json).toContain('"name":"Error"');
    });

    it('handles Uint8Array', () => {
      const arr = new Uint8Array([1, 2, 3]);
      const json = safeStringifyJson(arr);
      expect(json).toContain('"type":"Uint8Array"');
    });
  });
});
