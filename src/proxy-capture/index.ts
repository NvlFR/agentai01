import { generateId } from '../shared/index.js'
import { serializeAuditSafe } from '../security/index.js'
import { nowIso } from '../utils/index.js'

export type ProxyHeaders = Record<string, string>

export type CapturedRequest = {
  method: string
  url: string
  headers?: ProxyHeaders
  body?: unknown
}

export type CapturedResponse = {
  status: number
  headers?: ProxyHeaders
  body?: unknown
}

export type ProxyCapture = {
  id: string
  timestamp: string
  request: CapturedRequest
  response?: CapturedResponse
  durationMs?: number
  tags: string[]
}

export type ProxyCaptureStore = {
  capture(input: Omit<ProxyCapture, 'id' | 'timestamp'> & Partial<Pick<ProxyCapture, 'id' | 'timestamp'>>): ProxyCapture
  list(): ProxyCapture[]
  replay(id: string): ProxyCapture | null
  exportDebugLog(): string
}

export function createProxyCaptureStore(initialCaptures: readonly ProxyCapture[] = []): ProxyCaptureStore {
  const captures = initialCaptures.map(sanitizeCapture)

  return {
    capture(input) {
      const capture = sanitizeCapture({
        ...input,
        id: input.id ?? generateId('capture'),
        timestamp: input.timestamp ?? nowIso(),
      })
      captures.push(capture)
      return structuredClone(capture)
    },
    list() {
      return captures.map(capture => structuredClone(capture))
    },
    replay(id) {
      const capture = captures.find(entry => entry.id === id)
      return capture ? structuredClone(capture) : null
    },
    exportDebugLog() {
      return captures.map(capture => JSON.stringify(capture)).join('\n')
    },
  }
}

export function normalizeHeaders(headers: Headers | ProxyHeaders | undefined): ProxyHeaders | undefined {
  if (!headers) {
    return undefined
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries())
  }

  return { ...headers }
}

function sanitizeCapture(capture: ProxyCapture): ProxyCapture {
  return serializeAuditSafe(capture)
}
