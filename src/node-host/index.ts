export type NodeHostId = string

export type NodeHostHealth = {
  status: 'healthy' | 'degraded' | 'offline'
  checkedAt: string
  message?: string
}

export type RemoteExecutionRequest = {
  command: string
  args: readonly string[]
  cwd?: string
  env?: Record<string, string>
  timeoutMs?: number
}

export type RemoteExecutionResult = {
  exitCode: number
  stdout: string
  stderr: string
  durationMs: number
}

export type NodeHost = {
  id: NodeHostId
  labels: readonly string[]
  health(): Promise<NodeHostHealth>
  execute(request: RemoteExecutionRequest): Promise<RemoteExecutionResult>
}

export type NodeHostRegistry = {
  register(host: NodeHost): void
  get(id: NodeHostId): NodeHost | null
  list(): NodeHost[]
}

export function createNodeHostRegistry(): NodeHostRegistry {
  const hosts = new Map<NodeHostId, NodeHost>()

  return {
    register(host) {
      hosts.set(host.id, host)
    },
    get(id) {
      return hosts.get(id) ?? null
    },
    list() {
      return [...hosts.values()]
    },
  }
}

export async function collectNodeHostHealth(hosts: readonly NodeHost[]): Promise<Record<NodeHostId, NodeHostHealth>> {
  const entries = await Promise.all(hosts.map(async host => [host.id, await host.health()] as const))
  return Object.fromEntries(entries)
}
