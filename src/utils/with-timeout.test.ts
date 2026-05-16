import { describe, expect, it } from 'bun:test';
import { withTimeout } from './with-timeout.js';
import { sleep } from './timer-delay.js';

describe('withTimeout', () => {
  it('resolves if promise finishes in time', async () => {
    const p = (async () => {
      await sleep(10);
      return 'done';
    })();
    const res = await withTimeout(p, 50);
    expect(res).toBe('done');
  });

  it('rejects if promise takes too long', async () => {
    const p = (async () => {
      await sleep(100);
      return 'done';
    })();
    try {
      await withTimeout(p, 10);
      expect().fail('Should have timed out');
    } catch (error: any) {
      expect(error.name).toBe('TimeoutError');
    }
  });
});
