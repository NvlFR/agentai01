import { ProxyAgent } from 'undici'

import type { CreateLoggerOptions } from '../../logging/index.js'
import { createSubsystemLogger, type PluginLogger } from '../../plugin-sdk/subsystem-logger.js'

export const DEFAULT_TELEGRAM_API_ROOT = 'https://api.telegram.org'

type RequestInitWithDispatcher = RequestInit & {
  dispatcher?: unknown
}

export type TelegramFetch = (input: any, init?: any) => Promise<any>

export type TelegramTransportMode = 'direct' | 'proxy'

export type TelegramTransport = {
  apiRoot: string
  fetch: TelegramFetch
  mode: TelegramTransportMode
  logger: PluginLogger
  close(): Promise<void>
}

export type ResolveTelegramTransportOptions = {
  apiRoot?: string
  proxyUrl?: string
  fetchImpl?: TelegramFetch
  logger?: PluginLogger
  loggerOptions?: Omit<CreateLoggerOptions, 'bindings'>
}

export function normalizeTelegramApiRoot(apiRoot?: string): string {
  const trimmed = apiRoot?.trim()
  if (!trimmed) {
    return DEFAULT_TELEGRAM_API_ROOT
  }

  let normalized = trimmed.replace(/\/+$/u, '')
  try {
    const url = new URL(normalized)
    const segments = url.pathname.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1] ?? ''
    if (/^bot\d+:[^/]+$/u.test(decodeURIComponent(lastSegment))) {
      segments.pop()
      url.pathname = segments.length > 0 ? `/${segments.join('/')}` : '/'
      url.search = ''
      url.hash = ''
      normalized = url.toString().replace(/\/+$/u, '')
    }
  } catch {
    return normalized
  }

  return normalized
}

export function buildTelegramApiUrl(apiRoot: string, token: string, method: string): string {
  return `${normalizeTelegramApiRoot(apiRoot)}/bot${token}/${method}`
}

export function resolveTelegramTransport(
  options: ResolveTelegramTransportOptions = {},
): TelegramTransport {
  const logger =
    options.logger ?? createSubsystemLogger('telegram/network', options.loggerOptions ?? {})
  const apiRoot = normalizeTelegramApiRoot(options.apiRoot)
  const baseFetch = options.fetchImpl ?? globalThis.fetch.bind(globalThis)
  const proxyUrl = normalizeOptionalString(options.proxyUrl)

  if (!proxyUrl) {
    logger.debug('telegram transport resolved', { mode: 'direct', apiRoot })
    return {
      apiRoot,
      fetch: baseFetch,
      mode: 'direct',
      logger,
      async close() {
        return undefined
      },
    }
  }

  const agent = new ProxyAgent(proxyUrl)
  logger.debug('telegram transport resolved', { mode: 'proxy', apiRoot, proxyUrl })
  return {
    apiRoot,
    mode: 'proxy',
    logger,
    fetch: (async (input: any, init: any) => {
      const requestInit: RequestInitWithDispatcher = {
        ...(init ?? {}),
        dispatcher: agent,
      }
      return baseFetch(input, requestInit)
    }) as TelegramFetch,
    async close() {
      const closableAgent = agent as ProxyAgent & {
        close?: () => Promise<unknown> | unknown
        destroy?: () => Promise<unknown> | unknown
      }
      if (typeof closableAgent.close === 'function') {
        await closableAgent.close()
        return
      }

      if (typeof closableAgent.destroy === 'function') {
        await closableAgent.destroy()
      }
    },
  }
}

function normalizeOptionalString(value: string | undefined): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}
