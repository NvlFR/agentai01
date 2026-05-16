import { describe, expect, test } from 'bun:test'

import { createScriptRegistry, serializeScriptPlanSafe } from './index.js'

describe('scripts', () => {
  test('plans registered scripts and redacts secret environment values', () => {
    const registry = createScriptRegistry()
    registry.register({ id: 'check', description: 'typecheck', command: 'npm', args: ['run', 'check'] })

    const plan = registry.plan('check', { env: { AI_API_KEY: 'sk-live-secret' } })

    expect(plan?.args).toEqual(['run', 'check'])
    expect(JSON.stringify(serializeScriptPlanSafe(plan!))).not.toContain('sk-live-secret')
  })
})
