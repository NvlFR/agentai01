// Adapted from referensi/openclaw/src/hooks/registry.ts
import { createAuditTrail, type RecordedAuditEvent } from '../security/index.js'
import { executeHook, type HookEvent, type HookExecutionRecord, type HookRegistration } from './handler.js'

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
