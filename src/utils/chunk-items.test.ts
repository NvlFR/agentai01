import { describe, expect, it } from 'bun:test';
import { chunkItems } from './chunk-items.js';

describe('chunkItems', () => {
  it('splits array into chunks', () => {
    expect(chunkItems([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('handles size larger than array', () => {
    expect(chunkItems([1, 2], 5)).toEqual([[1, 2]]);
  });

  it('handles empty array', () => {
    expect(chunkItems([], 2)).toEqual([]);
  });

  it('handles size 0 or less', () => {
    expect(chunkItems([1, 2, 3], 0)).toEqual([[1, 2, 3]]);
  });
});
