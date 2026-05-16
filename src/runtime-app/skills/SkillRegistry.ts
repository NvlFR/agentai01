import path from 'node:path'
import type {
  SkillExecutionContext,
  SkillManifest,
  SkillSchema,
  SkillValidationIssue,
} from './types.js'

type SkillErrorOptions = {
  code?: string
  cause?: unknown
  details?: unknown
  available?: string[]
  version?: string
}

type SkillRegistryErrorType = Error & {
  code: string
  details?: unknown
}

type SkillRegistryErrorConstructor = new (
  message: string,
  options?: SkillErrorOptions,
) => SkillRegistryErrorType

type SkillInputValidationErrorConstructor = new (
  skillName: string,
  issues: SkillValidationIssue[],
  options?: SkillErrorOptions,
) => SkillRegistryErrorType & { issues: SkillValidationIssue[] }

type SkillNotFoundErrorConstructor = new (
  name: string,
  options?: SkillErrorOptions,
) => SkillRegistryErrorType

type CoreModule = {
  SkillExecutionError: SkillRegistryErrorConstructor
  SkillInputValidationError: SkillInputValidationErrorConstructor
  SkillManifestValidationError: SkillRegistryErrorConstructor
  SkillNotFoundError: SkillNotFoundErrorConstructor
  SkillRegistryError: SkillRegistryErrorConstructor
  discoverSkillManifests(rootDir: string): Promise<SkillManifest[]>
  executeSkillManifest(
    manifest: SkillManifest,
    input: unknown,
    context?: SkillExecutionContext,
  ): Promise<unknown>
  groupSkillManifests(manifests: readonly SkillManifest[]): Map<string, SkillManifest[]>
  resolveSkillManifest(
    groupedManifests: ReadonlyMap<string, readonly SkillManifest[]>,
    name: string,
    versionSelector?: string,
  ): SkillManifest
  validateValueAgainstSchema(
    schema: SkillSchema,
    value: unknown,
    valuePath?: string,
  ): SkillValidationIssue[]
}

const coreModuleHref = new URL('./core.mjs', import.meta.url).href
const core = (await import(coreModuleHref)) as CoreModule

export type SkillExecuteOptions = {
  version?: string
  context?: SkillExecutionContext
}

export type SkillLookupOptions = {
  version?: string
}

export type SkillDescriptor = {
  id: string
  name: string
  version: string
  description: string
  deterministic: boolean
  manifestPath: string
  inputSchema: SkillSchema
  outputSchema: SkillSchema
}

function toDescriptor(manifest: SkillManifest): SkillDescriptor {
  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    deterministic: manifest.deterministic,
    manifestPath: path.relative(process.cwd(), manifest.manifestPath),
    inputSchema: structuredClone(manifest.inputSchema),
    outputSchema: structuredClone(manifest.outputSchema),
  }
}

export class SkillRegistry {
  private readonly rootDir: string
  private manifests: SkillManifest[] = []
  private manifestsByName: Map<string, SkillManifest[]> = new Map()

  constructor(rootDir = path.resolve(process.cwd(), 'skills')) {
    this.rootDir = path.resolve(rootDir)
  }

  static async create(rootDir?: string): Promise<SkillRegistry> {
    const registry = new SkillRegistry(rootDir)
    await registry.refresh()
    return registry
  }

  async refresh(): Promise<void> {
    const manifests = await discoverSkillManifests(this.rootDir)
    const seenIds = new Map<string, string>()

    for (const manifest of manifests) {
      const previousPath = seenIds.get(manifest.id)
      if (previousPath) {
        throw new SkillManifestValidationError(
          `Duplicate skill version detected for ${manifest.id}: ${previousPath} and ${manifest.manifestPath}.`,
          { details: { previousPath, currentPath: manifest.manifestPath } },
        )
      }
      seenIds.set(manifest.id, manifest.manifestPath)
    }

    this.manifests = manifests
    this.manifestsByName = groupSkillManifests(manifests)
  }

  getRootDir(): string {
    return this.rootDir
  }

  list(): SkillDescriptor[] {
    return this.manifests.map(toDescriptor)
  }

  listNames(): string[] {
    return Array.from(this.manifestsByName.keys()).sort()
  }

  has(name: string, options?: SkillLookupOptions): boolean {
    try {
      this.resolve(name, options)
      return true
    } catch (error) {
      if (error instanceof SkillNotFoundError) {
        return false
      }
      throw error
    }
  }

  get(name: string, options?: SkillLookupOptions): SkillDescriptor | null {
    try {
      return toDescriptor(this.resolve(name, options))
    } catch (error) {
      if (error instanceof SkillNotFoundError) {
        return null
      }
      throw error
    }
  }

  validateInput(name: string, input: unknown, options?: SkillLookupOptions): SkillValidationIssue[] {
    const manifest = this.resolve(name, options)
    return validateValueAgainstSchema(manifest.inputSchema, input, '$input')
  }

  async execute(name: string, input: unknown, options?: SkillExecuteOptions): Promise<unknown> {
    const manifest = this.resolve(name, options)
    const issues = validateValueAgainstSchema(manifest.inputSchema, input, '$input')
    if (issues.length > 0) {
      throw new SkillInputValidationError(manifest.id, issues, {
        details: { manifestPath: manifest.manifestPath },
      })
    }
    return executeSkillManifest(manifest, input, options?.context)
  }

  private resolve(name: string, options?: SkillLookupOptions): SkillManifest {
    return resolveSkillManifest(this.manifestsByName, name, options?.version)
  }
}

const {
  SkillExecutionError,
  SkillInputValidationError,
  SkillManifestValidationError,
  SkillNotFoundError,
  SkillRegistryError,
  discoverSkillManifests,
  executeSkillManifest,
  groupSkillManifests,
  resolveSkillManifest,
  validateValueAgainstSchema,
} = core

export {
  SkillExecutionError,
  SkillInputValidationError,
  SkillManifestValidationError,
  SkillNotFoundError,
  SkillRegistryError,
}
