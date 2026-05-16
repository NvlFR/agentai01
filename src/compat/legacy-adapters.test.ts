import { describe, expect, it } from 'bun:test'

import { createStatusRegistry } from '../status/index.js'
import {
  bridgeBootHealthToStatus,
  bridgeProcessHealthToStatus,
  legacyBootstrapAdapter,
  legacyConfigAdapter,
  legacyShutdownAdapter,
  legacyStatusAdapter,
} from './legacy-adapters.js'

describe('legacyConfigAdapter', () => {
  it('emits deprecation warning and returns config unchanged', () => {
    const warnings: string[] = []
    const config = { env: 'development', port: 3000 }
    const result = legacyConfigAdapter(config, notice => warnings.push(notice.id))

    expect(result).toBe(config)
    expect(warnings).toContain('legacy-config-adapter')
  })

  it('emits warning only once per call site', () => {
    const warnings: string[] = []
    const reporter = (notice: { id: string }) => warnings.push(notice.id)
    legacyConfigAdapter({}, reporter)
    legacyConfigAdapter({}, reporter)
    // Each call creates a new tracker, so each call emits once
    expect(warnings).toHaveLength(2)
  })
})

describe('legacyShutdownAdapter', () => {
  it('wraps shutdown function into a ProcessLifecycle hook', async () => {
    const calls: string[] = []
    const warnings: string[] = []

    const { lifecycle, hook } = legacyShutdownAdapter(
      'test-server',
      () => { calls.push('stopped') },
      notice => warnings.push(notice.id),
    )

    expect(hook.name).toBe('test-server')
    expect(warnings).toContain('legacy-shutdown-adapter:test-server')

    await lifecycle.shutdown()
    expect(calls).toEqual(['stopped'])
  })
})

describe('legacyStatusAdapter', () => {
  it('converts a ready health object to a healthy status', () => {
    const warnings: string[] = []
    const { snapshot } = legacyStatusAdapter(
      'my-service',
      { ready: true },
      notice => warnings.push(notice.id),
    )

    expect(snapshot.level).toBe('healthy')
    expect(warnings).toContain('legacy-status-adapter:my-service')
  })

  it('converts a not-ready health object to an unhealthy status', () => {
    const { snapshot } = legacyStatusAdapter(
      'my-service',
      { ready: false, reasons: ['AI_API_KEY missing'] },
      () => {},
    )

    expect(snapshot.level).toBe('unhealthy')
    expect(snapshot.sources['my-service']?.message).toBe('AI_API_KEY missing')
  })

  it('converts a degraded health object', () => {
    const { snapshot } = legacyStatusAdapter(
      'my-service',
      { status: 'degraded' },
      () => {},
    )

    expect(snapshot.level).toBe('degraded')
  })
})

describe('legacyBootstrapAdapter', () => {
  it('wraps a factory into a BootstrapRegistry service', async () => {
    const warnings: string[] = []
    const { registry } = legacyBootstrapAdapter(
      'test-service',
      () => ({ value: 42 }),
      undefined,
      notice => warnings.push(notice.id),
    )

    const container = await registry.boot()
    expect(container.get<{ value: number }>('test-service').value).toBe(42)
    expect(warnings).toContain('legacy-bootstrap-adapter:test-service')
  })

  it('calls stopper on shutdown', async () => {
    const calls: string[] = []
    const { registry } = legacyBootstrapAdapter(
      'stoppable',
      () => 'instance',
      () => { calls.push('stopped') },
      () => {},
    )

    await registry.boot()
    await registry.shutdown()
    expect(calls).toEqual(['stopped'])
  })
})

describe('bridgeProcessHealthToStatus', () => {
  it('publishes each health check result to the status registry', () => {
    const registry = createStatusRegistry()
    bridgeProcessHealthToStatus(
      {
        status: 'degraded',
        checkedAt: '2026-01-01T00:00:00.000Z',
        checks: [
          { name: 'db', status: 'healthy', message: 'connected' },
          { name: 'cache', status: 'degraded', message: 'slow' },
        ],
      },
      registry,
    )

    const snapshot = registry.snapshot()
    expect(snapshot.level).toBe('degraded')
    expect(snapshot.sources['db']?.level).toBe('healthy')
    expect(snapshot.sources['cache']?.level).toBe('degraded')
  })
})

describe('bridgeBootHealthToStatus', () => {
  it('publishes each service health to the status registry', () => {
    const registry = createStatusRegistry()
    bridgeBootHealthToStatus(
      {
        status: 'healthy',
        services: [
          { serviceId: 'api', status: 'healthy' },
          { serviceId: 'worker', status: 'healthy' },
        ],
      },
      registry,
    )

    const snapshot = registry.snapshot()
    expect(snapshot.level).toBe('healthy')
    expect(snapshot.sources['api']?.level).toBe('healthy')
    expect(snapshot.sources['worker']?.level).toBe('healthy')
  })
})
