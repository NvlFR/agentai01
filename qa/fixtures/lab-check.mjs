#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

function getArg(name) {
  const args = process.argv.slice(2)
  const index = args.indexOf(name)
  return index === -1 ? null : args[index + 1] ?? null
}

async function main() {
  const expectedProvider = getArg('--expect-provider')
  const expectedModel = getArg('--expect-model')
  const runDir = process.env.QA_LAB_RUN_DIR
  const mockPath = process.env.QA_MOCK_SERVICE_CATALOG

  if (!runDir) {
    throw new Error('QA_LAB_RUN_DIR is required.')
  }
  if (!mockPath) {
    throw new Error('QA_MOCK_SERVICE_CATALOG is required.')
  }
  if (process.env.QA_PROVIDER !== expectedProvider) {
    throw new Error(`Expected QA_PROVIDER=${expectedProvider} but received ${process.env.QA_PROVIDER}`)
  }
  if (process.env.QA_MODEL !== expectedModel) {
    throw new Error(`Expected QA_MODEL=${expectedModel} but received ${process.env.QA_MODEL}`)
  }

  const dbPath = path.join(runDir, 'db', 'users.json')
  const users = JSON.parse(await readFile(dbPath, 'utf8'))
  const mock = JSON.parse(await readFile(mockPath, 'utf8'))
  if (users.users?.[0]?.id !== 'operator-1') {
    throw new Error('Unexpected seeded user.')
  }
  if (mock.items?.[0] !== 'deterministic-widget') {
    throw new Error('Unexpected mock service payload.')
  }

  console.log('lab-check: ok')
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
