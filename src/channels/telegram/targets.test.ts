import { describe, expect, it } from 'bun:test';
import { parseTelegramTarget, buildTelegramTarget } from './targets.js';

describe('telegram targets', () => {
  it('should parse numeric chat id', () => {
    const res = parseTelegramTarget('123456');
    expect(res.chatId).toBe('123456');
    expect(res.chatType).toBe('direct');
  });

  it('should parse negative chat id as group', () => {
    const res = parseTelegramTarget('-100123456');
    expect(res.chatId).toBe('-100123456');
    expect(res.chatType).toBe('group');
  });

  it('should parse telegram prefix', () => {
    const res = parseTelegramTarget('telegram:123456');
    expect(res.chatId).toBe('123456');
  });

  it('should parse topic id', () => {
    const res = parseTelegramTarget('123456:topic:789');
    expect(res.chatId).toBe('123456');
    expect(res.messageThreadId).toBe(789);
  });

  it('should parse shorthand topic id', () => {
    const res = parseTelegramTarget('123456:789');
    expect(res.chatId).toBe('123456');
    expect(res.messageThreadId).toBe(789);
  });

  it('should build target string', () => {
    const res = buildTelegramTarget('123456', 789);
    expect(res).toBe('telegram:123456:topic:789');
  });
});
