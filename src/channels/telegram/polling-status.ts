import { formatIso8601 } from '../../shared/index.js'

export type TelegramPollingStatusPatch = {
  mode: 'polling'
  connected?: boolean
  lastConnectedAt?: string | null
  lastEventAt?: string | null
  lastTransportActivityAt?: string | null
  lastError?: string | null
}

export type TelegramPollingStatusSink = (patch: TelegramPollingStatusPatch) => void

export function createTelegramPollingStatusPublisher(setStatus?: TelegramPollingStatusSink) {
  return {
    notePollingStart() {
      setStatus?.({
        mode: 'polling',
        connected: false,
        lastConnectedAt: null,
        lastEventAt: null,
        lastTransportActivityAt: null,
      })
    },
    notePollSuccess(at: number | Date = Date.now()) {
      const isoTimestamp = formatIso8601(typeof at === 'number' ? new Date(at) : at)
      setStatus?.({
        mode: 'polling',
        connected: true,
        lastConnectedAt: isoTimestamp,
        lastTransportActivityAt: isoTimestamp,
        lastError: null,
      })
    },
    notePollingStop() {
      setStatus?.({
        mode: 'polling',
        connected: false,
      })
    },
  }
}
