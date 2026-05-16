export type StatusLevel = 'unknown' | 'healthy' | 'degraded' | 'unhealthy'

export type StatusMessage = {
  source: string
  level: StatusLevel
  message: string
  timestamp?: string
  details?: Record<string, unknown>
}

export type RecordedStatusMessage = Required<Pick<StatusMessage, 'source' | 'level' | 'message'>> & {
  timestamp: string
  details?: Record<string, unknown>
}

export type StatusSnapshot = {
  level: StatusLevel
  sources: Record<string, RecordedStatusMessage>
}

export type StatusChangeEvent = {
  previous: StatusSnapshot
  current: StatusSnapshot
  changed: RecordedStatusMessage
}

export type StatusListener = (event: StatusChangeEvent) => void

export class StatusRegistry {
  private readonly current = new Map<string, RecordedStatusMessage>()
  private readonly statusHistory: RecordedStatusMessage[] = []
  private readonly listeners = new Set<StatusListener>()

  constructor(private readonly historyLimit = 100) {}

  update(message: StatusMessage): RecordedStatusMessage {
    const previous = this.snapshot()
    const recorded = normalizeStatusMessage(message)
    this.current.set(recorded.source, recorded)
    this.statusHistory.push(recorded)
    while (this.statusHistory.length > this.historyLimit) {
      this.statusHistory.shift()
    }

    const current = this.snapshot()
    if (JSON.stringify(previous) !== JSON.stringify(current)) {
      const event = { previous, current, changed: recorded }
      for (const listener of this.listeners) {
        listener(event)
      }
    }

    return recorded
  }

  snapshot(): StatusSnapshot {
    const sources = Object.fromEntries(this.current.entries())
    return {
      level: aggregateStatus(Object.values(sources).map(message => message.level)),
      sources,
    }
  }

  history(): RecordedStatusMessage[] {
    return this.statusHistory.map(message => ({ ...message }))
  }

  subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
}

export function createStatusRegistry(historyLimit?: number): StatusRegistry {
  return new StatusRegistry(historyLimit)
}

export function aggregateStatus(levels: readonly StatusLevel[]): StatusLevel {
  if (levels.length === 0) {
    return 'unknown'
  }

  if (levels.includes('unhealthy')) {
    return 'unhealthy'
  }

  if (levels.includes('degraded')) {
    return 'degraded'
  }

  if (levels.includes('unknown')) {
    return 'unknown'
  }

  return 'healthy'
}

function normalizeStatusMessage(message: StatusMessage): RecordedStatusMessage {
  return {
    source: message.source,
    level: message.level,
    message: message.message,
    timestamp: message.timestamp ?? new Date().toISOString(),
    details: message.details ? { ...message.details } : undefined,
  }
}
