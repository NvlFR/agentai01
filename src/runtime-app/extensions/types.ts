export type ExtensionKind =
  | 'skill_registry'
  | 'tts_provider'
  | 'image_provider'
  | 'video_provider'
  | 'search_tool'
  | 'operator_tool'
  | 'qa_tool'
  | 'authoring_tool'

export type ExtensionRiskProfile = 'low' | 'medium' | 'high'

export type ExtensionAvailability = 'enabled' | 'disabled' | 'misconfigured'

export type ExtensionValidationIssue = {
  field: string
  message: string
}

export type ExtensionContract = {
  id: string
  kind: ExtensionKind
  description: string
  defaultEnabled: boolean
  riskProfile: ExtensionRiskProfile
  requiredEnv: string[]
  optionalEnv?: string[]
  enabledBy?: string[]
  validate(env: Record<string, string | undefined>): ExtensionValidationIssue[]
  sanitizeConfig(env: Record<string, string | undefined>): Record<string, unknown>
}

export type ExtensionSnapshot = {
  id: string
  kind: ExtensionKind
  description: string
  defaultEnabled: boolean
  enabled: boolean
  status: ExtensionAvailability
  riskProfile: ExtensionRiskProfile
  requiredEnv: string[]
  optionalEnv: string[]
  issues: ExtensionValidationIssue[]
  config: Record<string, unknown>
}
