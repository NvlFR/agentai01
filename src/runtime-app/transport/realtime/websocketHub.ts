import type { Server as HttpServer, IncomingMessage } from 'node:http'
import { WebSocketServer, WebSocket, type WebSocket as WebSocketConnection } from 'ws'

import { OperatorEventBus, type OperatorEvent } from './operatorEventBus.js'

export class OperatorWebSocketHub {
  private readonly server: WebSocketServer
  private readonly sockets = new Set<WebSocket>()
  private readonly unsubscribe: () => void

  constructor(
    private readonly path: string,
    eventBus: OperatorEventBus,
  ) {
    this.server = new WebSocketServer({ noServer: true })
    this.server.on('connection', socket => {
      this.sockets.add(socket)
      socket.on('close', () => {
        this.sockets.delete(socket)
      })
    })

    this.unsubscribe = eventBus.subscribe(event => {
      this.broadcast(event)
    })
  }

  attach(server: HttpServer): void {
    server.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1')
      if (url.pathname !== this.path) {
        socket.destroy()
        return
      }

      this.server.handleUpgrade(request, socket, head, client => {
        this.server.emit('connection', client, request)
      })
    })
  }

  handleConnection(socket: WebSocketConnection, _request?: IncomingMessage): void {
    this.sockets.add(socket)
  }

  broadcast(event: OperatorEvent): void {
    const payload = JSON.stringify(event)
    for (const socket of this.sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload)
      }
    }
  }

  close(): void {
    this.unsubscribe()
    for (const socket of this.sockets) {
      socket.close()
    }
    this.sockets.clear()
    this.server.close()
  }
}
