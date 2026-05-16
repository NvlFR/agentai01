import { describe, expect, it } from 'bun:test';
import { sleep, resolveSafeTimeoutDelayMs } from './timer-delay.js';

describe('timer-delay', () => {
  it('sleep resolves after time', async () => {
    const start = Date.now();
    await sleep(10);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(10);
  });

  it('resolveSafeTimeoutDelayMs bounds values', () => {
    expect(resolveSafeTimeoutDelayMs(100)).toBe(100);
    expect(resolveSafeTimeoutDelayMs(-10)).toBe(1);
    expect(resolveSafeTimeoutDelayMs(Infinity)).toBe(1);
    expect(resolveSafeTimeoutDelayMs(3_000_000_000)).toBe(2147483647);
  });
});
