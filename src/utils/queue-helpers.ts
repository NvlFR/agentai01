// Adapted from referensi/openclaw/src/utils/queue-helpers.ts
/**
 * Simple queue helpers for managing arrays as queues.
 */

/**
 * Enqueue an item to the end of the queue.
 */
export function enqueue<T>(queue: T[], item: T): void {
  queue.push(item);
}

/**
 * Dequeue an item from the front of the queue.
 * Returns undefined if the queue is empty.
 */
export function dequeue<T>(queue: T[]): T | undefined {
  return queue.shift();
}

/**
 * Drains all items from the queue and executes a callback for each.
 */
export async function drain<T>(
  queue: T[],
  callback: (item: T) => Promise<void> | void,
): Promise<void> {
  while (queue.length > 0) {
    const item = queue.shift();
    if (item !== undefined) {
      await callback(item);
    }
  }
}
