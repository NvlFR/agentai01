import { readFile, stat } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'

import { err, generateCorrelationId, ok, type Result } from '../shared/index.js'

export type RouteHandler = (request: Request) => Response | Promise<Response>

export type Route = {
  method: string
  path: string
  handler: RouteHandler
}

export type RouteMatch = {
  params: Record<string, string>
}

export type StaticFileOptions = {
  root: string
  indexFile?: string
  cacheControl?: string
}

export type ServerSentEvent = {
  event?: string
  data: string
  id?: string
  retryMs?: number
}

export type WebSocketClient = {
  id: string
  send: (message: string) => void
  close?: (code?: number, reason?: string) => void
}

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
}

export function jsonResponse(value: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set('content-type', 'application/json; charset=utf-8')
  return new Response(JSON.stringify(value), { ...init, headers })
}

export function textResponse(value: string, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set('content-type', headers.get('content-type') ?? 'text/plain; charset=utf-8')
  return new Response(value, { ...init, headers })
}

export function createRouter(routes: readonly Route[], notFound: RouteHandler = () => textResponse('Not found', { status: 404 })): RouteHandler {
  return request => {
    const url = new URL(request.url)
    const route = routes.find(entry => entry.method.toUpperCase() === request.method.toUpperCase() && entry.path === url.pathname)
    return route ? route.handler(request) : notFound(request)
  }
}

export function getCorrelationId(request: Request): string {
  return request.headers.get('x-correlation-id')?.trim() || generateCorrelationId('req')
}

export function getUrlPath(request: Request): string {
  return new URL(request.url).pathname.replace(/\/+$/, '') || '/'
}

export function matchRoute(
  pathname: string,
  pattern: string,
): RouteMatch | undefined {
  const actual = tokenizeRoute(pathname)
  const expected = tokenizeRoute(pattern)

  if (actual.length !== expected.length) {
    return undefined
  }

  const params: Record<string, string> = {}

  for (let index = 0; index < expected.length; index += 1) {
    const expectedPart = expected[index]!
    const actualPart = actual[index]!

    if (expectedPart.startsWith(':')) {
      params[expectedPart.slice(1)] = decodeURIComponent(actualPart)
      continue
    }

    if (expectedPart !== actualPart) {
      return undefined
    }
  }

  return { params }
}

export function createStaticFileHandler(options: StaticFileOptions): RouteHandler {
  return async request => {
    const url = new URL(request.url)
    const unsafePath = decodeURIComponent(url.pathname.replace(/^\/+/, '')) || options.indexFile || 'index.html'
    const safePath = resolveInside(options.root, unsafePath)
    if (!safePath.ok) {
      return textResponse('Forbidden', { status: 403 })
    }

    try {
      const info = await stat(safePath.value)
      const filePath = info.isDirectory()
        ? resolveInside(options.root, join(unsafePath, options.indexFile ?? 'index.html'))
        : safePath
      if (!filePath.ok) {
        return textResponse('Forbidden', { status: 403 })
      }

      const body = await readFile(filePath.value)
      const headers = new Headers()
      headers.set('content-type', MIME_TYPES[extname(filePath.value)] ?? 'application/octet-stream')
      if (options.cacheControl) {
        headers.set('cache-control', options.cacheControl)
      }
      return new Response(body, { headers })
    } catch {
      return textResponse('Not found', { status: 404 })
    }
  }
}

export function encodeSseEvent(event: ServerSentEvent): string {
  const lines: string[] = []
  if (event.id) {
    lines.push(`id: ${event.id}`)
  }
  if (event.event) {
    lines.push(`event: ${event.event}`)
  }
  if (event.retryMs !== undefined) {
    lines.push(`retry: ${Math.max(0, Math.trunc(event.retryMs))}`)
  }
  for (const line of event.data.split(/\r?\n/)) {
    lines.push(`data: ${line}`)
  }
  return `${lines.join('\n')}\n\n`
}

export function sseResponse(events: AsyncIterable<ServerSentEvent> | Iterable<ServerSentEvent>): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for await (const event of events) {
        controller.enqueue(encoder.encode(encodeSseEvent(event)))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      'content-type': 'text/event-stream; charset=utf-8',
    },
  })
}

export function createWebSocketHub() {
  const clients = new Map<string, WebSocketClient>()

  return {
    add(client: WebSocketClient): void {
      clients.set(client.id, client)
    },
    remove(id: string): void {
      clients.delete(id)
    },
    broadcast(message: string): number {
      for (const client of clients.values()) {
        client.send(message)
      }
      return clients.size
    },
    send(id: string, message: string): boolean {
      const client = clients.get(id)
      if (!client) {
        return false
      }
      client.send(message)
      return true
    },
    closeAll(code?: number, reason?: string): void {
      for (const client of clients.values()) {
        client.close?.(code, reason)
      }
      clients.clear()
    },
    size(): number {
      return clients.size
    },
  }
}

function resolveInside(root: string, unsafePath: string): Result<string, string> {
  const resolvedRoot = resolve(root)
  const resolvedPath = resolve(resolvedRoot, unsafePath)
  const rootWithSeparator = resolvedRoot.endsWith(sep) ? resolvedRoot : `${resolvedRoot}${sep}`
  return resolvedPath === resolvedRoot || resolvedPath.startsWith(rootWithSeparator)
    ? ok(resolvedPath)
    : err('Path traversal outside root is not allowed')
}

function tokenizeRoute(value: string): string[] {
  return value.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
}
