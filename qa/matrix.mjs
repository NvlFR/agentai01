#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function parseArgs(argv) {
  const args = [...argv]
  const options = {
    config: null,
    failFast: false,
    json: false,
  }

  while (args.length > 0) {
    const token = args.shift()
    if (token === '--config') {
      options.config = args.shift() ?? null
    } else if (token === '--fail-fast') {
      options.failFast = true
    } else if (token === '--json') {
      options.json = true
    } else if (token === '--help' || token === '-h') {
      options.help = true
    } else {
      throw new Error(`Unknown argument: ${token}`)
    }
  }

  return options
}

function printHelp() {
  console.log('Usage: node qa/matrix.mjs --config <file> [--fail-fast] [--json]')
}

async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

export async function loadMatrixConfig(configFile) {
  const absolutePath = path.resolve(REPO_ROOT, configFile)
  const config = await readJsonFile(absolutePath)

  if (!isPlainObject(config)) {
    throw new Error('Matrix config must be a JSON object.')
  }
  if (typeof config.name !== 'string' || config.name.length === 0) {
    throw new Error('Matrix config requires a non-empty "name".')
  }
  if (!Array.isArray(config.command) || config.command.length === 0) {
    throw new Error('Matrix config requires a non-empty "command" array.')
  }
  if (!isPlainObject(config.dimensions)) {
    throw new Error('Matrix config requires a "dimensions" object.')
  }

  return {
    ...config,
    __file: absolutePath,
    __dir: path.dirname(absolutePath),
  }
}

function stringifyValue(value) {
  return typeof value === 'string' ? value : JSON.stringify(value)
}

export function explodeMatrix(dimensions) {
  const keys = Object.keys(dimensions).sort()
  const entries = keys.map(key => {
    const values = dimensions[key]
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error(`Matrix dimension "${key}" must be a non-empty array.`)
    }
    return [key, values]
  })

  const combinations = []

  function walk(index, current) {
    if (index === entries.length) {
      combinations.push({ ...current })
      return
    }

    const [key, values] = entries[index]
    for (const value of values) {
      current[key] = value
      walk(index + 1, current)
    }
    delete current[key]
  }

  walk(0, {})
  return combinations
}

export function buildCombinationId(combination) {
  return Object.keys(combination)
    .sort()
    .map(key => `${key}=${stringifyValue(combination[key])}`)
    .join('|')
}

function buildEnv(config, combination) {
  const env = { ...process.env }
  const baseEnv = isPlainObject(config.baseEnv) ? config.baseEnv : {}
  const envMap = isPlainObject(config.envMap) ? config.envMap : {}

  for (const [key, value] of Object.entries(baseEnv)) {
    env[key] = stringifyValue(value)
  }

  for (const [dimensionKey, targetEnv] of Object.entries(envMap)) {
    if (!(dimensionKey in combination)) {
      continue
    }
    env[targetEnv] = stringifyValue(combination[dimensionKey])
  }

  env.QA_MATRIX_NAME = config.name
  env.QA_MATRIX_COMBINATION_ID = buildCombinationId(combination)
  return env
}

async function runCommand(command, cwd, env) {
  return await new Promise((resolve, reject) => {
    const child = spawn(command[0], command.slice(1), {
      cwd,
      env,
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

export async function runMatrixConfig(config, options = {}) {
  const combinations = explodeMatrix(config.dimensions)
  const results = []
  const cwd = typeof config.cwd === 'string'
    ? path.resolve(config.__dir, config.cwd)
    : REPO_ROOT
  const failFast = options.failFast === true

  for (const combination of combinations) {
    const combinationId = buildCombinationId(combination)
    const env = buildEnv(config, combination)
    const startedAt = Date.now()
    const execution = await runCommand(config.command, cwd, env)
    const durationMs = Date.now() - startedAt
    const passed = execution.code === 0
    const error = passed
      ? undefined
      : (execution.stderr.trim() || execution.stdout.trim() || `exit ${execution.code}`)

    results.push({
      combination,
      combinationId,
      passed,
      durationMs,
      error,
      exitCode: execution.code,
    })

    if (!passed && failFast) {
      break
    }
  }

  return {
    name: config.name,
    failFast,
    totalPlanned: combinations.length,
    totalExecuted: results.length,
    results,
  }
}

function printSummary(report) {
  console.log(`QA Matrix: ${report.name}`)
  for (const result of report.results) {
    console.log(`  ${result.passed ? '✔' : '✖'} ${result.combinationId} (${result.durationMs}ms)`)
    if (result.error) {
      console.log(`    error: ${result.error}`)
    }
  }

  const passed = report.results.filter(item => item.passed).length
  const failed = report.results.length - passed
  console.log(`Summary: ${report.totalExecuted}/${report.totalPlanned} combination(s), ${passed} passed, ${failed} failed`)
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help || !options.config) {
    printHelp()
    process.exit(options.help ? 0 : 1)
  }

  const config = await loadMatrixConfig(options.config)
  const report = await runMatrixConfig(config, { failFast: options.failFast })
  if (options.json) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    printSummary(report)
  }

  const hasFailure = report.results.some(result => !result.passed)
  process.exit(hasFailure ? 1 : 0)
}

if (process.argv[1] === __filename) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
