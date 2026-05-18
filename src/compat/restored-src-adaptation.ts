export const REQUIRED_RESTORED_SRC_CAPABILITIES = [
  'context',
  'utils',
  'suggestions',
  'ultraplan',
  'teleport',
  'telemetry',
  'skills',
  'tasks',
  'tools',
  'model',
  'message',
  'memory',
  'github',
  'git',
  'filePersistence',
  'computerUse',
  'query',
  'upstreamproxy',
  'voice',
  'services',
] as const

export type RestoredSrcCapabilityId = typeof REQUIRED_RESTORED_SRC_CAPABILITIES[number]

export type AdaptationClassification =
  | 'new-subsystem'
  | 'enhancement'
  | 'compatibility-layer'

export type LandingPath =
  | 'src/agents'
  | 'src/realtime-transcription'
  | 'src/runtime'
  | 'src/runtime-app'
  | 'src/runtime-app/memory'
  | 'src/runtime-app/prompt'
  | 'src/runtime-app/tools'
  | 'src/runtime-app/ui'
  | 'src/runtime-app/providers'
  | 'src/runtime-app/skills'
  | 'src/runtime-app/storage'
  | 'src/runtime-app/speech'
  | 'src/runtime-app/integrations'
  | 'src/context-engine'
  | 'src/tools'
  | 'src/tasks'
  | 'src/memory'
  | 'src/mcp'
  | 'src/logging'
  | 'src/plugins'
  | 'src/model-catalog'
  | 'src/shared'
  | 'src/interactive'
  | 'src/gateway'
  | 'src/http'
  | 'src/tts'

export type RestoredSrcAdaptationEntry = {
  readonly capabilityId: RestoredSrcCapabilityId
  readonly sourcePatterns: readonly string[]
  readonly landingPaths: readonly LandingPath[]
  readonly classification: AdaptationClassification
  readonly integrationSurfaces: readonly string[]
  readonly rationale: string
}

