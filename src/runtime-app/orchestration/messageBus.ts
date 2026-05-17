import type { Agent_Message, AgentType } from '../../domain/types.js'
import type {
  AgentAdapter,
  RuntimeOperationalAppPort,
} from '../integration/agentExecution.js'

export type RuntimeEvent =
  | {
      kind: 'boot'
      timestamp: string
      detail: string
    }
  | {
      kind: 'dispatch'
      timestamp: string
      message_type: string
      from: AgentType
      to: AgentType
      project_id: string
      attempt: number
    }
  | {
      kind: 'retry'
      timestamp: string
      project_id: string
      target: AgentType
      attempt: number
      reason: string
    }
  | {
      kind: 'escalation'
      timestamp: string
      project_id: string
      target: AgentType
      reason: string
    }
  | {
      kind: 'department_run'
      timestamp: string
      head_agent_id: string
      workflow: string
      status: 'completed' | 'failed'
      requires_approval: boolean
    }

export class RuntimeMessageBus {
  readonly events: RuntimeEvent[] = []

  constructor(
    private readonly app: RuntimeOperationalAppPort,
    private readonly adapters: Record<AgentType, AgentAdapter>,
    private readonly maxAttempts = 3,
  ) {}

  async dispatch(
    message: Agent_Message,
    now = message.timestamp,
    attempt = 1,
  ): Promise<void> {
    const normalizedMessage = normalizeMessageForRuntime(message)
    this.app.bindAgentsToProject(
      [normalizedMessage.from, normalizedMessage.to],
      normalizedMessage.project_id,
      now,
    )
    const routed = this.app.shell.routeMessage(normalizedMessage)
    if (!routed.allowed) {
      this.events.push({
        kind: 'escalation',
        timestamp: now,
        project_id: normalizedMessage.project_id,
        target: normalizedMessage.to,
        reason: routed.reason,
      })
      throw new Error(routed.reason)
    }

    this.events.push({
      kind: 'dispatch',
      timestamp: now,
      message_type: normalizedMessage.message_type,
      from: normalizedMessage.from,
      to: normalizedMessage.to,
      project_id: normalizedMessage.project_id,
      attempt,
    })

    const adapter = this.adapters[normalizedMessage.to]
    if (!adapter?.executeMessage) {
      return
    }

    try {
      const result = await adapter.executeMessage(normalizedMessage, {
        app: this.app,
        now,
      })
      for (const outgoing of result.outgoing ?? []) {
        await this.dispatch(outgoing, outgoing.timestamp, 1)
      }
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown adapter execution error'
      if (attempt < this.maxAttempts) {
        this.events.push({
          kind: 'retry',
          timestamp: now,
          project_id: normalizedMessage.project_id,
          target: normalizedMessage.to,
          attempt: attempt + 1,
          reason,
        })
        await this.dispatch(normalizedMessage, now, attempt + 1)
        return
      }

      this.events.push({
        kind: 'escalation',
        timestamp: now,
        project_id: normalizedMessage.project_id,
        target: normalizedMessage.to,
        reason,
      })
      this.app.raiseRepeatedFailureEscalation(normalizedMessage, reason, now)
      throw error
    }
  }
}

function normalizeMessageForRuntime(message: Agent_Message): Agent_Message {
  const payload =
    typeof message.payload === 'object' && message.payload !== null
      ? { ...(message.payload as Record<string, unknown>) }
      : {}

  if (message.message_type === 'status_update') {
    payload['status'] =
      typeof payload['status'] === 'string' && payload['status'].trim().length > 0
        ? payload['status']
        : 'runtime_update'
    payload['summary'] =
      typeof payload['summary'] === 'string' && payload['summary'].trim().length > 0
        ? payload['summary']
        : String(payload['status'])
  }

  if (message.message_type === 'clarification_request') {
    const questions = Array.isArray(payload['questions'])
      ? payload['questions'].filter((item): item is string => typeof item === 'string')
      : []
    payload['request_id'] =
      typeof payload['request_id'] === 'string' && payload['request_id'].trim().length > 0
        ? payload['request_id']
        : `${message.project_id}:${message.to}:clarification`
    payload['question'] =
      typeof payload['question'] === 'string' && payload['question'].trim().length > 0
        ? payload['question']
        : questions[0] ?? 'Please provide clarification for the current handoff.'
  }

  if (message.message_type === 'risk_alert') {
    payload['risk_id'] =
      typeof payload['risk_id'] === 'string' && payload['risk_id'].trim().length > 0
        ? payload['risk_id']
        : `${message.project_id}:${message.to}:risk`
    payload['summary'] =
      typeof payload['summary'] === 'string' && payload['summary'].trim().length > 0
        ? payload['summary']
        : 'Runtime risk detected.'
  }

  return {
    ...message,
    payload,
  }
}
