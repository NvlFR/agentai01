import { formatIso8601, type Result, ok, err } from '../shared/index.js'

export type CronSchedule =
  | { readonly kind: 'interval'; readonly every_ms: number }
  | { readonly kind: 'daily'; readonly hour: number; readonly minute: number }

export type CronDefinition = {
  readonly id: string
  readonly schedule: CronSchedule
  readonly task: () => Promise<void> | void
}

export type CronAuditEvent = {
  readonly job_id: string
  readonly outcome: 'started' | 'succeeded' | 'failed'
  readonly timestamp: string
  readonly error?: string
}

export function parseCronSchedule(value: string): Result<CronSchedule, string> {
  const intervalMatch = /^every\s+(\d+)ms$/.exec(value.trim())
  if (intervalMatch) {
    const everyMs = Number(intervalMatch[1])
    return everyMs > 0 ? ok({ kind: 'interval', every_ms: everyMs }) : err('Interval must be positive')
  }

  const dailyMatch = /^daily\s+(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (dailyMatch) {
    const hour = Number(dailyMatch[1])
    const minute = Number(dailyMatch[2])
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return ok({ kind: 'daily', hour, minute })
    }
  }

  return err('Unsupported schedule format')
}

export async function runCronJobIsolated(
  definition: CronDefinition,
  audit: (event: CronAuditEvent) => void = () => undefined,
): Promise<Result<void, Error>> {
  audit({ job_id: definition.id, outcome: 'started', timestamp: formatIso8601(new Date()) })
  try {
    await definition.task()
    audit({ job_id: definition.id, outcome: 'succeeded', timestamp: formatIso8601(new Date()) })
    return ok(undefined)
  } catch (error) {
    const normalized = error instanceof Error ? error : new Error(String(error))
    audit({
      job_id: definition.id,
      outcome: 'failed',
      timestamp: formatIso8601(new Date()),
      error: normalized.message,
    })
    return err(normalized)
  }
}
