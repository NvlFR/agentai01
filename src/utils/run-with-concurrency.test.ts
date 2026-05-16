import { describe, expect, it } from 'bun:test';
import { runWithConcurrency } from './run-with-concurrency.js';
import { sleep } from './timer-delay.js';

describe('runWithConcurrency', () => {
  it('runs tasks and returns results', async () => {
    const tasks = [
      async () => 1,
      async () => 2,
      async () => 3,
    ];
    const { results } = await runWithConcurrency(tasks, 2);
    expect(results).toEqual([1, 2, 3]);
  });

  it('respects concurrency limit', async () => {
    let active = 0;
    let maxActive = 0;
    const tasks = Array.from({ length: 5 }, () => async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await sleep(10);
      active--;
      return 1;
    });

    await runWithConcurrency(tasks, 2);
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it('handles errors with stop mode', async () => {
    let callCount = 0;
    const tasks = [
      async () => { callCount++; return 1; },
      async () => { callCount++; throw new Error('fail'); },
      async () => { await sleep(10); callCount++; return 3; },
    ];

    const { hasError } = await runWithConcurrency(tasks, 1, { errorMode: 'stop' });
    expect(hasError).toBe(true);
    // Task 3 should not be called because Task 2 failed and limit is 1
    expect(callCount).toBe(2);
  });
});
