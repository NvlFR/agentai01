import test from 'node:test'
import assert from 'node:assert/strict'
import { access, rm } from 'node:fs/promises'

import { runLabFile } from './lab-runner.mjs'

test('qa lab runs sample config end-to-end and tears down isolated state', async () => {
  const result = await runLabFile('qa/labs/sample-lab.json')

  assert.equal(result.ok, true)
  assert.equal(result.failure, null)
  assert.equal(result.phaseResults.setup.length, 3)
  assert.equal(result.phaseResults.run.length, 3)
  assert.equal(result.phaseResults.teardown.length, 1)

  await assert.rejects(access(result.runDir))
})

test('qa lab performs partial teardown when setup fails', async () => {
  const result = await runLabFile('qa/labs/setup-failure-lab.json')

  assert.equal(result.ok, false)
  assert.equal(result.failure?.phase, 'setup')
  assert.match(result.failure?.message ?? '', /forced setup failure/)
  assert.equal(result.rollback.length, 1)
  assert.equal(result.rollback[0].status, 'pass')

  await assert.rejects(access(result.runDir))
})

test('qa lab supports isolated parallel runs', async () => {
  const [first, second] = await Promise.all([
    runLabFile('qa/labs/sample-lab.json', { keepRunDir: true }),
    runLabFile('qa/labs/sample-lab.json', { keepRunDir: true }),
  ])

  assert.equal(first.ok, true)
  assert.equal(second.ok, true)
  assert.notEqual(first.runDir, second.runDir)

  await Promise.all([
    rm(first.runDir, { recursive: true, force: true }),
    rm(second.runDir, { recursive: true, force: true }),
  ])
})
