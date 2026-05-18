import { describe, expect, it } from 'bun:test'
import { createUltraPlan } from './ultraplan.js'

describe('createUltraPlan', () => {
  it('formats phased plan text for runtime tools', () => {
    expect(createUltraPlan({
      objective: 'Ship restored-src adaptation batch',
      steps: [
        { id: '5.1', title: 'Telemetry helpers', status: 'completed' },
        { id: '6.1', title: 'Computer use gates', status: 'in_progress', owner: 'runtime' },
      ],
    })).toBe(
      'Objective: Ship restored-src adaptation batch\n- [completed] 5.1 Telemetry helpers\n- [in_progress] 6.1 Computer use gates @runtime',
    )
  })
})
