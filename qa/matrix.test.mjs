import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

import { explodeMatrix, loadMatrixConfig, runMatrixConfig } from './matrix.mjs'

function runCommand(command, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command[0], command.slice(1), {
      cwd: path.resolve('.'),
      env: { ...process.env, ...env },
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

test('qa matrix expands combinations deterministically', () => {
  const combinations = explodeMatrix({
    model: ['m1', 'm2'],
    provider: ['p1', 'p2'],
  })

  assert.deepEqual(combinations, [
    { model: 'm1', provider: 'p1' },
    { model: 'm1', provider: 'p2' },
    { model: 'm2', provider: 'p1' },
    { model: 'm2', provider: 'p2' },
  ])
})

test('qa matrix runs every combination and reports failures without fail-fast', async () => {
  const config = await loadMatrixConfig('qa/matrix.sample.json')
  const report = await runMatrixConfig(config, { failFast: false })

  assert.equal(report.totalPlanned, 4)
  assert.equal(report.totalExecuted, 4)
  assert.equal(report.results.filter(item => item.passed).length, 3)
  assert.equal(report.results.filter(item => !item.passed).length, 1)
  assert.match(report.results.find(item => !item.passed)?.error ?? '', /does not support/)
})

test('qa matrix stops early with fail-fast', async () => {
  const config = {
    ...(await loadMatrixConfig('qa/matrix.sample.json')),
    dimensions: {
      provider: ['stub-openai', 'stub-local'],
      model: ['gpt-4.1-nano', 'gpt-4.1-mini'],
      temperature: ['0'],
    },
  }
  const report = await runMatrixConfig(config, { failFast: true })

  assert.equal(report.totalPlanned, 4)
  assert.equal(report.totalExecuted, 2)
  assert.equal(report.results.at(-1)?.passed, false)
})

test('qa matrix result matches manual execution for the same combination', async () => {
  const config = await loadMatrixConfig('qa/matrix.sample.json')
  const report = await runMatrixConfig(config, { failFast: false })
  const target = report.results.find(item => item.combination.provider === 'stub-openai' && item.combination.model === 'gpt-4.1-mini')

  assert.ok(target)

  const manual = await runCommand(config.command, {
    QA_PROVIDER: 'stub-openai',
    QA_MODEL: 'gpt-4.1-mini',
    QA_TEMPERATURE: '0',
    QA_MATRIX_MODE: 'sample',
  })

  assert.equal(target.passed, manual.code === 0)
  assert.equal(target.error, undefined)
  assert.equal(JSON.parse(manual.stdout).provider, 'stub-openai')
  assert.equal(JSON.parse(manual.stdout).model, 'gpt-4.1-mini')
})
