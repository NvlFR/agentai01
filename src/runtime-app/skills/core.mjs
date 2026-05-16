import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export class SkillRegistryError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'SkillRegistryError'
    this.code = options.code ?? 'skill_registry_error'
    this.cause = options.cause
    this.details = options.details
  }
}

export class SkillManifestValidationError extends SkillRegistryError {
  constructor(message, options = {}) {
    super(message, { ...options, code: 'invalid_manifest' })
    this.name = 'SkillManifestValidationError'
  }
}

export class SkillNotFoundError extends SkillRegistryError {
  constructor(name, options = {}) {
    const available = Array.isArray(options.available) && options.available.length > 0
      ? ` Available skills: ${options.available.join(', ')}.`
      : ''
    const version = typeof options.version === 'string' ? `@${options.version}` : ''
    super(`Skill not found: ${name}${version}.${available}`, {
      ...options,
      code: 'skill_not_found',
    })
    this.name = 'SkillNotFoundError'
  }
}

export class SkillInputValidationError extends SkillRegistryError {
  constructor(skillName, issues, options = {}) {
    super(`Invalid input for skill ${skillName}: ${formatIssues(issues)}`, {
      ...options,
      code: 'invalid_input',
      details: { issues },
    })
    this.name = 'SkillInputValidationError'
    this.issues = issues
  }
}

export class SkillExecutionError extends SkillRegistryError {
  constructor(skillName, message, options = {}) {
    super(`Skill execution failed for ${skillName}: ${message}`, {
      ...options,
      code: 'execution_failed',
    })
    this.name = 'SkillExecutionError'
  }
}

export function formatIssues(issues) {
  return issues.map(issue => `${issue.path}: ${issue.message}`).join('; ')
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function ensurePlainObject(value, label, manifestPath) {
  if (!isPlainObject(value)) {
    throw new SkillManifestValidationError(
      `${label} must be a JSON object in ${manifestPath}.`,
      { details: { manifestPath, field: label } },
    )
  }
}

function toPosixPath(value) {
  return value.split(path.sep).join(path.posix.sep)
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(version)
  if (!match) return null

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
  }
}

export function compareVersions(left, right) {
  const a = parseVersion(left)
  const b = parseVersion(right)
  if (!a || !b) {
    return left.localeCompare(right)
  }

  if (a.major !== b.major) return a.major - b.major
  if (a.minor !== b.minor) return a.minor - b.minor
  if (a.patch !== b.patch) return a.patch - b.patch
  if (a.prerelease === b.prerelease) return 0
  if (a.prerelease === null) return 1
  if (b.prerelease === null) return -1
  return a.prerelease.localeCompare(b.prerelease)
}

function matchesVersionSelector(version, selector) {
  if (!selector) return true
  if (version === selector) return true

  const parsedVersion = parseVersion(version)
  if (!parsedVersion) return false

  const operatorMatch = /^(>=|<=|>|<|\^|~)(.+)$/.exec(selector)
  if (!operatorMatch) return false

  const base = parseVersion(operatorMatch[2])
  if (!base) return false

  const comparison = compareVersions(version, operatorMatch[2])
  switch (operatorMatch[1]) {
    case '>':
      return comparison > 0
    case '>=':
      return comparison >= 0
    case '<':
      return comparison < 0
    case '<=':
      return comparison <= 0
    case '^':
      return parsedVersion.major === base.major && comparison >= 0
    case '~':
      return (
        parsedVersion.major === base.major &&
        parsedVersion.minor === base.minor &&
        comparison >= 0
      )
    default:
      return false
  }
}

function normalizeSchema(schema, manifestPath, field) {
  ensurePlainObject(schema, field, manifestPath)
  return structuredClone(schema)
}

export function normalizeSkillManifest(rawManifest, manifestPath) {
  ensurePlainObject(rawManifest, 'skill manifest', manifestPath)

  const requiredFields = [
    'name',
    'version',
    'description',
    'deterministic',
    'inputSchema',
    'outputSchema',
    'implementation',
  ]

  for (const field of requiredFields) {
    if (!(field in rawManifest)) {
      throw new SkillManifestValidationError(
        `Missing required field "${field}" in ${manifestPath}.`,
        { details: { manifestPath, field } },
      )
    }
  }

  const { name, version, description, deterministic, implementation } = rawManifest

  if (typeof name !== 'string' || name.trim() === '') {
    throw new SkillManifestValidationError(`Field "name" must be a non-empty string in ${manifestPath}.`)
  }

  if (typeof description !== 'string' || description.trim() === '') {
    throw new SkillManifestValidationError(
      `Field "description" must be a non-empty string in ${manifestPath}.`,
    )
  }

  if (typeof deterministic !== 'boolean') {
    throw new SkillManifestValidationError(
      `Field "deterministic" must be a boolean in ${manifestPath}.`,
    )
  }

  if (typeof implementation !== 'string' || implementation.trim() === '') {
    throw new SkillManifestValidationError(
      `Field "implementation" must be a non-empty string in ${manifestPath}.`,
    )
  }

  if (!parseVersion(version)) {
    throw new SkillManifestValidationError(
      `Field "version" must follow semver (x.y.z) in ${manifestPath}.`,
    )
  }

  const skillDir = path.dirname(manifestPath)
  const implementationPath = path.resolve(skillDir, implementation)
  const relativeImplementationPath = path.relative(skillDir, implementationPath)
  if (
    relativeImplementationPath === '' ||
    relativeImplementationPath.startsWith('..') ||
    path.isAbsolute(relativeImplementationPath)
  ) {
    throw new SkillManifestValidationError(
      `Implementation path must stay inside the skill directory for ${manifestPath}.`,
      { details: { manifestPath, implementation } },
    )
  }

  return {
    name,
    version,
    description,
    deterministic,
    inputSchema: normalizeSchema(rawManifest.inputSchema, manifestPath, 'inputSchema'),
    outputSchema: normalizeSchema(rawManifest.outputSchema, manifestPath, 'outputSchema'),
    implementation,
    manifestPath,
    skillDir,
    implementationPath,
    id: `${name}@${version}`,
  }
}

