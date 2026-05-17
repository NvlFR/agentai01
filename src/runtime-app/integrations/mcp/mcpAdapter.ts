import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'

export async function createInMemoryMcpPingPair(): Promise<{
  ping: () => Promise<void>
  close: () => Promise<void>
}> {
  const client = new Client({
    name: 'agentai01-client',
    version: '0.1.0',
  })
  const server = new Server({
    name: 'agentai01-server',
    version: '0.1.0',
  })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()

  await Promise.all([
    client.connect(clientTransport),
    server.connect(serverTransport),
  ])

  return {
    ping: async () => {
      await client.ping()
    },
    close: async () => {
      await Promise.all([
        clientTransport.close(),
        serverTransport.close(),
      ])
    },
  }
}
