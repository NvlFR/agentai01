import { describe, expect, it } from 'bun:test'
import {
  DEFAULT_WHATSAPP_SOCKET_TIMING,
  resolveWhatsAppSocketTiming,
} from './socket-timing.js'

describe('DEFAULT_WHATSAPP_SOCKET_TIMING', () => {
  it('has expected defaults', () => {
    expect(DEFAULT_WHATSAPP_SOCKET_TIMING.keepAliveIntervalMs).toBe(25_000)
    expect(DEFAULT_WHATSAPP_SOCKET_TIMING.connectTimeoutMs).toBe(60_000)
    expect(DEFAULT_WHATSAPP_SOCKET_TIMING.defaultQueryTimeoutMs).toBe(60_000)
  })
})

describe('resolveWhatsAppSocketTiming', () => {
  it('returns defaults when config is empty', () => {
    const result = resolveWhatsAppSocketTiming({})
    expect(result).toEqual(DEFAULT_WHATSAPP_SOCKET_TIMING)
  })

  it('uses config values when provided', () => {
    const result = resolveWhatsAppSocketTiming({
      web: {
        whatsapp: {
          keepAliveIntervalMs: 10_000,
          connectTimeoutMs: 30_000,
          defaultQueryTimeoutMs: 45_000,
        },
      },
    })
    expect(result.keepAliveIntervalMs).toBe(10_000)
    expect(result.connectTimeoutMs).toBe(30_000)
    expect(result.defaultQueryTimeoutMs).toBe(45_000)
  })

  it('overrides take precedence over config', () => {
    const result = resolveWhatsAppSocketTiming(
      {
        web: {
          whatsapp: {
            keepAliveIntervalMs: 10_000,
          },
        },
      },
      { keepAliveIntervalMs: 5_000 },
    )
    expect(result.keepAliveIntervalMs).toBe(5_000)
  })

  it('ignores non-positive-integer values and falls back to defaults', () => {
    const result = resolveWhatsAppSocketTiming({
      web: {
        whatsapp: {
          keepAliveIntervalMs: -1,
          connectTimeoutMs: 0,
          defaultQueryTimeoutMs: 1.5,
        },
      },
    })
    expect(result.keepAliveIntervalMs).toBe(DEFAULT_WHATSAPP_SOCKET_TIMING.keepAliveIntervalMs)
    expect(result.connectTimeoutMs).toBe(DEFAULT_WHATSAPP_SOCKET_TIMING.connectTimeoutMs)
    expect(result.defaultQueryTimeoutMs).toBe(DEFAULT_WHATSAPP_SOCKET_TIMING.defaultQueryTimeoutMs)
  })

  it('ignores non-positive-integer override values', () => {
    const result = resolveWhatsAppSocketTiming({}, { keepAliveIntervalMs: -100 })
    expect(result.keepAliveIntervalMs).toBe(DEFAULT_WHATSAPP_SOCKET_TIMING.keepAliveIntervalMs)
  })

  it('override precedence: override > config > default', () => {
    const result = resolveWhatsAppSocketTiming(
      { web: { whatsapp: { connectTimeoutMs: 20_000 } } },
      { connectTimeoutMs: 15_000 },
    )
    expect(result.connectTimeoutMs).toBe(15_000)
  })
})
