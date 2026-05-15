#!/usr/bin/env node

import { mkdtemp, mkdir, readFile, rm, writeFile, access, stat } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')
const DEFAULT_RUN_ROOT = path.join(os.tmpdir(), 'agentai01-qa-labs')

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value))
}

function parseArgs(argv) {
  const args = [...argv]
  const options = {
    lab: null,
    json: false,
    keepRunDir: false,
  }

  while (args.length > 0) {
    const token = args.shift()
    if (token === '--lab') {
      options.lab = args.shift() ?? null
    } else if (token === '--json') {
      options.json = true
    } else if (token === '--keep-run-dir') {
      options.keepRunDir = true
    } else if (token === '--help' || token === '-h') {
      options.help = true
    } else {
      throw new Error(`Unknown argument: ${token}`)
    }
  }

  return options
}

function printHelp() {
  console.log('Usage: node qa/lab-runner.mjs --lab <file> [--json] [--keep-run-dir]')
}

async function readJsonFile(filePath) {
  const raw = await readFile(filePath, 'utf8')
  return JSON.parse(raw)
}

export async function loadLabConfig(labFile) {
  const absolutePath = path.resolve(REPO_ROOT, labFile)
  const config = await readJsonFile(absolutePath)

  if (!isPlainObject(config)) {
    throw new Error('Lab config must be a JSON object.')
  }
  if (typeof config.name !== 'string' || config.name.length === 0) {
    throw new Error('Lab config requires a non-empty "name".')
  }
  if (!isPlainObject(config.steps)) {
    throw new Error('Lab config requires a "steps" object.')
  }

  return {
    ...config,
    __file: absolutePath,
    __dir: path.dirname(absolutePath),
  }
}

function resolveTemplate(input, context) {
  if (typeof input !== 'string') {
    return input
  }

  return input
    .replaceAll('${RUN_DIR}', context.runDir)
    .replaceAll('${LAB_DIR}', context.labDir)
    .replaceAll('${REPO_ROOT}', context.repoRoot)
}

function resolveValue(value, context) {
  if (typeof value === 'string') {
    return resolveTemplate(value, context)
  }
  if (Array.isArray(value)) {
    return value.map(item => resolveValue(item, context))
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveValue(item, context)]),
    )
  }

  return value
}

async function pathExists(targetPath) {
  try {
    await access(targetPath, fsConstants.F_OK)
    return true
  } catch {
    return false
  }
}

async function ensureParentDir(targetPath) {
  await mkdir(path.dirname(targetPath), { recursive: true })
}

async function createFileRollback(targetPath) {
  const existed = await pathExists(targetPath)
  if (!existed) {
    return async () => {
      await rm(targetPath, { force: true })
    }
  }

  const previousContent = await readFile(targetPath)
  return async () => {
    await ensureParentDir(targetPath)
    await writeFile(targetPath, previousContent)
  }
}

function toEnvValue(value) {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return JSON.stringify(value)
}

