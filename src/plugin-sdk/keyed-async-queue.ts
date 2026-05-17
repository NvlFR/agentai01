// Adapted using referensi/openclaw/src/plugin-sdk/keyed-async-queue.ts

export type KeyedAsyncQueueHooks = {
  onEnqueue?: () => void
  onSettle?: () => void
}

/**
 * Serialize async work per key while allowing unrelated keys to run concurrently.
 * Rejected tasks do not stop subsequent tasks for the same key.
 * The tails map is cleaned up after each key's queue drains.
 */
export function enqueueKeyedTask<T>(params: {
  tails: Map<string, Promise<void>>
  key: string
  task: () => Promise<T>
  hooks?: KeyedAsyncQueueHooks
}): Promise<T> {
  params.hooks?.onEnqueue?.()
  const previous = params.tails.get(params.key) ?? Promise.resolve()
  const current = previous
    .catch(() => undefined)
    .then(params.task)
    .finally(() => {
      params.hooks?.onSettle?.()
    })
  const tail = current.then(
    () => undefined,
    () => undefined,
  )
  params.tails.set(params.key, tail)
  const cleanup = () => {
    if (params.tails.get(params.key) === tail) {
      params.tails.delete(params.key)
    }
  }
  tail.then(cleanup, cleanup)
  return current
}

export class KeyedAsyncQueue {
  private readonly tails = new Map<string, Promise<void>>()

  getTailMapForTesting(): Map<string, Promise<void>> {
    return this.tails
  }

  enqueue<T>(key: string, task: () => Promise<T>, hooks?: KeyedAsyncQueueHooks): Promise<T> {
    return enqueueKeyedTask({
      tails: this.tails,
      key,
      task,
      ...(hooks ? { hooks } : {}),
    })
  }
}
