import type {
  AgentType,
  Lifecycle_State,
  LifecycleEvent,
} from './types.js'
import {
  LIFECYCLE_TRANSITIONS,
  isValidTransition,
} from './types.js'
import { AgentRegistry } from '../registry/AgentRegistry.js'

export type LifecycleUpdateInput = {
  project_id: string
  event: LifecycleEvent
  actor: AgentType
  timestamp: string
  milestone: string
}

export type LifecycleUpdateResult = {
  project_id: string
  previous_state: Lifecycle_State
  next_state: Lifecycle_State
  current_milestone: string
  updated_at: string
}

export function resolveLifecycleTransition(
  currentState: Lifecycle_State,
  event: LifecycleEvent,
  actor: AgentType,
): { from: Lifecycle_State; to: Lifecycle_State } {
  const transition = LIFECYCLE_TRANSITIONS.find(
    candidate => candidate.from === currentState && candidate.event === event,
  )

  if (!transition) {
    throw new Error(
      `No lifecycle transition found for state "${currentState}" and event "${event}"`,
    )
  }

  if (transition.primaryOwner !== actor) {
    throw new Error(
      `Lifecycle event "${event}" must be triggered by ${transition.primaryOwner}, received ${actor}`,
    )
  }

  if (!isValidTransition(transition.from, transition.to)) {
    throw new Error(
      `Illegal lifecycle transition ${transition.from} -> ${transition.to}`,
    )
  }

  return { from: transition.from, to: transition.to }
}

export function applyLifecycleUpdate(
  registry: AgentRegistry,
  input: LifecycleUpdateInput,
): LifecycleUpdateResult {
  const project = registry.getProject(input.project_id)
  if (!project) {
    throw new Error(`Project not found: ${input.project_id}`)
  }

  const transition = resolveLifecycleTransition(
    project.lifecycle_state,
    input.event,
    input.actor,
  )

  registry.updateProject(input.project_id, {
    lifecycle_state: transition.to,
    current_milestone: input.milestone,
    updated_at: input.timestamp,
  })

  return {
    project_id: input.project_id,
    previous_state: transition.from,
    next_state: transition.to,
    current_milestone: input.milestone,
    updated_at: input.timestamp,
  }
}
