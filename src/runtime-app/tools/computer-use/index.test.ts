import { describe, expect, it } from 'bun:test'
import { decideComputerUseAction, executeComputerUseAction } from './index.js'

describe('computer-use helpers', () => {
  it('blocks launch actions without approval', () => {
    expect(decideComputerUseAction({
      enabled: true,
      requiresApproval: false,
      approved: false,
      action: 'launch',
    })).toEqual({
      allowed: false,
      reason: 'Launch actions require explicit approval.',
    })
  })

  it('executes approved actions through the host adapter', async () => {
    await expect(executeComputerUseAction({
      enabled: true,
      requiresApproval: true,
      approved: true,
      action: 'tap',
      adapter: {
        async perform(action) {
          return `${action.kind}:done`
        },
      },
    })).resolves.toBe('tap:done')
  })
})
