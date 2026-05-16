#!/usr/bin/env node

import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {
  discoverSkillManifests,
  executeSkillManifest,
  formatIssues,
  groupSkillManifests,
  loadSkillManifest,
  resolveSkillManifest,
  validateValueAgainstSchema,
} from '../src/runtime-app/skills/core.mjs'

const SKILLS_ROOT = path.resolve(process.cwd(), 'skills')

async function main() {
  const [command, ...args] = process.argv.slice(2)

  switch (command) {
    case 'init':
      await handleInit(args)
      return
    case 'validate':
      await handleValidate(args)
      return
    case 'run':
      await handleRun(args)
      return
    default:
      printHelp()
      process.exitCode = command ? 1 : 0
  }
}

async function handleInit(args) {
  const skillName = args[0]
  if (!skillName) {
    throw new Error('Usage: init <skill-name> [--description "..."] [--non-deterministic]')
  }

  const description = readOption(args, '--description') ?? 'Describe the skill.'
  const deterministic = !args.includes('--non-deterministic')
  const skillDir = path.join(SKILLS_ROOT, skillName)

  await mkdir(skillDir, { recursive: false })

  const manifest = {
    name: skillName,
    version: '1.0.0',
    description,
    deterministic,
    implementation: './index.mjs',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', minLength: 1 },
      },
      required: ['text'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', minLength: 1 },
      },
      required: ['text'],
      additionalProperties: false,
    },
  }

  await writeFile(path.join(skillDir, 'skill.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  await writeFile(
    path.join(skillDir, 'index.mjs'),
    `export async function execute(input) {\n  return { text: input.text }\n}\n`,
  )
  await writeFile(
    path.join(skillDir, 'index.test.ts'),
    `import { describe, expect, it } from 'bun:test'\nimport { execute } from './index.mjs'\n\ndescribe('${skillName} skill', () => {\n  it('returns expected output', async () => {\n    await expect(execute({ text: 'hello' })).resolves.toEqual({ text: 'hello' })\n  })\n})\n`,
  )

  console.log(`Created skill template in ${path.relative(process.cwd(), skillDir)}`)
  await validateSkillDir(skillDir)
}

async function handleValidate(args) {
  const target = args[0] ? path.resolve(process.cwd(), args[0]) : SKILLS_ROOT
  const watchMode = args.includes('--watch')

  await validateTarget(target)

  if (!watchMode) {
    return
  }

  console.log(`Watching ${path.relative(process.cwd(), target)} for changes...`)
  let lastStamp = await getMtime(target)
  while (true) {
    await sleep(300)
    const nextStamp = await getMtime(target)
    if (nextStamp !== lastStamp) {
      lastStamp = nextStamp
      try {
        await validateTarget(target)
      } catch (error) {
        printError(error)
      }
    }
  }
}

async function handleRun(args) {
  const skillName = args[0]
  if (!skillName) {
    throw new Error('Usage: run <skill-name> --input \'{"text":"hello"}\' [--version 1.0.0]')
  }

  const rawInput = readOption(args, '--input')
  if (!rawInput) {
    throw new Error('Missing required --input JSON payload.')
  }

  let input
  try {
    input = JSON.parse(rawInput)
  } catch (error) {
    throw new Error(`Input is not valid JSON: ${error instanceof Error ? error.message : 'unknown error'}`)
  }

  const version = readOption(args, '--version') ?? undefined
  const manifests = await discoverSkillManifests(SKILLS_ROOT)
  const manifest = resolveSkillManifest(groupSkillManifests(manifests), skillName, version)
  const issues = validateValueAgainstSchema(manifest.inputSchema, input, '$input')
  if (issues.length > 0) {
    throw new Error(`Input validation failed: ${formatIssues(issues)}`)
  }

  const output = await executeSkillManifest(manifest, input)
  console.log(JSON.stringify(output, null, 2))
}

async function validateTarget(target) {
  const targetStat = await stat(target)
  if (targetStat.isDirectory() && path.basename(target) !== 'skills') {
    await validateSkillDir(target)
    return
  }

  const listed = await discoverSkillManifests(target)
  console.log(`Validated ${listed.length} skill manifest(s) from ${path.relative(process.cwd(), target)}`)
}

async function validateSkillDir(skillDir) {
  const manifest = await loadSkillManifest(path.join(skillDir, 'skill.json'))
  const manifests = await discoverSkillManifests(path.dirname(skillDir))
  const grouped = groupSkillManifests(manifests)
  const matched = resolveSkillManifest(grouped, manifest.name, manifest.version)
  if (!matched || matched.manifestPath !== manifest.manifestPath) {
    throw new Error(`Skill ${manifest.id} was not discoverable by SkillRegistry.`)
  }
  console.log(`Validated ${manifest.id} (${path.relative(process.cwd(), skillDir)})`)
}

async function getMtime(target) {
  const targetStat = await stat(target)
  if (targetStat.isFile()) {
    return targetStat.mtimeMs
  }

  let newest = targetStat.mtimeMs
  for await (const entry of walkTree(target)) {
    newest = Math.max(newest, entry)
  }
  return newest
}

async function* walkTree(rootDir) {
  const entries = await readdir(rootDir, { withFileTypes: true })
  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      yield* walkTree(entryPath)
      continue
    }
    try {
      const entryStat = await stat(entryPath)
      yield entryStat.mtimeMs
    } catch {
      // ignore deleted files between scans
    }
  }
}

function sleep(delayMs) {
  return new Promise(resolve => setTimeout(resolve, delayMs))
}

function readOption(args, flag) {
  const index = args.indexOf(flag)
  if (index === -1) return null
  return args[index + 1] ?? null
}

function printHelp() {
  console.log(`Skill Workshop

Commands:
  init <skill-name> [--description "..."] [--non-deterministic]
  validate [skills|skills/<skill-dir>] [--watch]
  run <skill-name> --input '{"text":"hello"}' [--version 1.0.0]
`)
}

function printError(error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
}

main().catch(error => {
  printError(error)
  process.exitCode = 1
})
