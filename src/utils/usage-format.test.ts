import { describe, expect, it } from 'bun:test';
import { formatTokenCount, formatTokenUsage } from './usage-format.js';

describe('usage-format', () => {
  describe('formatTokenCount', () => {
    it('formats small numbers', () => {
      expect(formatTokenCount(500)).toBe('500');
    });

    it('formats thousands', () => {
      expect(formatTokenCount(1000)).toBe('1.0k');
      expect(formatTokenCount(1500)).toBe('1.5k');
      expect(formatTokenCount(10000)).toBe('10k');
    });

    it('formats millions', () => {
      expect(formatTokenCount(1000000)).toBe('1.0m');
      expect(formatTokenCount(1500000)).toBe('1.5m');
    });
  });

  describe('formatTokenUsage', () => {
    it('formats basic usage', () => {
      expect(formatTokenUsage({ input: 1000, output: 500 })).toBe('1.0k in, 500 out');
    });

    it('formats usage with total', () => {
      expect(formatTokenUsage({ input: 1000, output: 500, total: 1500 })).toBe('1.0k in, 500 out (1.5k total)');
    });
  });
});
