import { generateId } from '../shared/index.js'
import { serializeAuditSafe } from '../security/index.js'
import { nowIso } from '../utils/index.js'

export type TrajectoryStatus = 'started' | 'completed' | 'failed'

export type TrajectoryStep = {
  id: string
  action: string
  status: TrajectoryStatus
  timestamp: string
  actor?: string
  input?: unknown
  output?: unknown
  error?: string
  metadata?: Record<string, unknown>
}

export type TrajectoryAnalysis = {
  totalSteps: number
  completedSteps: number
  failedSteps: number
  actions: Record<string, number>
}

export type TrajectoryRecorder = {
  record(step: Omit<TrajectoryStep, 'id' | 'timestamp'> & Partial<Pick<TrajectoryStep, 'id' | 'timestamp'>>): TrajectoryStep
  list(): TrajectoryStep[]
  replay(filter?: { action?: string; status?: TrajectoryStatus }): TrajectoryStep[]
  analyze(): TrajectoryAnalysis
}

export function createTrajectoryRecorder(initialSteps: readonly TrajectoryStep[] = []): TrajectoryRecorder {
  const steps = initialSteps.map(sanitizeStep)

  return {
    record(step) {
      const recorded = sanitizeStep({
        ...step,
        id: step.id ?? generateId('traj'),
        timestamp: step.timestamp ?? nowIso(),
      })
      steps.push(recorded)
      return structuredClone(recorded)
    },
    list() {
      return steps.map(step => structuredClone(step))
    },
    replay(filter) {
      return steps
        .filter(step => !filter?.action || step.action === filter.action)
        .filter(step => !filter?.status || step.status === filter.status)
        .map(step => structuredClone(step))
    },
    analyze() {
      return analyzeTrajectory(steps)
    },
  }
}

export function analyzeTrajectory(steps: readonly TrajectoryStep[]): TrajectoryAnalysis {
  const actions: Record<string, number> = {}
  let completedSteps = 0
  let failedSteps = 0

  for (const step of steps) {
    actions[step.action] = (actions[step.action] ?? 0) + 1
    if (step.status === 'completed') {
      completedSteps += 1
    }
    if (step.status === 'failed') {
      failedSteps += 1
    }
  }

  return {
    totalSteps: steps.length,
    completedSteps,
    failedSteps,
    actions,
  }
}

function sanitizeStep(step: TrajectoryStep): TrajectoryStep {
  return serializeAuditSafe(step)
}
