import { CronJob } from 'cron'
import { Cron } from 'croner'

export type RecurringJobEngine = 'croner' | 'cron'

export type RecurringJobDefinition = {
  id: string
  schedule: string
  engine?: RecurringJobEngine
  run: () => Promise<void> | void
}

type ScheduledHandle = {
  stop: () => void
}

export class SchedulerRegistry {
  private readonly jobs = new Map<string, {
    definition: RecurringJobDefinition
    handle?: ScheduledHandle
  }>()

  register(definition: RecurringJobDefinition): void {
    if (this.jobs.has(definition.id)) {
      throw new Error(`Recurring job already registered: ${definition.id}`)
    }

    this.jobs.set(definition.id, {
      definition: {
        ...definition,
        engine: definition.engine ?? 'croner',
      },
    })
  }

  startAll(): void {
    for (const entry of this.jobs.values()) {
      if (entry.handle) {
        continue
      }

      entry.handle = createScheduledHandle(entry.definition)
    }
  }

  stopAll(): void {
    for (const entry of this.jobs.values()) {
      entry.handle?.stop()
      entry.handle = undefined
    }
  }

  async runNow(id: string): Promise<void> {
    const entry = this.jobs.get(id)
    if (!entry) {
      throw new Error(`Recurring job not found: ${id}`)
    }

    await entry.definition.run()
  }

  list(): Array<{ id: string; engine: RecurringJobEngine; schedule: string; running: boolean }> {
    return [...this.jobs.values()].map(entry => ({
      id: entry.definition.id,
      engine: entry.definition.engine ?? 'croner',
      schedule: entry.definition.schedule,
      running: entry.handle !== undefined,
    }))
  }
}

function createScheduledHandle(definition: RecurringJobDefinition): ScheduledHandle {
  if ((definition.engine ?? 'croner') === 'cron') {
    const job = CronJob.from({
      cronTime: definition.schedule,
      onTick: () => {
        void definition.run()
      },
      start: true,
    })
    return {
      stop: () => job.stop(),
    }
  }

  const job = new Cron(definition.schedule, () => {
    void definition.run()
  })
  return {
    stop: () => job.stop(),
  }
}
