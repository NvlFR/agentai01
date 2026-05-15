export type SkillSchema = {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'null' | 'array' | 'object'
  description?: string
  properties?: Record<string, SkillSchema>
  required?: string[]
  items?: SkillSchema
  enum?: unknown[]
  const?: unknown
  additionalProperties?: boolean
  minLength?: number
  maxLength?: number
  pattern?: string
  minimum?: number
  maximum?: number
  minItems?: number
  maxItems?: number
}

export type SkillValidationIssue = {
  path: string
  message: string
}

export type SkillManifest = {
  name: string
  version: string
  description: string
  deterministic: boolean
  inputSchema: SkillSchema
  outputSchema: SkillSchema
  implementation: string
  manifestPath: string
  skillDir: string
  implementationPath: string
  id: string
}

export type SkillExecutionContext = {
  skill?: {
    id: string
    name: string
    version: string
    deterministic: boolean
    manifestPath: string
  }
}
