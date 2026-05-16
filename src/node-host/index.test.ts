import { describe, expect, test } from 'bun:test'

import { collectNodeHostHealth, createNodeHostRegistry, type NodeHost } from './index.js'

describe('node-host', () => {
  test('registers hosts and collects health through the contract', async () => {
    const host: NodeHost = {
      id: 'local',
      labels: ['dev'],
      health: async () => ({ status: 'healthy', checkedAt: '2026-05-16T00:00:00.000Z' }),
      execute: async () => ({ exitCode: 0, stdout: 'ok', stderr: '', durationMs: 1 }),
    }
    const registry = createNodeHostRegistry()

    registry.register(host)

    await expect(registry.get('local')?.execute({ command: 'check', args: [] })).resolves.toMatchObject({ exitCode: 0 })
    expect(await collectNodeHostHealth(registry.list())).toMatchObject({ local: { status: 'healthy' } })
  })
})
