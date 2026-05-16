export type ProcessHealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export type ProcessHealthReport = {
  status: ProcessHealthStatus
  checkedAt: string
  checks: ProcessHealthCheckResult[]
}

export type ProcessHealthCheckResult = {
  name: string
  status: ProcessHealthStatus
  message?: string
}

export type ProcessHealthCheck = {
  name: string
  check: () => Promise<ProcessHealthCheckResult> | ProcessHealthCheckResult
}

export type ShutdownHook = {
  name: string
  run: () => Promise<void> | void
}

export type LifecycleState = 'running' | 'shutting_down' | 'stopped'

export type SignalName = 'SIGINT' | 'SIGTERM'

export type SignalTarget = {
  on(signal: SignalName, listener: () => void): void
  off(signal: SignalName, listener: () => void): void
}

export class ProcessLifecycle {
  private readonly shutdownHooks: ShutdownHook[] = []
  private readonly healthChecks: ProcessHealthCheck[] = []
  private readonly signalListeners = new Map<SignalName, () => void>()
  private lifecycleState: LifecycleState = 'running'

  get state(): LifecycleState {
    return this.lifecycleState
  }

  registerShutdownHook(hook: ShutdownHook): void {
    this.shutdownHooks.push(hook)
  }

  registerHealthCheck(check: ProcessHealthCheck): void {
    this.healthChecks.push(check)
  }

  attachSignalHandlers(
    target: SignalTarget = process,
    signals: readonly SignalName[] = ['SIGINT', 'SIGTERM'],
  ): void {
    for (const signal of signals) {
      if (this.signalListeners.has(signal)) {
        continue
      }

      const listener = () => {
        void this.shutdown()
      }
      this.signalListeners.set(signal, listener)
      target.on(signal, listener)
    }
  }

  detachSignalHandlers(target: SignalTarget = process): void {
    for (const [signal, listener] of this.signalListeners) {
      target.off(signal, listener)
    }
    this.signalListeners.clear()
  }

  async shutdown(): Promise<void> {
    if (this.lifecycleState !== 'running') {
      return
    }

    this.lifecycleState = 'shutting_down'
    const hooks = [...this.shutdownHooks].reverse()
    for (const hook of hooks) {
      await hook.run()
    }
    this.lifecycleState = 'stopped'
  }

  async health(): Promise<ProcessHealthReport> {
    const checks = await Promise.all(
      this.healthChecks.map(async check => {
        try {
          return await check.check()
        } catch (error) {
          return {
            name: check.name,
            status: 'unhealthy',
            message: error instanceof Error ? error.message : String(error),
          } satisfies ProcessHealthCheckResult
        }
      }),
    )

    return {
      status: aggregateProcessHealth(checks),
      checkedAt: new Date().toISOString(),
      checks,
    }
  }
}

export function createProcessLifecycle(): ProcessLifecycle {
  return new ProcessLifecycle()
}

export function aggregateProcessHealth(
  checks: readonly ProcessHealthCheckResult[],
): ProcessHealthStatus {
  if (checks.some(check => check.status === 'unhealthy')) {
    return 'unhealthy'
  }

  if (checks.some(check => check.status === 'degraded')) {
    return 'degraded'
  }

  return 'healthy'
}
