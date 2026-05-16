// Adapted from referensi/openclaw/src/hooks/handler.ts

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

export async function executeHook(
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
