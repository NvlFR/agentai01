import { formatIso8601, type Result, ok, err } from '../shared/index.js'

export type DaemonState = 'stopped' | 'starting' | 'running' | 'stopping' | 'failed'

export type RestartPolicy = {
  readonly max_restarts: number
  readonly window_ms: number
}

export type DaemonHealth = {
  readonly id: string
  readonly state: DaemonState
  readonly restarted_count: number
  readonly updated_at: string
}

export type DaemonController = {
  readonly id: string
  readonly state: DaemonState
  start(): Promise<Result<DaemonHealth, string>>
  stop(): Promise<Result<DaemonHealth, string>>
  recordFailure(error: Error): DaemonHealth
  health(): DaemonHealth
}

export function createDaemonController(input: {
  id: string
  restart_policy?: RestartPolicy
  rotate_logs?: () => Promise<void> | void
}): DaemonController {
  let state: DaemonState = 'stopped'
  let restartedCount = 0
  let lastFailureAt = 0
  const policy = input.restart_policy ?? { max_restarts: 0, window_ms: 60_000 }

  const health = (): DaemonHealth => ({
    id: input.id,
    state,
    restarted_count: restartedCount,
    updated_at: formatIso8601(new Date()),
  })

  return {
    id: input.id,
    get state() {
      return state
    },
    async start() {
      if (state === 'running') {
        return ok(health())
      }
      state = 'starting'
      await input.rotate_logs?.()
      state = 'running'
      return ok(health())
    },
    async stop() {
      if (state === 'stopped') {
        return ok(health())
      }
      state = 'stopping'
      state = 'stopped'
      return ok(health())
    },
    recordFailure() {
      const now = Date.now()
      state = 'failed'
      if (now - lastFailureAt > policy.window_ms) {
        restartedCount = 0
      }
      lastFailureAt = now
      if (restartedCount < policy.max_restarts) {
        restartedCount += 1
        state = 'starting'
      }
      return health()
    },
    health,
  }
}

export function validateRestartPolicy(policy: RestartPolicy): Result<RestartPolicy, string> {
  if (policy.max_restarts < 0 || policy.window_ms <= 0) {
    return err('Restart policy requires non-negative restarts and positive window_ms')
  }

  return ok(policy)
}
