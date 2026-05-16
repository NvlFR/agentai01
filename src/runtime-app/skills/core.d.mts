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

export class SkillRegistryError extends Error {
  code: string
  details?: unknown
}

export class SkillManifestValidationError extends SkillRegistryError {}

export class SkillNotFoundError extends SkillRegistryError {}

export class SkillInputValidationError extends SkillRegistryError {
  issues: SkillValidationIssue[]
}

export class SkillExecutionError extends SkillRegistryError {}

export function compareVersions(left: string, right: string): number
export function formatIssues(issues: SkillValidationIssue[]): string
export function normalizeSkillManifest(rawManifest: unknown, manifestPath: string): SkillManifest
export function loadSkillManifest(manifestPath: string): Promise<SkillManifest>
export function discoverSkillManifests(rootDir: string): Promise<SkillManifest[]>
export function groupSkillManifests(manifests: readonly SkillManifest[]): Map<string, SkillManifest[]>
export function resolveSkillManifest(
  groupedManifests: ReadonlyMap<string, readonly SkillManifest[]>,
  name: string,
  versionSelector?: string,
): SkillManifest
export function validateValueAgainstSchema(
  schema: SkillSchema,
  value: unknown,
  valuePath?: string,
): SkillValidationIssue[]
export function loadSkillExecutor(
  manifest: SkillManifest,
): Promise<(input: unknown, context?: SkillExecutionContext) => Promise<unknown> | unknown>
export function executeSkillManifest(
  manifest: SkillManifest,
  input: unknown,
  context?: SkillExecutionContext,
): Promise<unknown>