async function runCommand(command, options) {
  if (!Array.isArray(command) || command.length === 0) {
    throw new Error('Command step requires a non-empty "command" array.')
  }

  return await new Promise((resolve, reject) => {
    const child = spawn(command[0], command.slice(1), {
      cwd: options.cwd,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', chunk => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', chunk => {
      stderr += chunk.toString()
    })

    child.on('error', reject)
    child.on('close', code => {
      resolve({ code: code ?? 1, stdout, stderr })
    })
  })
}

function getLabPhases(config) {
  const steps = config.steps
  return {
    setup: Array.isArray(steps.setup) ? steps.setup : [],
    run: Array.isArray(steps.run) ? steps.run : [],
    teardown: Array.isArray(steps.teardown) ? steps.teardown : [],
  }
}

function createRunContext(config, runDir, options = {}) {
  const env = { ...process.env }
  const runId = path.basename(runDir)
  const context = {
    config,
    repoRoot: REPO_ROOT,
    labDir: config.__dir,
    runDir,
    runId,
    env,
    events: [],
    keepRunDir: options.keepRunDir === true,
  }

  context.env.QA_LAB_NAME = config.name
  context.env.QA_LAB_RUN_ID = runId
  context.env.QA_LAB_RUN_DIR = runDir

  return context
}

function buildStepLabel(step, index, phase) {
  const type = typeof step?.type === 'string' ? step.type : 'unknown'
  return `${phase}[${index}] ${type}`
}

async function executeLabStep(step, context, phase, index) {
  const label = buildStepLabel(step, index, phase)
  const resolvedStep = resolveValue(step, context)

  if (!isPlainObject(resolvedStep) || typeof resolvedStep.type !== 'string') {
    throw new Error(`${label}: invalid step shape.`)
  }

  if (resolvedStep.type === 'seed-json') {
    if (typeof resolvedStep.path !== 'string') {
      throw new Error(`${label}: seed-json requires "path".`)
    }

    const targetPath = path.resolve(resolvedStep.path)
    const rollback = await createFileRollback(targetPath)
    await ensureParentDir(targetPath)
    await writeFile(targetPath, `${JSON.stringify(resolvedStep.value ?? null, null, 2)}\n`, 'utf8')
    context.events.push({ phase, index, type: 'seed-json', path: targetPath })
    return {
      rollback,
      details: { path: targetPath },
    }
  }

  if (resolvedStep.type === 'seed-text') {
    if (typeof resolvedStep.path !== 'string' || typeof resolvedStep.content !== 'string') {
      throw new Error(`${label}: seed-text requires "path" and "content".`)
    }

    const targetPath = path.resolve(resolvedStep.path)
    const rollback = await createFileRollback(targetPath)
    await ensureParentDir(targetPath)
    await writeFile(targetPath, resolvedStep.content, 'utf8')
    context.events.push({ phase, index, type: 'seed-text', path: targetPath })
    return {
      rollback,
      details: { path: targetPath },
    }
  }

  if (resolvedStep.type === 'mock-service') {
    if (typeof resolvedStep.service !== 'string' || resolvedStep.service.length === 0) {
      throw new Error(`${label}: mock-service requires "service".`)
    }

    const serviceName = resolvedStep.service.toUpperCase().replaceAll(/[^A-Z0-9]+/g, '_')
    const targetPath = path.join(context.runDir, 'mocks', `${resolvedStep.service}.json`)
    const rollback = await createFileRollback(targetPath)
    await ensureParentDir(targetPath)
    await writeFile(targetPath, `${JSON.stringify(resolvedStep.response ?? null, null, 2)}\n`, 'utf8')
    context.env[`QA_MOCK_SERVICE_${serviceName}`] = targetPath
    context.events.push({ phase, index, type: 'mock-service', service: resolvedStep.service, path: targetPath })
    return {
      rollback: async () => {
        delete context.env[`QA_MOCK_SERVICE_${serviceName}`]
        await rollback()
      },
      details: { service: resolvedStep.service, path: targetPath },
    }
  }

  if (resolvedStep.type === 'env') {
    if (!isPlainObject(resolvedStep.values)) {
      throw new Error(`${label}: env requires "values".`)
    }

    const previous = {}
    for (const [key, value] of Object.entries(resolvedStep.values)) {
      previous[key] = Object.prototype.hasOwnProperty.call(context.env, key) ? context.env[key] : undefined
      context.env[key] = toEnvValue(value)
    }

    context.events.push({ phase, index, type: 'env', keys: Object.keys(resolvedStep.values) })
    return {
      rollback: async () => {
        for (const [key, value] of Object.entries(previous)) {
          if (value === undefined) {
            delete context.env[key]
          } else {
            context.env[key] = value
          }
        }
      },
      details: { keys: Object.keys(resolvedStep.values) },
    }
  }

  if (resolvedStep.type === 'command') {
    const command = resolvedStep.command
    const cwd = typeof resolvedStep.cwd === 'string'
      ? path.resolve(resolvedStep.cwd)
      : REPO_ROOT
    const result = await runCommand(command, { cwd, env: context.env })
    context.events.push({
      phase,
      index,
      type: 'command',
      command,
      cwd,
      exitCode: result.code,
    })

    if (result.code !== 0) {
      const stderr = result.stderr.trim()
      const stdout = result.stdout.trim()
      const details = stderr.length > 0 ? stderr : stdout
      throw new Error(`${label}: command exited with ${result.code}${details ? ` — ${details}` : ''}`)
    }

    return {
      rollback: async () => {},
      details: {
        command,
        cwd,
        stdout: result.stdout.trim(),
      },
    }
  }

  if (resolvedStep.type === 'assert-file-json') {
    if (typeof resolvedStep.path !== 'string') {
      throw new Error(`${label}: assert-file-json requires "path".`)
    }

    const targetPath = path.resolve(resolvedStep.path)
    const actual = JSON.parse(await readFile(targetPath, 'utf8'))
    const expected = resolvedStep.equals ?? null
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`${label}: expected JSON ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`)
    }

    return {
      rollback: async () => {},
      details: { path: targetPath },
    }
  }

  if (resolvedStep.type === 'assert-env') {
    if (typeof resolvedStep.key !== 'string') {
      throw new Error(`${label}: assert-env requires "key".`)
    }

    const actual = context.env[resolvedStep.key]
    const expected = resolvedStep.equals
    if (actual !== expected) {
      throw new Error(`${label}: expected env ${resolvedStep.key}=${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`)
    }

    return {
      rollback: async () => {},
      details: { key: resolvedStep.key },
    }
  }

  if (resolvedStep.type === 'cleanup-path') {
    if (typeof resolvedStep.path !== 'string') {
      throw new Error(`${label}: cleanup-path requires "path".`)
    }

    const targetPath = path.resolve(resolvedStep.path)
    const existed = await pathExists(targetPath)
    const previousStats = existed ? await stat(targetPath) : null
    await rm(targetPath, { recursive: true, force: true })
    context.events.push({ phase, index, type: 'cleanup-path', path: targetPath })
    return {
      rollback: async () => {
        if (previousStats?.isDirectory()) {
          await mkdir(targetPath, { recursive: true })
        }
      },
      details: { path: targetPath },
    }
  }

  if (resolvedStep.type === 'fail') {
    throw new Error(`${label}: ${resolvedStep.message ?? 'forced failure'}`)
  }

  throw new Error(`${label}: unsupported step type "${resolvedStep.type}".`)
}

