import PQueue from 'p-queue'

export type ConcurrencyLimiter = {
  add: <T>(task: () => Promise<T>) => Promise<T>
  onIdle: () => Promise<void>
  size: () => number
  pending: () => number
  clear: () => void
}

export function createConcurrencyLimiter(input: {
  concurrency: number
  intervalCap?: number
  intervalMs?: number
}): ConcurrencyLimiter {
  const queue = new PQueue({
    concurrency: input.concurrency,
    ...(input.intervalCap !== undefined ? { intervalCap: input.intervalCap } : {}),
    ...(input.intervalMs !== undefined ? { interval: input.intervalMs } : {}),
  })

  return {
    add: task => queue.add(task),
    onIdle: () => queue.onIdle(),
    size: () => queue.size,
    pending: () => queue.pending,
    clear: () => queue.clear(),
  }
}
