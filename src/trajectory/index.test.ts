import { describe, expect, test } from 'bun:test'

import { createTrajectoryRecorder } from './index.js'

describe('trajectory', () => {
  test('records replayable steps with secret-safe payloads', () => {
    const recorder = createTrajectoryRecorder()

    const step = recorder.record({
      action: 'provider.call',
      status: 'completed',
      input: { apiKey: 'sk-secret-123456' },
      output: { message: 'ok' },
    })

    expect(step.id.startsWith('traj-')).toBe(true)
    expect(JSON.stringify(recorder.replay())).not.toContain('sk-secret-123456')
    expect(recorder.analyze()).toMatchObject({
      totalSteps: 1,
      completedSteps: 1,
      failedSteps: 0,
      actions: { 'provider.call': 1 },
    })
  })
})