export const RESTORED_SRC_ADAPTATION_BASELINE: readonly RestoredSrcAdaptationEntry[] = [
  {
    capabilityId: 'context',
    sourcePatterns: ['restored-src/src/context/*'],
    landingPaths: ['src/runtime-app/ui', 'src/runtime-app/prompt', 'src/runtime', 'src/interactive'],
    classification: 'enhancement',
    integrationSurfaces: ['operator context', 'runtime prompt assembly', 'speech context'],
    rationale: 'UI-heavy context modules are split between operator surfaces and runtime-safe context helpers.',
  },
  {
    capabilityId: 'utils',
    sourcePatterns: ['restored-src/src/utils/*'],
    landingPaths: ['src/shared', 'src/runtime', 'src/tools', 'src/tasks', 'src/memory', 'src/mcp', 'src/logging'],
    classification: 'enhancement',
    integrationSurfaces: ['leaf helpers', 'runtime safety guards', 'shared adapters'],
    rationale: 'Utility capability is adapted into existing leaf layers instead of creating a parallel utils runtime.',
  },
  {
    capabilityId: 'suggestions',
    sourcePatterns: ['restored-src/src/utils/suggestions/*', 'restored-src/src/services/PromptSuggestion/*'],
    landingPaths: ['src/runtime-app/prompt', 'src/plugins', 'src/tools'],
    classification: 'new-subsystem',
    integrationSurfaces: ['operator assist', 'skill recommendations', 'autocomplete'],
    rationale: 'Suggestion logic lands near prompt entry and plugin-aware assistive features.',
  },
  {
    capabilityId: 'ultraplan',
    sourcePatterns: ['restored-src/src/utils/ultraplan/*'],
    landingPaths: ['src/runtime', 'src/tools', 'src/tasks'],
    classification: 'compatibility-layer',
    integrationSurfaces: ['planning helpers', 'task orchestration'],
    rationale: 'Planning helpers are exposed as optional runtime affordances without replacing the current orchestration model.',
  },
  {
    capabilityId: 'teleport',
    sourcePatterns: ['restored-src/src/utils/teleport/*'],
    landingPaths: ['src/runtime', 'src/runtime-app'],
    classification: 'compatibility-layer',
    integrationSurfaces: ['session export', 'runtime extensions'],
    rationale: 'Teleport-style export behavior is modeled as optional runtime support rather than a core subsystem.',
  },
  {
    capabilityId: 'telemetry',
    sourcePatterns: ['restored-src/src/utils/telemetry/*', 'restored-src/src/services/analytics/*'],
    landingPaths: ['src/logging', 'src/runtime-app'],
    classification: 'enhancement',
    integrationSurfaces: ['audit logging', 'diagnostics', 'analytics exporters'],
    rationale: 'Telemetry must reuse the repo logging and secret-redaction path.',
  },
  {
    capabilityId: 'skills',
    sourcePatterns: ['restored-src/src/skills/*'],
    landingPaths: ['src/runtime-app/skills', 'src/plugins', 'src/agents'],
    classification: 'enhancement',
    integrationSurfaces: ['skill loading', 'runtime execution', 'agent access'],
    rationale: 'Skill capability extends the current skill and plugin system incrementally.',
  },
  {
    capabilityId: 'tasks',
    sourcePatterns: ['restored-src/src/tasks/*'],
    landingPaths: ['src/tasks', 'src/runtime', 'src/runtime-app'],
    classification: 'enhancement',
    integrationSurfaces: ['async work', 'task lifecycle', 'queue integration'],
    rationale: 'Task execution is wired into the existing queue and runtime surfaces.',
  },
  {
    capabilityId: 'tools',
    sourcePatterns: ['restored-src/src/tools/*'],
    landingPaths: ['src/tools', 'src/runtime-app/tools'],
    classification: 'enhancement',
    integrationSurfaces: ['tool catalog', 'runtime descriptors', 'operator tooling'],
    rationale: 'Tool capabilities are normalized into the existing tool descriptor and execution policy path.',
  },
  {
    capabilityId: 'model',
    sourcePatterns: ['restored-src/src/utils/model/*'],
    landingPaths: ['src/model-catalog', 'src/runtime-app/providers'],
    classification: 'enhancement',
    integrationSurfaces: ['model resolution', 'provider mapping', 'capability metadata'],
    rationale: 'Model capability aligns with the repo model catalog and provider runtime.',
  },
  {
    capabilityId: 'message',
    sourcePatterns: ['restored-src/src/utils/messages/*'],
    landingPaths: ['src/runtime', 'src/runtime-app/prompt', 'src/shared', 'src/tools'],
    classification: 'enhancement',
    integrationSurfaces: ['message normalization', 'tool-result mapping', 'runtime compatibility'],
    rationale: 'Message helpers become runtime-safe normalization utilities used before model or tool execution.',
  },
  {
    capabilityId: 'memory',
    sourcePatterns: ['restored-src/src/memory/*', 'restored-src/src/services/SessionMemory/*', 'restored-src/src/services/teamMemorySync/*'],
    landingPaths: ['src/memory', 'src/runtime-app/memory'],
    classification: 'enhancement',
    integrationSurfaces: ['session memory', 'project isolation', 'team sync'],
    rationale: 'Memory capability must respect current project and department isolation rules.',
  },
  {
    capabilityId: 'github',
    sourcePatterns: ['restored-src/src/utils/github/*'],
    landingPaths: ['src/runtime-app/integrations', 'src/shared'],
    classification: 'compatibility-layer',
    integrationSurfaces: ['repo mapping', 'auth/status helpers'],
    rationale: 'GitHub-specific helpers are treated as integration utilities around the runtime app.',
  },
  {
    capabilityId: 'git',
    sourcePatterns: ['restored-src/src/utils/git/*'],
    landingPaths: ['src/runtime-app/integrations', 'src/shared'],
    classification: 'compatibility-layer',
    integrationSurfaces: ['git safety helpers', 'worktree-aware runtime flows'],
    rationale: 'Git operations remain an integration concern guarded by runtime policies.',
  },
  {
    capabilityId: 'filePersistence',
    sourcePatterns: ['restored-src/src/utils/filePersistence/*'],
    landingPaths: ['src/memory', 'src/runtime-app/storage'],
    classification: 'enhancement',
    integrationSurfaces: ['artifact persistence', 'repairability', 'path-safe state storage'],
    rationale: 'Disk persistence lands in storage surfaces with explicit ownership and path validation.',
  },
  {
    capabilityId: 'computerUse',
    sourcePatterns: ['restored-src/src/utils/computerUse/*'],
    landingPaths: ['src/runtime-app/tools', 'src/runtime'],
    classification: 'new-subsystem',
    integrationSurfaces: ['host adapters', 'automation gates', 'execution safety'],
    rationale: 'Computer-use capability is isolated behind explicit runtime gates and permission checks.',
  },
  {
    capabilityId: 'query',
    sourcePatterns: ['restored-src/src/query/*', 'restored-src/src/query.ts', 'restored-src/src/utils/processUserInput/*'],
    landingPaths: ['src/runtime', 'src/context-engine', 'src/runtime-app/prompt'],
    classification: 'enhancement',
    integrationSurfaces: ['query config', 'input preprocessing', 'token budgeting', 'stop hooks'],
    rationale: 'Query capability is split between execution-time runtime helpers and operator prompt preprocessing.',
  },
  {
    capabilityId: 'upstreamproxy',
    sourcePatterns: ['restored-src/src/upstreamproxy/*'],
    landingPaths: ['src/runtime-app/providers', 'src/gateway', 'src/http'],
    classification: 'compatibility-layer',
    integrationSurfaces: ['relay boundaries', 'provider proxying'],
    rationale: 'Upstream proxying stays at the network boundary instead of entering the domain core.',
  },
  {
    capabilityId: 'voice',
    sourcePatterns: ['restored-src/src/voice/*'],
    landingPaths: ['src/runtime-app/speech', 'src/tts', 'src/realtime-transcription'],
    classification: 'enhancement',
    integrationSurfaces: ['voice flags', 'speech pipeline', 'transcription'],
    rationale: 'Voice capability augments existing speech and transcription modules.',
  },
  {
    capabilityId: 'services',
    sourcePatterns: ['restored-src/src/services/*'],
    landingPaths: ['src/runtime', 'src/runtime-app', 'src/mcp', 'src/logging', 'src/plugins', 'src/memory'],
    classification: 'enhancement',
    integrationSurfaces: ['provider services', 'MCP services', 'memory services', 'analytics'],
    rationale: 'Service contracts are adapted into current runtime boundaries using dependency injection.',
  },
] as const

