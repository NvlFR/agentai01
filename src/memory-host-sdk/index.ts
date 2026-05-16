export type MemoryProviderContext = {
  readonly projectId?: string
  readonly agentId?: string
  readonly sessionId?: string
}

export type MemoryDocument = {
  readonly id: string
  readonly namespace: string
  readonly content: string
  readonly context: MemoryProviderContext
  readonly metadata?: Record<string, unknown>
  readonly updatedAt: string
}

export type MemorySearchQuery = {
  readonly namespace?: string
  readonly query: string
  readonly context?: MemoryProviderContext
  readonly limit?: number
}

export type MemorySearchResult = {
  readonly document: MemoryDocument
  readonly score: number
}

export type MemoryIndexHookEvent =
  | { readonly type: 'indexed'; readonly document: MemoryDocument }
  | { readonly type: 'deleted'; readonly namespace: string; readonly id: string }

export type MemoryIndexHook = (event: MemoryIndexHookEvent) => void | Promise<void>

export type MemoryProvider = {
  readonly id: string
  upsert(document: MemoryDocument): Promise<void>
  search(query: MemorySearchQuery): Promise<readonly MemorySearchResult[]>
  delete(namespace: string, id: string): Promise<void>
}

export class MemoryHostIndex implements MemoryProvider {
  readonly id: string
  readonly #documents = new Map<string, MemoryDocument>()
  readonly #hooks: MemoryIndexHook[] = []

  constructor(id = 'memory-host-index') {
    this.id = id
  }

  registerIndexHook(hook: MemoryIndexHook): () => void {
    this.#hooks.push(hook)
    return () => {
      const index = this.#hooks.indexOf(hook)
      if (index >= 0) {
        this.#hooks.splice(index, 1)
      }
    }
  }

  async upsert(document: MemoryDocument): Promise<void> {
    this.#documents.set(documentKey(document.namespace, document.id), document)
    await this.emit({ type: 'indexed', document })
  }

  async search(query: MemorySearchQuery): Promise<readonly MemorySearchResult[]> {
    const terms = tokenize(query.query)
    const results = [...this.#documents.values()]
      .filter(document => query.namespace === undefined || document.namespace === query.namespace)
      .filter(document => contextMatches(query.context, document.context))
      .map(document => ({ document, score: scoreDocument(document, terms) }))
      .filter(result => result.score > 0)
      .sort((left, right) => right.score - left.score || right.document.updatedAt.localeCompare(left.document.updatedAt))

    return typeof query.limit === 'number' ? results.slice(0, query.limit) : results
  }

  async delete(namespace: string, id: string): Promise<void> {
    this.#documents.delete(documentKey(namespace, id))
    await this.emit({ type: 'deleted', namespace, id })
  }

  async emit(event: MemoryIndexHookEvent): Promise<void> {
    await Promise.all(this.#hooks.map(hook => hook(event)))
  }
}

function documentKey(namespace: string, id: string): string {
  return `${namespace}:${id}`
}

function contextMatches(query: MemoryProviderContext | undefined, document: MemoryProviderContext): boolean {
  if (!query) {
    return true
  }

  return (
    (query.projectId === undefined || query.projectId === document.projectId) &&
    (query.agentId === undefined || query.agentId === document.agentId) &&
    (query.sessionId === undefined || query.sessionId === document.sessionId)
  )
}

function scoreDocument(document: MemoryDocument, terms: readonly string[]): number {
  const haystack = tokenize(`${document.id} ${document.namespace} ${document.content}`)
  return terms.reduce((score, term) => score + haystack.filter(candidate => candidate === term).length, 0)
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean)
}
