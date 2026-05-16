import { describe, expect, it } from 'bun:test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  createRouter,
  createStaticFileHandler,
  createWebSocketHub,
  encodeSseEvent,
  getCorrelationId,
  getUrlPath,
  jsonResponse,
  matchRoute,
  sseResponse,
} from './index.js'

describe('web', () => {
  it('routes requests and formats JSON responses', async () => {
    const router = createRouter([
      { method: 'GET', path: '/ready', handler: () => jsonResponse({ ready: true }) },
    ])
    const response = await router(new Request('http://local.test/ready'))

    expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8')
    expect(await response.json()).toEqual({ ready: true })
    expect((await router(new Request('http://local.test/missing'))).status).toBe(404)
  })

  it('normalizes request metadata and matches parameterized paths', () => {
    const request = new Request('http://local.test/runtime/jobs/job-1/retry/', {
      headers: { 'x-correlation-id': ' corr-1 ' },
    })

    expect(getCorrelationId(request)).toBe('corr-1')
    expect(getCorrelationId(new Request('http://local.test/'))).toStartWith('req-')
    expect(getUrlPath(request)).toBe('/runtime/jobs/job-1/retry')
    expect(matchRoute(getUrlPath(request), '/runtime/jobs/:jobId/retry')).toEqual({
      params: { jobId: 'job-1' },
    })
    expect(matchRoute('/runtime/jobs/job-1/retry', '/approvals/:requestId/response')).toBeUndefined()
  })

  it('serves static files while blocking traversal', async () => {
    const root = await mkdtemp(join(tmpdir(), 'agentai-web-'))
    try {
      await mkdir(join(root, 'assets'))
      await writeFile(join(root, 'assets', 'app.txt'), 'hello', 'utf8')
      const handler = createStaticFileHandler({ root })

      const response = await handler(new Request('http://local.test/assets/app.txt'))
      expect(await response.text()).toBe('hello')
      expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8')
      expect((await handler(new Request('http://local.test/..%2Fsecret.txt'))).status).toBe(403)
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('encodes SSE events and hub broadcasts', async () => {
    expect(encodeSseEvent({ id: '1', event: 'ready', data: 'a\nb', retryMs: 10 })).toBe(
      'id: 1\nevent: ready\nretry: 10\ndata: a\ndata: b\n\n',
    )
    expect(await sseResponse([{ data: 'ok' }]).text()).toBe('data: ok\n\n')

    const sent: string[] = []
    const hub = createWebSocketHub()
    hub.add({ id: 'operator', send: message => sent.push(message) })
    expect(hub.broadcast('hello')).toBe(1)
    expect(hub.send('missing', 'nope')).toBe(false)
    expect(sent).toEqual(['hello'])
  })
})