export function findRestoredSrcAdaptationEntry(
  capabilityId: RestoredSrcCapabilityId,
): RestoredSrcAdaptationEntry | undefined {
  return RESTORED_SRC_ADAPTATION_BASELINE.find(entry => entry.capabilityId === capabilityId)
}

export function collectLandingPaths(
  entries: readonly RestoredSrcAdaptationEntry[] = RESTORED_SRC_ADAPTATION_BASELINE,
): LandingPath[] {
  return [...new Set(entries.flatMap(entry => entry.landingPaths))].sort()
}

export function listMandatoryCapabilityCoverage(): Array<{
  capabilityId: RestoredSrcCapabilityId
  covered: boolean
  landingPaths: readonly LandingPath[]
}> {
  return REQUIRED_RESTORED_SRC_CAPABILITIES.map(capabilityId => {
    const entry = findRestoredSrcAdaptationEntry(capabilityId)
    return {
      capabilityId,
      covered: entry !== undefined,
      landingPaths: entry?.landingPaths ?? [],
    }
  })
}

export function listContextFabricSourcePatterns(): string[] {
  return [
    ...new Set([
      ...findRestoredSrcAdaptationEntry('context')!.sourcePatterns,
      ...findRestoredSrcAdaptationEntry('query')!.sourcePatterns,
      ...findRestoredSrcAdaptationEntry('message')!.sourcePatterns,
      ...findRestoredSrcAdaptationEntry('suggestions')!.sourcePatterns,
    ]),
  ]
}
