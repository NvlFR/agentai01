#!/usr/bin/env node

import process from 'node:process'

function requiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

function main() {
  const provider = requiredEnv('QA_PROVIDER')
  const model = requiredEnv('QA_MODEL')
  const temperature = requiredEnv('QA_TEMPERATURE')

  if (provider === 'stub-local' && model === 'gpt-4.1-nano') {
    throw new Error('stub-local does not support gpt-4.1-nano in this deterministic fixture')
  }

  console.log(JSON.stringify({ provider, model, temperature }))
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
