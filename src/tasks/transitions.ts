// Adapted from referensi/openclaw/src/tasks/transitions.ts
import type { TaskState } from './types.js'

export function canTransition(current: TaskState, next: TaskState): boolean {
  const allowed: Record<TaskState, readonly TaskState[]> = {
    pending: ['ready', 'blocked', 'cancelled'],
    ready: ['running', 'blocked', 'cancelled'],
    running: ['succeeded', 'failed', 'cancelled'],
    succeeded: [],
    failed: ['ready'],
    blocked: ['ready', 'cancelled'],
    cancelled: [],
  }

  return allowed[current].includes(next)
}
