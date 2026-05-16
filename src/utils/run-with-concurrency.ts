// Adapted from referensi/openclaw/src/utils/run-with-concurrency.ts
export type ConcurrencyErrorMode = 'continue' | 'stop';

/**
 * Runs tasks with limited concurrency.
 */
export async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
  options: {
    errorMode?: ConcurrencyErrorMode;
    onTaskError?: (error: unknown, index: number) => void;
  } = {},
): Promise<{ results: T[]; firstError: unknown; hasError: boolean }> {
  const { onTaskError } = options;
  const errorMode = options.errorMode ?? 'continue';

  if (tasks.length === 0) {
    return { results: [], firstError: undefined, hasError: false };
  }

  const resolvedLimit = Math.max(1, Math.min(limit, tasks.length));
  const results: T[] = Array.from({ length: tasks.length });
  let next = 0;
  let firstError: unknown = undefined;
  let hasError = false;

  const workers = Array.from({ length: resolvedLimit }, async () => {
    while (true) {
      if (errorMode === 'stop' && hasError) {
        return;
      }
      const index = next;
      next += 1;
      if (index >= tasks.length) {
        return;
      }
      try {
        results[index] = await tasks[index]();
      } catch (error) {
        if (!hasError) {
          firstError = error;
          hasError = true;
        }
        onTaskError?.(error, index);
        if (errorMode === 'stop') {
          return;
        }
      }
    }
  });

  await Promise.allSettled(workers);
  return { results, firstError, hasError };
}
