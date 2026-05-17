// Adapted using referensi/openclaw/src/flows/engine.ts
import { err, ok, type Result } from '../shared/index.js'
import { InMemoryFlowStateStore, type FlowStateStore } from './store.js'
import type {
  FlowDefinition,
  FlowError,
  FlowRunState,
  FlowStepStatus,
} from './types.js'
import { validateFlowDefinition } from './validate.js'

export async function executeFlow<TState>(
  definition: FlowDefinition<TState>,
  options: {
    readonly store?: FlowStateStore<TState>
    readonly signal?: AbortSignal
  } = {},
): Promise<Result<FlowRunState<TState>, FlowError>> {
  const validation = validateFlowDefinition(definition)
  if (!validation.ok) {
    return validation
  }

  const store = options.store ?? new InMemoryFlowStateStore<TState>()
  const loaded = await store.load(definition.id)
  let runState: FlowRunState<TState> = loaded ?? {
    flow_id: definition.id,
    status: 'pending',
    state: definition.initial_state,
    steps: definition.steps.map(step => ({ step_id: step.id, status: 'pending' })),
  }

  runState = { ...runState, status: 'running' }
  await store.save(runState)

  for (const step of definition.steps) {
    const record = runState.steps.find(entry => entry.step_id === step.id)
    if (record?.status === 'succeeded') {
      continue
    }

    runState = updateStep(runState, step.id, 'running')
    await store.save(runState)

    try {
      const nextState = await step.run({
        flow_id: definition.id,
        step_id: step.id,
        state: runState.state,
        signal: options.signal,
      })
      runState = updateStep({ ...runState, state: nextState }, step.id, 'succeeded')
      await store.save(runState)
    } catch (caught) {
      const flowError = normalizeFlowError(caught, step.id)
      if (!step.recover) {
        runState = updateStep({ ...runState, status: 'failed' }, step.id, 'failed', flowError.message)
        await store.save(runState)
        return err(flowError)
      }

      runState = { ...runState, status: 'recovering' }
      await store.save(runState)
      try {
        const recoveredState = await step.recover({
          flow_id: definition.id,
          step_id: step.id,
          state: runState.state,
          signal: options.signal,
        }, flowError)
        runState = updateStep({ ...runState, state: recoveredState, status: 'running' }, step.id, 'succeeded')
        await store.save(runState)
      } catch (recoverError) {
        const finalError = normalizeFlowError(recoverError, step.id)
        runState = updateStep({ ...runState, status: 'failed' }, step.id, 'failed', finalError.message)
        await store.save(runState)
        return err(finalError)
      }
    }
  }

  runState = { ...runState, status: 'succeeded' }
  await store.save(runState)
  return ok(runState)
}

function updateStep<TState>(
  state: FlowRunState<TState>,
  stepId: string,
  status: FlowStepStatus,
  errorMessage?: string,
): FlowRunState<TState> {
  return {
    ...state,
    steps: state.steps.map(record =>
      record.step_id === stepId
        ? { step_id: stepId, status, error: errorMessage }
        : record,
    ),
  }
}

function normalizeFlowError(error: unknown, stepId: string): FlowError {
  return {
    code: 'step_failed',
    message: error instanceof Error ? error.message : String(error),
    step_id: stepId,
  }
}
