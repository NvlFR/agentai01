import { afterEach, describe, expect, it } from 'bun:test'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { WebSocket } from 'ws'

import { createOperatorExpressApp } from './http/expressApp.js'
import { createOperatorMicroApp } from './http/honoRoutes.js'
import { OperatorEventBus } from './realtime/operatorEventBus.js'
import { OperatorWebSocketHub } from './realtime/websocketHub.js'

describe('runtime-app transport', () => {
  afterEach(() => {
    delete process.env['APP_ENV']
  })

  it('serves micro health routes from hono', async () => {
    const app = createOperatorMicroApp({
      ready: true,
      generated_at: '2026-05-17T00:00:00.000Z',
    })

    const response = await app.request('http://localhost/health')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      ok: true,
      generated_at: '2026-05-17T00:00:00.000Z',
    })
  })

  it('mounts hono micro routes under express', async () => {
    const app = createOperatorExpressApp({
      ready: true,
      generated_at: '2026-05-17T00:00:00.000Z',
    })
    const server = createServer(app)
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')

    const address = server.address()
    if (!address || typeof address === 'string') {
      throw new Error('Expected a TCP listener')
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/micro/health`)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      ok: true,
    })

    server.close()
    await once(server, 'close')
  })

  it('broadcasts event bus messages over ws', () => {
    const eventBus = new OperatorEventBus()
    const hub = new OperatorWebSocketHub('/events', eventBus)
    let message = ''
    const socket = {
      readyState: WebSocket.OPEN,
      send: (payload: string) => {
        message = payload
      },
      on: () => undefined,
      close: () => undefined,
    } as unknown as WebSocket
    hub.handleConnection(socket)

    eventBus.publish({
      type: 'runtime.heartbeat',
      payload: { ok: true },
    })

    expect(JSON.parse(message)).toEqual({
      type: 'runtime.heartbeat',
      payload: { ok: true },
    })
    hub.close()
  })
})
