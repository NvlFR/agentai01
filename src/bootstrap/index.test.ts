import { describe, expect, it } from 'bun:test'

import { createBootstrapRegistry } from './index.js'

describe('BootstrapRegistry', () => {
  it('boots services in dependency order and shuts down in reverse order', async () => {
    const registry = createBootstrapRegistry()
    const calls: string[] = []

    registry.register({
      id: 'db',
      start: () => {
        calls.push('start-db')
        return { connected: true }
      },
      stop: () => {
        void calls.push('stop-db')
      },
    })
    registry.register({
      id: 'api',
      dependencies: ['db'],
      start: container => {
        calls.push(container.get<{ connected: boolean }>('db').connected ? 'start-api' : 'bad')
        return { ready: true }
      },
      stop: () => {
        void calls.push('stop-api')
      },
      health: () => ({ serviceId: 'api', status: 'healthy' }),
    })

    const container = await registry.boot()
    const health = await registry.health()
    await registry.shutdown()

    expect(container.get<{ ready: boolean }>('api').ready).toBe(true)
    expect(health.status).toBe('healthy')
    expect(calls).toEqual(['start-db', 'start-api', 'stop-api', 'stop-db'])
  })

  it('rejects circular dependency graphs before starting services', () => {
    const registry = createBootstrapRegistry()
    registry.register({ id: 'a', dependencies: ['b'], start: () => 'a' })
    registry.register({ id: 'b', dependencies: ['a'], start: () => 'b' })

    expect(() => registry.plan()).toThrow('Circular service dependency')
  })
})
