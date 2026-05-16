// Adapted from referensi/openclaw/src/utils/with-timeout.ts
/**
 * Wraps a promise with a timeout.
 * Rejects with a TimeoutError if the promise does not settle within ms.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message?: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(message ?? `Operation timed out after ${ms}ms`);
      error.name = 'TimeoutError';
      reject(error);
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
