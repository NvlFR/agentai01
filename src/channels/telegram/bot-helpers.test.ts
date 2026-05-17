import { describe, expect, it } from 'bun:test';
import { buildTelegramThreadParams, normalizeTelegramReplyToMessageId } from './bot-helpers.js';

describe('telegram bot helpers', () => {
  describe('buildTelegramThreadParams', () => {
    it('should return undefined if no thread id', () => {
      expect(buildTelegramThreadParams(null)).toBeUndefined();
      expect(buildTelegramThreadParams({ scope: 'none' })).toBeUndefined();
    });

    it('should return thread id for dm', () => {
      expect(buildTelegramThreadParams({ id: 123, scope: 'dm' })).toEqual({ message_thread_id: 123 });
    });

    it('should return undefined for general topic in forum', () => {
      expect(buildTelegramThreadParams({ id: 1, scope: 'forum' })).toBeUndefined();
    });

    it('should return thread id for other forum topics', () => {
      expect(buildTelegramThreadParams({ id: 456, scope: 'forum' })).toEqual({ message_thread_id: 456 });
    });
  });

  describe('normalizeTelegramReplyToMessageId', () => {
    it('should normalize numbers', () => {
      expect(normalizeTelegramReplyToMessageId(123.45)).toBe(123);
    });

    it('should normalize strings', () => {
      expect(normalizeTelegramReplyToMessageId('456')).toBe(456);
    });

    it('should return undefined for invalid values', () => {
      expect(normalizeTelegramReplyToMessageId('abc')).toBeUndefined();
      expect(normalizeTelegramReplyToMessageId(null)).toBeUndefined();
    });
  });
});
