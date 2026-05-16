import type { JsonObject } from '../tools/index.js'

export type MemoryCitationsMode = 'off' | 'on' | 'auto'

export type MemoryPromptSectionBuilder = (params: {
  readonly availableTools: Set<string>
  readonly citationsMode?: MemoryCitationsMode
}) => string[]

export type MemoryCorpusSearchResult = {
  readonly corpus: string
  readonly path: string
  readonly title?: string
  readonly kind?: string
  readonly score: number
  readonly snippet: string
  readonly id?: string
  readonly startLine?: number
  readonly endLine?: number
  readonly citation?: string
  readonly source?: string
  readonly provenanceLabel?: string
  readonly sourceType?: string
  readonly sourcePath?: string
  readonly updatedAt?: string
}

export type MemoryCorpusGetResult = {
  readonly corpus: string
  readonly path: string
  readonly title?: string
  readonly kind?: string
  readonly content: string
  readonly fromLine: number
  readonly lineCount: number
  readonly id?: string
  readonly provenanceLabel?: string
  readonly sourceType?: string
  readonly sourcePath?: string
  readonly updatedAt?: string
}

export type MemoryCorpusSupplement = {
  search(params: {
    readonly query: string
    readonly maxResults?: number
    readonly agentSessionKey?: string
  }): Promise<MemoryCorpusSearchResult[]>
  get(params: {
    readonly lookup: string
    readonly fromLine?: number
    readonly lineCount?: number
    readonly agentSessionKey?: string
  }): Promise<MemoryCorpusGetResult | null>
}

export type MemoryFlushPlan = {
  readonly softThresholdTokens: number
  readonly forceFlushTranscriptBytes: number
  readonly reserveTokensFloor: number
  readonly model?: string
  readonly prompt: string
  readonly systemPrompt: string
  readonly relativePath: string
}

export type MemoryFlushPlanResolver = (params: {
  readonly cfg?: JsonObject
  readonly nowMs?: number
}) => MemoryFlushPlan | null

export type MemoryPluginRuntime = {
  getMemorySearchManager(params: {
    readonly cfg: JsonObject
    readonly agentId: string
    readonly purpose?: 'default' | 'status' | 'cli'
  }): Promise<{
    readonly manager: unknown | null
    readonly error?: string
  }>
}

export type MemoryPluginPublicArtifactContentType = 'markdown' | 'json' | 'text'

export type MemoryPluginPublicArtifact = {
  readonly kind: string
  readonly workspaceDir: string
  readonly relativePath: string
  readonly absolutePath: string
  readonly agentIds: string[]
  readonly contentType: MemoryPluginPublicArtifactContentType
}

export type MemoryPluginPublicArtifactsProvider = {
  listArtifacts(params: { readonly cfg: JsonObject }): Promise<MemoryPluginPublicArtifact[]>
}

export type MemoryPluginCapability = {
  readonly promptBuilder?: MemoryPromptSectionBuilder
  readonly flushPlanResolver?: MemoryFlushPlanResolver
  readonly runtime?: MemoryPluginRuntime
  readonly publicArtifacts?: MemoryPluginPublicArtifactsProvider
}

/**
 * Memory Core Host Contracts.
 * Adapted for agentai01 from OpenClaw's memory-state.ts and memory-host-sdk.
 */
export type MemoryHostCore = {
  readonly embeddings?: unknown
  readonly storage?: unknown
  readonly multimodal?: unknown
  readonly compaction?: unknown
}
