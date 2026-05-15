import type { Lifecycle_State } from '../../src/domain/types.js'

export const sampleLifecycleSequence: readonly Lifecycle_State[] = [
  'lead',
  'qualified',
  'proposal',
  'won',
  'discovery',
  'implementation',
  'qa',
  'delivered',
]
