import type { McpToolId } from '../../domain/hierarchy.js'

export const AGENT_CREATION_COLOR_OPTIONS = [
  'automatic',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'indigo',
  'pink',
  'gray',
] as const

export type AgentCreationColor = (typeof AGENT_CREATION_COLOR_OPTIONS)[number]

export const AGENT_CREATION_LOCATIONS = ['project', 'runtime', 'user'] as const
export type AgentCreationLocation = (typeof AGENT_CREATION_LOCATIONS)[number]

export const AGENT_CREATION_METHODS = ['manual', 'generate'] as const
export type AgentCreationMethod = (typeof AGENT_CREATION_METHODS)[number]

export const AGENT_MEMORY_SCOPES = ['project', 'runtime', 'user'] as const
export type AgentMemoryScope = (typeof AGENT_MEMORY_SCOPES)[number]

export const AGENT_CREATION_STEP_IDS = [
  'location',
  'method',
  'generate',
  'type',
  'prompt',
  'description',
  'tools',
  'model',
  'color',
  'memory',
  'confirm',
] as const

export type AgentCreationStepId = (typeof AGENT_CREATION_STEP_IDS)[number]

export type AgentCreationStepOption = {
  value: string
  label: string
  description: string
}

export type AgentCreationStepDefinition = {
  id: AgentCreationStepId
  title: string
  description: string
  kind: 'choice' | 'text' | 'multiline' | 'multiselect' | 'confirm'
  required: boolean
  options?: AgentCreationStepOption[]
  visibleWhen?: Partial<Record<'method' | 'memoryEnabled', string | boolean>>
}

export type AgentCreationDraft = {
  location?: AgentCreationLocation
  method?: AgentCreationMethod
  generationPrompt?: string
  agentType?: string
  systemPrompt?: string
  whenToUse?: string
  selectedTools?: readonly McpToolId[]
  selectedModel?: string
  selectedColor?: AgentCreationColor
  memoryScope?: AgentMemoryScope
}

export type AgentCreationGeneratedFields = {
  identifier: string
  whenToUse: string
  systemPrompt: string
}

export type AgentCreationValidationResult = {
  isValid: boolean
  errors: string[]
  warnings: string[]
  preview: AgentCreationPreview | null
}

export type AgentCreationPreview = {
  agentType: string
  whenToUse: string
  systemPrompt: string
  tools?: McpToolId[]
  model?: string
  color?: Exclude<AgentCreationColor, 'automatic'>
  memoryScope?: AgentMemoryScope
  location: AgentCreationLocation
  method: AgentCreationMethod
  relativeArtifactPath: string
}

export type SavedAgentDraftArtifact = {
  agentType: string
  location: AgentCreationLocation
  method: AgentCreationMethod
  markdownPath: string
  manifestPath: string
}

export type AgentCreationManifest = {
  agentType: string
  whenToUse: string
  systemPrompt: string
  location: AgentCreationLocation
  method: AgentCreationMethod
  tools?: McpToolId[]
  model?: string
  color?: Exclude<AgentCreationColor, 'automatic'>
  memoryScope?: AgentMemoryScope
  savedAt: string
  markdownPath: string
}
