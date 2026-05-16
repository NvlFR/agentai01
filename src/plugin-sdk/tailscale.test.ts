import { describe, expect, it, mock } from 'bun:test'

import { resolveTailnetHostWithRunner } from './tailscale.js'

describe('tailscale', () => {
  it('returns null when command runner is missing or tailscale is unavailable', async () => {
    expect(await resolveTailnetHostWithRunner()).toBeNull()

    const runner = mock(async () => {
      throw new Error('ENOENT')
    })
    expect(await resolveTailnetHostWithRunner(runner)).toBeNull()
  })

  it('resolves dns name from tailscale status output', async () => {
    const runner = mock(async () => ({
      code: 0,
      stdout: JSON.stringify({
        Self: {
          DNSName: 'agent.tailnet.ts.net.',
        },
      }),
    }))

    expect(await resolveTailnetHostWithRunner(runner)).toBe('agent.tailnet.ts.net')
  })
})
