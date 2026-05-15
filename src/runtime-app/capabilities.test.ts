import { describe, expect, it } from 'bun:test'
import { executeWorkspaceCapability } from './capabilities.js'
import type { OwnerCommand } from '../agents/ceo/models.js'

describe('executeWorkspaceCapability', () => {
  it('reads a real file from the workspace', () => {
    const command: OwnerCommand = {
      command_type: 'workspace',
      parameters: {
        action: 'read_file',
        path: 'src/runtime-app/state.ts',
      },
      raw_input: 'baca file src/runtime-app/state.ts',
      parsed_at: '2026-05-15T01:00:00.000Z',
    }

    const result = executeWorkspaceCapability({
      command,
      env: 'test',
      now: '2026-05-15T01:00:00.000Z',
    })

    expect(result.ok).toBe(true)
    expect(result.summary).toContain('src/runtime-app/state.ts')
    expect(result.output).toContain('export type RuntimeAppSnapshot')
    expect(result.artifactPath).toContain('/runtime/test/artifacts/capabilities/')
  })

  it('searches code in the real workspace', () => {
    const command: OwnerCommand = {
      command_type: 'workspace',
      parameters: {
        action: 'search_code',
        query: 'submitDirective',
      },
      raw_input: 'cari kode submitDirective',
      parsed_at: '2026-05-15T01:05:00.000Z',
    }

    const result = executeWorkspaceCapability({
      command,
      env: 'test',
      now: '2026-05-15T01:05:00.000Z',
    })

    expect(result.ok).toBe(true)
    expect(result.output).toContain('submitDirective')
  })
})