async function executePhase(phase, steps, context) {
  const results = []
  const rollbacks = []

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index]
    try {
      const result = await executeLabStep(step, context, phase, index)
      results.push({
        index,
        type: step.type,
        status: 'pass',
        details: result.details ?? null,
      })
      if (typeof result.rollback === 'function') {
        rollbacks.push(result.rollback)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      results.push({
        index,
        type: step?.type ?? 'unknown',
        status: 'fail',
        error: message,
      })
      return {
        ok: false,
        results,
        rollbacks,
        failure: {
          phase,
          index,
          type: step?.type ?? 'unknown',
          message,
        },
      }
    }
  }

  return {
    ok: true,
    results,
    rollbacks,
    failure: null,
  }
}

async function runRollback(rollbacks) {
  const results = []
  for (let index = rollbacks.length - 1; index >= 0; index -= 1) {
    try {
      await rollbacks[index]()
      results.push({ index, status: 'pass' })
    } catch (error) {
      results.push({
        index,
        status: 'fail',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
  return results
}

export async function setupLabEnvironment(config, options = {}) {
  await mkdir(DEFAULT_RUN_ROOT, { recursive: true })
  const runDir = await mkdtemp(path.join(DEFAULT_RUN_ROOT, `${config.name}-`))
  const context = createRunContext(config, runDir, options)
  await mkdir(runDir, { recursive: true })

  const phases = getLabPhases(config)
  const setupResult = await executePhase('setup', phases.setup, context)

  if (!setupResult.ok) {
    const rollback = await runRollback(setupResult.rollbacks)
    return {
      ok: false,
      context,
      phaseResults: { setup: setupResult.results, run: [], teardown: [] },
      setupFailure: setupResult.failure,
      rollback,
    }
  }

  return {
    ok: true,
    context,
    phaseResults: { setup: setupResult.results, run: [], teardown: [] },
    setupFailure: null,
    rollback: [],
    setupRollbacks: setupResult.rollbacks,
  }
}

export async function executeLabRun(setupState) {
  if (!setupState.ok) {
    return {
      ok: false,
      phaseResults: setupState.phaseResults,
      runFailure: setupState.setupFailure,
    }
  }

  const phases = getLabPhases(setupState.context.config)
  const runResult = await executePhase('run', phases.run, setupState.context)
  setupState.phaseResults.run = runResult.results

  return {
    ok: runResult.ok,
    phaseResults: setupState.phaseResults,
    runFailure: runResult.failure,
  }
}

export async function teardownLabEnvironment(setupState) {
  const teardownSteps = getLabPhases(setupState.context.config).teardown
  const teardownResult = await executePhase('teardown', teardownSteps, setupState.context)

  const rollback = setupState.setupRollbacks
    ? await runRollback(setupState.setupRollbacks)
    : []

  if (!setupState.context.keepRunDir) {
    await rm(setupState.context.runDir, { recursive: true, force: true })
  }

  setupState.phaseResults.teardown = teardownResult.results
  return {
    ok: teardownResult.ok,
    phaseResults: setupState.phaseResults,
    teardownFailure: teardownResult.failure,
    rollback,
    runDir: setupState.context.runDir,
    keptRunDir: setupState.context.keepRunDir,
  }
}

export async function runLabFile(labFile, options = {}) {
  const config = await loadLabConfig(labFile)
  const setupState = await setupLabEnvironment(config, options)
  if (!setupState.ok) {
    if (!setupState.context.keepRunDir) {
      await rm(setupState.context.runDir, { recursive: true, force: true })
    }

    return {
      ok: false,
      configName: config.name,
      runDir: setupState.context.runDir,
      keptRunDir: setupState.context.keepRunDir,
      phaseResults: setupState.phaseResults,
      failure: setupState.setupFailure,
      rollback: setupState.rollback,
      events: setupState.context.events,
    }
  }

  const runResult = await executeLabRun(setupState)
  const teardownResult = await teardownLabEnvironment(setupState)
  return {
    ok: runResult.ok && teardownResult.ok,
    configName: config.name,
    runDir: teardownResult.runDir,
    keptRunDir: teardownResult.keptRunDir,
    phaseResults: teardownResult.phaseResults,
    failure: runResult.runFailure ?? teardownResult.teardownFailure ?? null,
    rollback: teardownResult.rollback,
    events: setupState.context.events,
  }
}

function printSummary(result) {
  console.log(`QA Lab: ${result.configName}`)
  console.log(`  status: ${result.ok ? 'pass' : 'fail'}`)
  console.log(`  runDir: ${result.runDir}`)
  if (result.failure) {
    console.log(`  failure: ${result.failure.phase}[${result.failure.index}] ${result.failure.message}`)
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help || !options.lab) {
    printHelp()
    process.exit(options.help ? 0 : 1)
  }

  const result = await runLabFile(options.lab, { keepRunDir: options.keepRunDir })
  if (options.json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    printSummary(result)
  }

  process.exit(result.ok ? 0 : 1)
}

if (process.argv[1] === __filename) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
