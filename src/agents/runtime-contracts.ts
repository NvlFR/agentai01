import { generateId, type Result, ok, err } from '../shared/index.js'

export type AgentRuntimeState = 'created' | 'starting' | 'ready' | 'busy' | 'idle' | 'stopped' | 'failed'

export type AgentRuntimeContext = {
  readonly agent_id: string
  readonly project_id?: string
  readonly session_id?: string
  readonly model_ref?: string
}

export type AgentDelegationRequest<TPayload = unknown> = {
  readonly delegation_id: string
  readonly from_agent_id: string
  readonly to_agent_id: string
  readonly capability: string
  readonly payload: TPayload
}

export type AgentCompactionStrategy<TMessage = unknown> = {
  readonly id: string
  compact(messages: readonly TMessage[], budget: { readonly max_items: number }): Promise<readonly TMessage[]>
}

export type AgentRuntimeContract<TInput = unknown, TOutput = unknown> = {
  readonly id: string
  readonly capabilities: readonly string[]
  start?(context: AgentRuntimeContext): Promise<void> | void
  stop?(): Promise<void> | void
  execute(input: TInput, context: AgentRuntimeContext): Promise<TOutput>
}

export function createDelegationRequest<TPayload>(input: {
  from_agent_id: string
  to_agent_id: string
  capability: string
  payload: TPayload
}): AgentDelegationRequest<TPayload> {
  return {
    delegation_id: generateId('delegation'),
    ...input,
  }
}

export function canHandleCapability(
  agent: Pick<AgentRuntimeContract, 'capabilities'>,
  capability: string,
): boolean {
  return agent.capabilities.includes(capability)
}

export function validateAgentContext(context: AgentRuntimeContext): Result<AgentRuntimeContext, string[]> {
  const errors: string[] = []
  if (!context.agent_id.trim()) {
    errors.push('agent_id is required')
  }
  if (context.project_id !== undefined && !context.project_id.trim()) {
    errors.push('project_id cannot be empty when provided')
  }

  return errors.length > 0 ? err(errors) : ok(context)
}
