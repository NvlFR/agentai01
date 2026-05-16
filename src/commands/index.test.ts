import { describe, expect, test } from 'bun:test'

import { createCommandRegistry } from './index.js'

describe('commands', () => {
  test('executes registered commands and renders help', async () => {
    const registry = createCommandRegistry()
    registry.register({
      id: 'ready',
      summary: 'Check readiness',
      usage: '/ready',
      execute: async () => ({ code: 'ok', message: 'ready' }),
    })

    expect(await registry.execute('ready', { actor: 'operator', args: [] })).toMatchObject({ code: 'ok' })
    expect(registry.help()).toContain('/ready - Check readiness')
  })
})