export async function loadSkillManifest(manifestPath) {
  let rawText
  try {
    rawText = await readFile(manifestPath, 'utf8')
  } catch (error) {
    throw new SkillManifestValidationError(`Unable to read manifest ${manifestPath}.`, {
      cause: error,
      details: { manifestPath },
    })
  }

  let parsed
  try {
    parsed = JSON.parse(rawText)
  } catch (error) {
    throw new SkillManifestValidationError(`Manifest is not valid JSON: ${manifestPath}.`, {
      cause: error,
      details: { manifestPath },
    })
  }

  return normalizeSkillManifest(parsed, manifestPath)
}

export async function discoverSkillManifests(rootDir) {
  const manifests = []
  const pending = [path.resolve(rootDir)]

  while (pending.length > 0) {
    const currentDir = pending.pop()
    let entries
    try {
      entries = await readdir(currentDir, { withFileTypes: true })
    } catch (error) {
      throw new SkillRegistryError(`Unable to read skills directory ${currentDir}.`, {
        code: 'skill_discovery_failed',
        cause: error,
        details: { rootDir: currentDir },
      })
    }

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.git')) {
        continue
      }

      const entryPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        pending.push(entryPath)
        continue
      }

      if (entry.isFile() && entry.name === 'skill.json') {
        manifests.push(await loadSkillManifest(entryPath))
      }
    }
  }

  manifests.sort((left, right) => {
    const nameOrder = left.name.localeCompare(right.name)
    if (nameOrder !== 0) return nameOrder
    return compareVersions(right.version, left.version)
  })

  return manifests
}

export function groupSkillManifests(manifests) {
  const grouped = new Map()
  for (const manifest of manifests) {
    const bucket = grouped.get(manifest.name) ?? []
    bucket.push(manifest)
    bucket.sort((left, right) => compareVersions(right.version, left.version))
    grouped.set(manifest.name, bucket)
  }
  return grouped
}

export function resolveSkillManifest(groupedManifests, name, versionSelector) {
  const versions = groupedManifests.get(name)
  if (!versions || versions.length === 0) {
    throw new SkillNotFoundError(name, {
      version: versionSelector,
      available: Array.from(groupedManifests.keys()).sort(),
    })
  }

  if (!versionSelector) {
    return versions[0]
  }

  const resolved = versions.find(manifest => matchesVersionSelector(manifest.version, versionSelector))
  if (!resolved) {
    throw new SkillNotFoundError(name, {
      version: versionSelector,
      available: versions.map(manifest => `${manifest.name}@${manifest.version}`),
    })
  }

  return resolved
}

export function validateValueAgainstSchema(schema, value, valuePath = '$') {
  const issues = []
  validateValue(schema, value, valuePath, issues)
  return issues
}

