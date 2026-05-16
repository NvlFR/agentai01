export type ProviderOperation<T> = (signal: AbortSignal) => Promise<T>

export class ProviderTimeoutError extends Error {
  readonly code = 'timeout' as const
  readonly retryable = true

  constructor(timeoutMs: number) {
    super(`Provider operation timed out after ${timeoutMs}ms.`)
    this.name = 'ProviderTimeoutError'
  }
}

export async function withProviderTimeout<T>(
  operation: ProviderOperation<T>,
  timeoutMs: number | undefined,
): Promise<T> {
  const controller = new AbortController()
  if (timeoutMs === undefined) {
    return operation(controller.signal)
  }

  let timeout: ReturnType<typeof setTimeout> | undefined
  let didTimeout = false

  try {
    const timedOperation = operation(controller.signal).catch((error: unknown) => {
      if (didTimeout) {
        throw new ProviderTimeoutError(timeoutMs)
      }

      throw error
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        didTimeout = true
        controller.abort()
        reject(new ProviderTimeoutError(timeoutMs))
      }, timeoutMs)
    })

    return await Promise.race([timedOperation, timeoutPromise])
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}
