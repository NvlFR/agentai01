// Adapted from referensi/openclaw/src/flows/store.ts
import type { FlowRunState } from './types.js'

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
