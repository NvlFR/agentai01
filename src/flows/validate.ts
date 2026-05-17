// Adapted using referensi/openclaw/src/flows/validate.ts
import { err, ok, type Result } from '../shared/index.js'
import type { FlowDefinition, FlowError } from './types.js'

export function validateFlowDefinition<TState>(
  definition: FlowDefinition<TState>,
): Result<FlowDefinition<TState>, FlowError> {
  if (!definition.id.trim()) {
    return err({ code: 'definition_invalid', message: 'Flow id is required.' })
  }

  const stepIds = new Set<string>()
  for (const step of definition.steps) {
    if (!step.id.trim()) {
      return err({ code: 'definition_invalid', message: 'Flow step id is required.' })
    }

    if (stepIds.has(step.id)) {
      return err({ code: 'definition_invalid', message: `Duplicate flow step "${step.id}".`, step_id: step.id })
    }

    stepIds.add(step.id)
  }

  return ok(definition)
}
