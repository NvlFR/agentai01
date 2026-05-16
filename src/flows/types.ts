// Adapted from referensi/openclaw/src/flows/types.ts

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
