import { createAuditTrail, type RecordedAuditEvent } from '../security/index.js'

export type HookEvent = {
  readonly type: string
  readonly payload: unknown
  readonly source?: string
  readonly received_at?: string
}

export type HookHandlerResult = {
  readonly handled: boolean
  readonly metadata?: Record<string, unknown>
}

export type HookHandler = (event: HookEvent) => Promise<HookHandlerResult> | HookHandlerResult

export type HookRegistration = {
  readonly id: string
  readonly events: readonly string[]
  readonly handler: HookHandler
}

export type HookExecutionRecord = {
  readonly hook_id: string
  readonly event_type: string
  readonly status: 'handled' | 'ignored' | 'failed'
  readonly error?: string
}

export type HookRegistry = {
  register(registration: HookRegistration): void
  deregister(hookId: string): boolean
  handleInbound(event: HookEvent): Promise<readonly HookExecutionRecord[]>
  auditEvents(): readonly RecordedAuditEvent[]
}

export function createHookRegistry(): HookRegistry {
  const hooks = new Map<string, HookRegistration>()
  const audit = createAuditTrail()

  return {
    register(registration) {
      hooks.set(registration.id, registration)
      audit.auditLog({
        event_type: 'hook.registered',
        actor: registration.id,
        outcome: 'succeeded',
        metadata: { events: registration.events },
      })
    },
    deregister(hookId) {
      const removed = hooks.delete(hookId)
      audit.auditLog({
        event_type: 'hook.deregistered',
        actor: hookId,
        outcome: removed ? 'succeeded' : 'not_found',
      })
      return removed
    },
    async handleInbound(event) {
      const matchingHooks = [...hooks.values()].filter(hook => hook.events.includes(event.type))
      const records = await Promise.all(matchingHooks.map(hook => executeHook(hook, event)))
      for (const record of records) {
        audit.auditLog({
          event_type: 'hook.executed',
          actor: record.hook_id,
          outcome: record.status,
          metadata: {
            event_type: record.event_type,
            error: record.error,
          },
        })
      }

      return records
    },
    auditEvents() {
      return audit.list()
    },
  }
}

async function executeHook(
  hook: HookRegistration,
  event: HookEvent,
): Promise<HookExecutionRecord> {
  try {
    const result = await hook.handler(event)
    return {
      hook_id: hook.id,
      event_type: event.type,
      status: result.handled ? 'handled' : 'ignored',
    }
  } catch (caught) {
    return {
      hook_id: hook.id,
      event_type: event.type,
      status: 'failed',
      error: caught instanceof Error ? caught.message : String(caught),
    }
  }
}
