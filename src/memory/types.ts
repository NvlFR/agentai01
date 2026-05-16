export type MemoryOwnerContext = {
  readonly projectId?: string
  readonly agentId?: string
}

export type MemoryNamespace = {
  readonly kind: 'project' | 'agent' | 'shared'
  readonly id: string
  readonly owner: MemoryOwnerContext
  readonly path: string
}

export type MemoryFileRecord = {
  readonly namespace: MemoryNamespace
  readonly key: string
  readonly path: string
  readonly value: unknown
  readonly updatedAt: string
}

export type MemoryMigration = {
  readonly id: string
  readonly fromVersion: number
  readonly toVersion: number
  migrate(value: unknown): unknown
}

export type MemoryRepairReport = {
  readonly repaired: readonly string[]
  readonly failed: readonly string[]
}
