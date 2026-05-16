import { describe, expect, it } from 'bun:test'

import { aggregateProcessHealth, createProcessLifecycle, type SignalName } from './index.js'

class FakeSignalTarget {
  readonly listeners = new Map<SignalName, () => void>()

  on(signal: SignalName, listener: () => void): void {
    this.listeners.set(signal, listener)
  }

  off(signal: SignalName): void {
    this.listeners.delete(signal)
  }
}

describe('ProcessLifecycle', () => {
  it('runs shutdown hooks in reverse registration order once', async () => {
    const lifecycle = createProcessLifecycle()
    const calls: string[] = []
    lifecycle.registerShutdownHook({
      name: 'first',
      run: () => {
        void calls.push('first')
      },
    })
    lifecycle.registerShutdownHook({
      name: 'second',
      run: () => {
        void calls.push('second')
      },
    })

    await lifecycle.shutdown()
    await lifecycle.shutdown()

    expect(calls).toEqual(['second', 'first'])
    expect(lifecycle.state).toBe('stopped')
  })

  it('aggregates health check failures', async () => {
    const lifecycle = createProcessLifecycle()
    lifecycle.registerHealthCheck({
      name: 'ok',
      check: () => ({ name: 'ok', status: 'healthy' }),
    })
    lifecycle.registerHealthCheck({
      name: 'boom',
      check: () => {
        throw new Error('not ready')
      },
    })

    const report = await lifecycle.health()

    expect(report.status).toBe('unhealthy')
    expect(report.checks.map(check => check.name)).toEqual(['ok', 'boom'])
  })

  it('attaches and detaches signal handlers', () => {
    const lifecycle = createProcessLifecycle()
    const target = new FakeSignalTarget()

    lifecycle.attachSignalHandlers(target)
    expect(target.listeners.has('SIGINT')).toBe(true)

    lifecycle.detachSignalHandlers(target)
    expect(target.listeners.size).toBe(0)
  })
})

describe('aggregateProcessHealth', () => {
  it('prefers the worst health state', () => {
    expect(aggregateProcessHealth([
      { name: 'a', status: 'healthy' },
      { name: 'b', status: 'degraded' },
    ])).toBe('degraded')
  })
})
