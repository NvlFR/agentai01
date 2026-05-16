import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { SkillInputValidationError, SkillManifestValidationError, SkillNotFoundError, SkillRegistry } from './SkillRegistry.js'

async function createTempSkill(
  rootDir: string,
  options: {
    dirName: string
    name: string
    version: string
    implementationSource?: string
    inputSchema?: Record<string, unknown>
    outputSchema?: Record<string, unknown>
    deterministic?: boolean
  },
): Promise<void> {
  const skillDir = path.join(rootDir, options.dirName)
  await mkdir(skillDir, { recursive: true })
  await writeFile(
    path.join(skillDir, 'skill.json'),
    JSON.stringify(
      {
        name: options.name,
        version: options.version,
        description: `${options.name} ${options.version}`,
        deterministic: options.deterministic ?? true,
        implementation: './index.mjs',
        inputSchema: options.inputSchema ?? {
          type: 'object',
          properties: { value: { type: 'string' } },
          required: ['value'],
          additionalProperties: false,
        },
        outputSchema: options.outputSchema ?? {
          type: 'object',
          properties: { value: { type: 'string' }, version: { type: 'string' } },
          required: ['value', 'version'],
          additionalProperties: false,
        },
      },
      null,
      2,
    ),
  )
  await writeFile(
    path.join(skillDir, 'index.mjs'),
    options.implementationSource ??
      `export async function execute(input) {
  return { value: input.value, version: '${options.version}' }
}
`,
  )
}

describe('SkillRegistry', () => {
  const tempDirs: string[] = []

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
  })

  it('discovers the sample skill from skills/ and executes it', async () => {
    const registry = await SkillRegistry.create(path.resolve(process.cwd(), 'skills'))

    expect(registry.has('echo-text')).toBe(true)

    const output = await registry.execute('echo-text', { text: 'halo', uppercase: true })
    expect(output).toEqual({
      text: 'HALO',
      original: 'halo',
      characterCount: 4,
    })
  })

  it('resolves the latest compatible version by default and supports selectors', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'skill-registry-'))
    tempDirs.push(rootDir)

    await createTempSkill(rootDir, { dirName: 'formatter-v1', name: 'formatter', version: '1.0.0' })
    await createTempSkill(rootDir, { dirName: 'formatter-v1-2', name: 'formatter', version: '1.2.0' })
    await createTempSkill(rootDir, { dirName: 'formatter-v2', name: 'formatter', version: '2.0.0' })

    const registry = await SkillRegistry.create(rootDir)

    expect(await registry.execute('formatter', { value: 'latest' })).toEqual({
      value: 'latest',
      version: '2.0.0',
    })
    expect(await registry.execute('formatter', { value: 'caret' }, { version: '^1.0.0' })).toEqual({
      value: 'caret',
      version: '1.2.0',
    })
    expect(await registry.execute('formatter', { value: 'exact' }, { version: '1.0.0' })).toEqual({
      value: 'exact',
      version: '1.0.0',
    })
  })

  it('returns descriptive not found errors with available skills', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'skill-registry-'))
    tempDirs.push(rootDir)
    await createTempSkill(rootDir, { dirName: 'formatter', name: 'formatter', version: '1.0.0' })

    const registry = await SkillRegistry.create(rootDir)

    expect(() => registry.get('missing')).not.toThrow()

    await expect(registry.execute('missing', {})).rejects.toThrow(SkillNotFoundError)
    await expect(registry.execute('missing', {})).rejects.toThrow(
      'Skill not found: missing. Available skills: formatter.',
    )
  })

  it('validates input schema before execution and reports issue locations', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'skill-registry-'))
    tempDirs.push(rootDir)
    await createTempSkill(rootDir, { dirName: 'formatter', name: 'formatter', version: '1.0.0' })

    const registry = await SkillRegistry.create(rootDir)

    await expect(registry.execute('formatter', { extra: true })).rejects.toThrow(SkillInputValidationError)
    await expect(registry.execute('formatter', { extra: true })).rejects.toThrow(
      'Invalid input for skill formatter@1.0.0: $input.value: is required; $input.extra: is not allowed',
    )
  })

  it('fails discovery for duplicate name/version pairs', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'skill-registry-'))
    tempDirs.push(rootDir)
    await createTempSkill(rootDir, { dirName: 'formatter-a', name: 'formatter', version: '1.0.0' })
    await createTempSkill(rootDir, { dirName: 'formatter-b', name: 'formatter', version: '1.0.0' })

    await expect(SkillRegistry.create(rootDir)).rejects.toThrow(SkillManifestValidationError)
    await expect(SkillRegistry.create(rootDir)).rejects.toThrow(
      'Duplicate skill version detected for formatter@1.0.0',
    )
  })

  it('rejects implementation paths that escape the skill directory', async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), 'skill-registry-'))
    tempDirs.push(rootDir)
    const skillDir = path.join(rootDir, 'formatter')
    await mkdir(skillDir, { recursive: true })
    await writeFile(
      path.join(skillDir, 'skill.json'),
      JSON.stringify(
        {
          name: 'formatter',
          version: '1.0.0',
          description: 'bad path',
          deterministic: true,
          implementation: '../index.mjs',
          inputSchema: { type: 'object' },
          outputSchema: { type: 'object' },
        },
        null,
        2,
      ),
    )

    await expect(SkillRegistry.create(rootDir)).rejects.toThrow(SkillManifestValidationError)
    await expect(SkillRegistry.create(rootDir)).rejects.toThrow(
      'Implementation path must stay inside the skill directory',
    )
  })
})
