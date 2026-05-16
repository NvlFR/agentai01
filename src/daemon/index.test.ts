import { describe, expect, it } from 'bun:test'

import { createDaemonController, validateRestartPolicy } from './index.js'

describe('daemon contracts', () => {
  it('tracks lifecycle and restart policy without throwing', async () => {
    let rotations = 0
    const daemon = createDaemonController({
      id: 'worker',
      restart_policy: { max_restarts: 1, window_ms: 1000 },
      rotate_logs: () => {
        rotations += 1
      },
    })

    await expect(daemon.start()).resolves.toMatchObject({
      ok: true,
      value: { state: 'running' },
    })
    expect(rotations).toBe(1)
    expect(daemon.recordFailure(new Error('boom')).state).toBe('starting')
    await expect(daemon.stop()).resolves.toMatchObject({
      ok: true,
      value: { state: 'stopped' },
    })
  })

  it('validates restart policy boundaries', () => {
    expect(validateRestartPolicy({ max_restarts: -1, window_ms: 0 })).toEqual({
      ok: false,
      error: 'Restart policy requires non-negative restarts and positive window_ms',
    })
  })
})
