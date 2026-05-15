import { describe, expect, it } from 'bun:test'

import {
  classifyArchitectureViolation,
  collectArchitectureViolations,
} from '../scripts/_lib/architecture-boundaries.mjs'

describe('architecture boundaries', () => {
  it('passes the current src graph without boundary violations', () => {
    expect(collectArchitectureViolations({ includeTests: false })).toEqual([])
  })

  it('reports agent-to-agent internal imports with a descriptive rule', () => {
    const violation = classifyArchitectureViolation('src/agents/sales/flow.ts', {
      resolved: 'src/agents/marketing/models.ts',
      specifier: '../marketing/models.js',
      line: 12,
    })

    expect(violation).toMatchObject({
      rule: 'agent-cross-import',
      file: 'src/agents/sales/flow.ts',
      importPath: '../marketing/models.js',
    })
  })

  it('reports provider-to-agent imports with a descriptive rule', () => {
    const violation = classifyArchitectureViolation('src/runtime-app/providers/openaiCompatible.ts', {
      resolved: 'src/agents/engineering/flow.ts',
      specifier: '../../agents/engineering/flow.js',
      line: 8,
    })

    expect(violation).toMatchObject({
      rule: 'provider-imports-agent-internal',
      file: 'src/runtime-app/providers/openaiCompatible.ts',
      importPath: '../../agents/engineering/flow.js',
    })
  })
})
