#!/usr/bin/env node
import {
  collectArchitectureViolations,
  formatArchitectureViolation,
} from './_lib/architecture-boundaries.mjs'

const violations = collectArchitectureViolations({
  includeTests: false,
})

if (violations.length > 0) {
  for (const violation of violations) {
    process.stderr.write(`${formatArchitectureViolation(violation)}\n`)
  }
  process.exit(1)
}

process.stdout.write('Architecture boundary check passed.\n')
