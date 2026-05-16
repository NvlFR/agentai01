import { describe, expect, it, mock } from 'bun:test';
import { enqueue, dequeue, drain } from './queue-helpers.js';

describe('queue-helpers', () => {
  it('enqueue and dequeue', () => {
    const q: number[] = [];
    enqueue(q, 1);
    enqueue(q, 2);
    expect(dequeue(q)).toBe(1);
    expect(dequeue(q)).toBe(2);
    expect(dequeue(q)).toBeUndefined();
  });

  it('drain', async () => {
    const q = [1, 2, 3];
    const processed: number[] = [];
    await drain(q, (item) => {
      processed.push(item);
    });
    expect(processed).toEqual([1, 2, 3]);
    expect(q.length).toBe(0);
  });
});