function validateValue(schema, value, valuePath, issues) {
  if (!isPlainObject(schema)) {
    issues.push({ path: valuePath, message: 'schema must be a JSON object' })
    return
  }

  if ('const' in schema && value !== schema.const) {
    issues.push({ path: valuePath, message: `must equal ${JSON.stringify(schema.const)}` })
    return
  }

  if (Array.isArray(schema.enum) && !schema.enum.some(item => Object.is(item, value))) {
    issues.push({
      path: valuePath,
      message: `must be one of ${schema.enum.map(item => JSON.stringify(item)).join(', ')}`,
    })
    return
  }

  const declaredType = typeof schema.type === 'string'
    ? schema.type
    : isPlainObject(schema.properties) || Array.isArray(schema.required)
      ? 'object'
      : undefined

  if (!declaredType) {
    return
  }

  switch (declaredType) {
    case 'string':
      if (typeof value !== 'string') {
        issues.push({ path: valuePath, message: 'must be a string' })
        return
      }
      if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
        issues.push({ path: valuePath, message: `must have at least ${schema.minLength} characters` })
      }
      if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) {
        issues.push({ path: valuePath, message: `must have at most ${schema.maxLength} characters` })
      }
      if (typeof schema.pattern === 'string' && !(new RegExp(schema.pattern).test(value))) {
        issues.push({ path: valuePath, message: `must match pattern ${schema.pattern}` })
      }
      return
    case 'number':
      if (typeof value !== 'number' || Number.isNaN(value)) {
        issues.push({ path: valuePath, message: 'must be a number' })
        return
      }
      validateNumberRange(schema, value, valuePath, issues)
      return
    case 'integer':
      if (!Number.isInteger(value)) {
        issues.push({ path: valuePath, message: 'must be an integer' })
        return
      }
      validateNumberRange(schema, value, valuePath, issues)
      return
    case 'boolean':
      if (typeof value !== 'boolean') {
        issues.push({ path: valuePath, message: 'must be a boolean' })
      }
      return
    case 'null':
      if (value !== null) {
        issues.push({ path: valuePath, message: 'must be null' })
      }
      return
    case 'array':
      if (!Array.isArray(value)) {
        issues.push({ path: valuePath, message: 'must be an array' })
        return
      }
      if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
        issues.push({ path: valuePath, message: `must contain at least ${schema.minItems} items` })
      }
      if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) {
        issues.push({ path: valuePath, message: `must contain at most ${schema.maxItems} items` })
      }
      if (schema.items) {
        value.forEach((entry, index) => validateValue(schema.items, entry, `${valuePath}[${index}]`, issues))
      }
      return
    case 'object':
      if (!isPlainObject(value)) {
        issues.push({ path: valuePath, message: 'must be an object' })
        return
      }

      const required = Array.isArray(schema.required) ? schema.required : []
      const properties = isPlainObject(schema.properties) ? schema.properties : {}

      for (const field of required) {
        if (!(field in value)) {
          issues.push({ path: `${valuePath}.${field}`, message: 'is required' })
        }
      }

      for (const [field, nestedSchema] of Object.entries(properties)) {
        if (field in value) {
          validateValue(nestedSchema, value[field], `${valuePath}.${field}`, issues)
        }
      }

      if (schema.additionalProperties === false) {
        for (const field of Object.keys(value)) {
          if (!(field in properties)) {
            issues.push({ path: `${valuePath}.${field}`, message: 'is not allowed' })
          }
        }
      }
      return
    default:
      issues.push({ path: valuePath, message: `unsupported schema type ${declaredType}` })
  }
}

function validateNumberRange(schema, value, valuePath, issues) {
  if (typeof schema.minimum === 'number' && value < schema.minimum) {
    issues.push({ path: valuePath, message: `must be >= ${schema.minimum}` })
  }
  if (typeof schema.maximum === 'number' && value > schema.maximum) {
    issues.push({ path: valuePath, message: `must be <= ${schema.maximum}` })
  }
}

export async function loadSkillExecutor(manifest) {
  let imported
  try {
    imported = await import(pathToFileURL(manifest.implementationPath).href)
  } catch (error) {
    throw new SkillExecutionError(manifest.name, `unable to load implementation ${manifest.implementation}.`, {
      cause: error,
      details: { implementationPath: manifest.implementationPath },
    })
  }

  const execute = typeof imported.execute === 'function'
    ? imported.execute
    : typeof imported.default === 'function'
      ? imported.default
      : typeof imported.default?.execute === 'function'
        ? imported.default.execute
        : null

  if (!execute) {
    throw new SkillExecutionError(
      manifest.name,
      `implementation ${manifest.implementation} must export an execute function.`,
      { details: { implementationPath: manifest.implementationPath } },
    )
  }

  return execute
}

export async function executeSkillManifest(manifest, input, context = {}) {
  const inputIssues = validateValueAgainstSchema(manifest.inputSchema, input, '$input')
  if (inputIssues.length > 0) {
    throw new SkillInputValidationError(manifest.id, inputIssues, {
      details: { manifestPath: manifest.manifestPath },
    })
  }

  const execute = await loadSkillExecutor(manifest)

  let output
  try {
    output = await execute(structuredClone(input), {
      skill: {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        deterministic: manifest.deterministic,
        manifestPath: toPosixPath(path.relative(process.cwd(), manifest.manifestPath)),
      },
      ...context,
    })
  } catch (error) {
    throw new SkillExecutionError(
      manifest.id,
      error instanceof Error ? error.message : 'unknown execution error',
      {
        cause: error,
        details: { manifestPath: manifest.manifestPath },
      },
    )
  }

  const outputIssues = validateValueAgainstSchema(manifest.outputSchema, output, '$output')
  if (outputIssues.length > 0) {
    throw new SkillExecutionError(manifest.id, `output schema mismatch: ${formatIssues(outputIssues)}`, {
      details: { manifestPath: manifest.manifestPath, issues: outputIssues },
    })
  }

  return output
}
