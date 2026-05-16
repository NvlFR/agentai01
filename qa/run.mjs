#!/usr/bin/env node
// qa/run.mjs — QA Scenario Runner
//
// Usage:
//   node qa/run.mjs [--base-url <url>] [--scenario <name>]
//
// Options:
//   --base-url <url>      Base URL of the running runtime (default: http://127.0.0.1:3000)
//   --scenario <name>     Run only the named scenario (default: all scenarios)
//
// Exit codes:
//   0 — all scenarios passed
//   1 — one or more scenarios failed or an error occurred

import { readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolvePath } from './helpers/request.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SCENARIOS_DIR = join(__dirname, 'scenarios')

// --- CLI args ---
const args = process.argv.slice(2)

function getArg(flag) {
  const idx = args.indexOf(flag)
  return idx !== -1 ? args[idx + 1] ?? null : null
}

const baseUrl = getArg('--base-url') ?? 'http://127.0.0.1:3000'
const scenarioFilter = getArg('--scenario') ?? null

// --- Load scenarios ---
if (!existsSync(SCENARIOS_DIR)) {
  console.error('✖  qa/run: qa/scenarios/ directory not found.')
  process.exit(1)
}

const scenarioFiles = readdirSync(SCENARIOS_DIR)
  .filter(f => f.endsWith('.mjs'))
  .sort()

if (scenarioFiles.length === 0) {
  console.warn('⚠  qa/run: no scenario files found in qa/scenarios/.')
  process.exit(0)
}

// --- Executor ---

/**
 * Execute a single HTTP step.
 *
 * @param {import('./helpers/types.mjs').HttpStep} step
 * @param {string} baseUrl
 * @returns {Promise<unknown>}
 */
async function executeHttpStep(step, baseUrl) {
  const url = `${baseUrl.replace(/\/$/, '')}${step.request.path}`
  const init = {
    method: step.request.method,
    headers: { 'content-type': 'application/json' },
  }
  if (step.request.body !== undefined) {
    init.body = JSON.stringify(step.request.body)
  }

  const response = await fetch(url, init)
  let body
  try {
    body = await response.json()
  } catch {
    body = { _rawStatus: response.status }
  }
  return body
}

/**
 * Evaluate assertions against an actual response.
 *
 * @param {import('./helpers/types.mjs').QaExpectation[]} expectations
 * @param {unknown} actual
 * @param {string} scenarioName
 * @param {number} stepIndex
 * @param {string} stepLabel
 * @returns {import('./helpers/types.mjs').StepFailure[]}
 */
function evaluateAssertions(expectations, actual, scenarioName, stepIndex, stepLabel) {
  /** @type {import('./helpers/types.mjs').StepFailure[]} */
  const failures = []

  for (const expectation of expectations) {
    const resolved = resolvePath(actual, expectation.actualPath)

    if ('equals' in expectation) {
      if (resolved !== expectation.equals) {
        failures.push({
          scenarioName,
          stepIndex,
          stepLabel,
          assertionLabel: expectation.label,
          expected: expectation.equals,
          actual: resolved,
        })
      }
    } else if ('includes' in expectation) {
      const included =
        (typeof resolved === 'string' && typeof expectation.includes === 'string' && resolved.includes(expectation.includes)) ||
        (Array.isArray(resolved) && resolved.includes(expectation.includes))

      if (!included) {
        failures.push({
          scenarioName,
          stepIndex,
          stepLabel,
          assertionLabel: expectation.label,
          expected: `includes(${JSON.stringify(expectation.includes)})`,
          actual: resolved,
        })
      }
    }
  }

  return failures
}

/**
 * Run a single scenario.
 *
 * @param {import('./helpers/types.mjs').QaScenario} scenario
 * @param {string} baseUrl
 * @returns {Promise<import('./helpers/types.mjs').ScenarioResult>}
 */
async function runScenario(scenario, baseUrl) {
  /** @type {import('./helpers/types.mjs').StepFailure[]} */
  const failures = []

  for (let i = 0; i < scenario.steps.length; i++) {
    const step = scenario.steps[i]

    try {
      let actual

      if (step.type === 'http') {
        actual = await executeHttpStep(step, baseUrl)
        const stepLabel = `http ${step.request.method} ${step.request.path}`
        const stepFailures = evaluateAssertions(step.expect, actual, scenario.name, i, stepLabel)
        failures.push(...stepFailures)
      } else if (step.type === 'message') {
        // Message steps require a running qa-channel — not yet wired in this phase.
        // Log a warning and skip rather than crash.
        console.warn(`  ⚠  step[${i}]: message step skipped (qa-channel not yet available)`)
      } else {
        console.warn(`  ⚠  step[${i}]: unknown step type, skipping`)
      }
    } catch (err) {
      return {
        name: scenario.name,
        status: 'error',
        failures: [],
        errorMessage: err instanceof Error ? err.message : String(err),
      }
    }
  }

  return {
    name: scenario.name,
    status: failures.length === 0 ? 'pass' : 'fail',
    failures,
  }
}

// --- Main ---

async function main() {
  console.log(`\nQA Runner`)
  console.log(`  base-url: ${baseUrl}`)
  console.log(`  scenario: ${scenarioFilter ?? 'all'}`)
  console.log('')

  /** @type {import('./helpers/types.mjs').ScenarioResult[]} */
  const results = []

  for (const file of scenarioFiles) {
    const scenarioModule = await import(pathToFileURL(join(SCENARIOS_DIR, file)).href)
    const scenario = /** @type {import('./helpers/types.mjs').QaScenario} */ (
      scenarioModule.default
    )

    if (!scenario?.name || !Array.isArray(scenario?.steps)) {
      console.warn(`⚠  qa/run: ${file} does not export a valid QaScenario — skipping.`)
      continue
    }

    if (scenarioFilter && scenario.name !== scenarioFilter) {
      continue
    }

    process.stdout.write(`  ⟳  ${scenario.name} ... `)
    const result = await runScenario(scenario, baseUrl)
    results.push(result)

    if (result.status === 'pass') {
      console.log('✔ pass')
    } else if (result.status === 'error') {
      console.log(`✖ error: ${result.errorMessage}`)
    } else {
      console.log(`✖ fail (${result.failures.length} assertion(s) failed)`)
      for (const f of result.failures) {
        console.log(`     step[${f.stepIndex}] — ${f.stepLabel}`)
        console.log(`       assertion: ${f.assertionLabel}`)
        console.log(`       expected:  ${JSON.stringify(f.expected)}`)
        console.log(`       actual:    ${JSON.stringify(f.actual)}`)
      }
    }
  }

  if (results.length === 0) {
    if (scenarioFilter) {
      console.error(`\n✖  qa/run: scenario "${scenarioFilter}" not found.`)
    } else {
      console.warn('\n–  qa/run: no scenarios ran.')
    }
    process.exit(1)
  }

  // --- Summary ---
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const errored = results.filter(r => r.status === 'error').length
  const total = results.length

  console.log('')
  console.log(`Summary: ${total} scenario(s) — ${passed} passed, ${failed} failed, ${errored} errored`)

  if (failed > 0 || errored > 0) {
    console.log('\n✖  qa/run: some scenarios did not pass. See failures above.')
    process.exit(1)
  }

  console.log('\n✔  qa/run: all scenarios passed.')
  process.exit(0)
}

main().catch(err => {
  console.error('✖  qa/run: unexpected error:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
