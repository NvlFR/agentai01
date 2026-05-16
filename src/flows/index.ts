import { err, ok, type Result } from '../shared/index.js'

export type FlowStepStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped'
export type FlowStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'recovering'

export type FlowStepContext<TState = Record<string, unknown>> = {
  readonly flow_id: string
  readonly step_id: string
  readonly state: TState
  readonly signal?: AbortSignal
}

export type FlowStep<TState = Record<string, unknown>> = {
  readonly id: string
  readonly title: string
  readonly run: (context: FlowStepContext<TState>) => Promise<TState> | TState
  readonly recover?: (context: FlowStepContext<TState>, error: FlowError) => Promise<TState> | TState
}

export type FlowDefinition<TState = Record<string, unknown>> = {
  readonly id: string
  readonly initial_state: TState
  readonly steps: readonly FlowStep<TState>[]
}

export type FlowStepRecord = {
  readonly step_id: string
  readonly status: FlowStepStatus
  readonly error?: string
}

export type FlowRunState<TState = Record<string, unknown>> = {
  readonly flow_id: string
  readonly status: FlowStatus
  readonly state: TState
  readonly steps: readonly FlowStepRecord[]
}

export type FlowError = {
  readonly code: 'step_failed' | 'definition_invalid'
  readonly message: string
  readonly step_id?: string
}

export type FlowStateStore<TState = Record<string, unknown>> = {
  load(flowId: string): Promise<FlowRunState<TState> | undefined> | FlowRunState<TState> | undefined
  save(state: FlowRunState<TState>): Promise<void> | void
}

export class InMemoryFlowStateStore<TState = Record<string, unknown>> implements FlowStateStore<TState> {
  readonly #states = new Map<string, FlowRunState<TState>>()

  load(flowId: string): FlowRunState<TState> | undefined {
    return this.#states.get(flowId)
  }

  save(state: FlowRunState<TState>): void {
    this.#states.set(state.flow_id, state)
  }
}

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
      const recoveredState = await step.recover({
        flow_id: definition.id,
        step_id: step.id,
        state: runState.state,
        signal: options.signal,
      }, flowError)
      runState = updateStep({ ...runState, state: recoveredState, status: 'running' }, step.id, 'succeeded')
      await store.save(runState)
    }
  }

  runState = { ...runState, status: 'succeeded' }
  await store.save(runState)
  return ok(runState)
}

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
