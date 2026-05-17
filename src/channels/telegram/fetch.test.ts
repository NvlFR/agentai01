import { describe, expect, it } from 'bun:test'
import { ProxyAgent } from 'undici'

import type { LogEntry } from '../../logging/index.js'
import {
  DEFAULT_TELEGRAM_API_ROOT,
  type TelegramFetch,
  buildTelegramApiUrl,
  normalizeTelegramApiRoot,
  resolveTelegramTransport,
} from './fetch.js'

describe('src/channels/telegram/fetch.ts', () => {
  it('defaults api root and strips embedded bot endpoint paths', () => {
    expect(normalizeTelegramApiRoot()).toBe(DEFAULT_TELEGRAM_API_ROOT)
    expect(
      normalizeTelegramApiRoot('https://api.telegram.org/bot123456:abcde/'),
    ).toBe(DEFAULT_TELEGRAM_API_ROOT)
  })

  it('builds bot api urls from normalized roots', () => {
    expect(
      buildTelegramApiUrl('https://api.telegram.org/', '123:token', 'getUpdates'),
    ).toBe('https://api.telegram.org/bot123:token/getUpdates')
  })

  it('uses the global fetch implementation directly when proxy is not configured', async () => {
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = []
    const transport = resolveTelegramTransport({
      fetchImpl: (async (input: any, init: any) => {
        calls.push({ input, init })
        return new Response('{}')
      }) as TelegramFetch,
    })

    await transport.fetch('https://example.com')

    expect(transport.mode).toBe('direct')
    expect(calls).toHaveLength(1)
    expect(calls[0]?.init).toBeUndefined()
    await transport.close()
  })

  it('wraps fetch with ProxyAgent and logs through telegram/network subsystem', async () => {
    const entries: LogEntry[] = []
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit & { dispatcher?: unknown } }> = []
    const transport = resolveTelegramTransport({
      proxyUrl: 'http://127.0.0.1:8080',
      loggerOptions: {
        minLevel: 'debug',
        writer(entry) {
          entries.push(entry)
        },
      },
      fetchImpl: (async (input: any, init: any) => {
        calls.push({ input, init: init as RequestInit & { dispatcher?: unknown } })
        return new Response('{}')
      }) as TelegramFetch,
    })

    await transport.fetch('https://example.com')

    expect(transport.mode).toBe('proxy')
    expect(calls).toHaveLength(1)
    expect(calls[0]?.init?.dispatcher).toBeInstanceOf(ProxyAgent)
    expect(entries[0]).toMatchObject({
      subsystem: 'telegram/network',
      message: 'telegram transport resolved',
    })
    await transport.close()
  })
})
