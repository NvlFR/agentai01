#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const allChecks = [
  {
    name: 'typecheck',
    command: ['npm', 'run', 'check'],
  },
  {
    name: 'import-cycles',
    command: ['node', 'scripts/check-import-cycles.mjs'],
  },
  {
    name: 'architecture',
    command: ['node', 'scripts/check-architecture-smells.mjs'],
  },
  {
    name: 'deadcode',
    command: ['node', 'scripts/check-deadcode-unused-files.mjs'],
  },
  {
    name: 'dependency-pins',
    command: ['node', 'scripts/check-dependency-pins.mjs'],
  },
]

const args = process.argv.slice(2)
const onlyIndex = args.indexOf('--only')
const onlyName = onlyIndex >= 0 ? args[onlyIndex + 1] : undefined
const checks = onlyName
  ? allChecks.filter(check => check.name === onlyName)
  : allChecks

if (checks.length === 0) {
  process.stderr.write(`Unknown check name: ${onlyName ?? '(missing)'}\n`)
  process.exit(1)
}

const ciMode = process.env.CI === 'true'
const startedAt = Date.now()
const results = []

for (const check of checks) {
  const checkStartedAt = Date.now()
  const result = spawnSync(check.command[0], check.command.slice(1), {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
  })
  const durationMs = Date.now() - checkStartedAt
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
  const entry = {
    name: check.name,
    ok: result.status === 0,
    durationMs,
    exitCode: result.status ?? 1,
    output,
  }
  results.push(entry)

  if (!ciMode) {
    process.stdout.write(
      `[${entry.ok ? 'PASS' : 'FAIL'}] ${entry.name} (${entry.durationMs}ms)\n`,
    )
    if (entry.output) {
      process.stdout.write(`${entry.output}\n`)
    }
  }

  if (!entry.ok) {
    if (ciMode) {
      process.stdout.write(
        `${JSON.stringify({
          ok: false,
          failed: entry.name,
          durationMs: Date.now() - startedAt,
          results,
        })}\n`,
      )
    } else {
      process.stderr.write(
        `Check failed: ${entry.name} (exit ${entry.exitCode})\n`,
      )
    }
    process.exit(entry.exitCode || 1)
  }
}

const totalDurationMs = Date.now() - startedAt
if (ciMode) {
  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      durationMs: totalDurationMs,
      results,
    })}\n`,
  )
} else {
  process.stdout.write(`All checks passed in ${totalDurationMs}ms.\n`)
}
