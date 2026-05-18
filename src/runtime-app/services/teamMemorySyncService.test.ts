import { describe, expect, it } from 'bun:test'
import { syncTeamMemory } from './teamMemorySyncService.js'

describe('syncTeamMemory', () => {
  it('keeps project and department isolation while redacting secrets', () => {
    expect(syncTeamMemory({
      currentProjectId: 'p1',
      allowedDepartment: 'engineering',
      records: [
        { projectId: 'p1', department: 'engineering', content: 'api_key=secret' },
        { projectId: 'p2', department: 'engineering', content: 'ignore' },
      ],
    })).toEqual([
      { projectId: 'p1', department: 'engineering', content: 'api_key=[REDACTED]' },
    ])
  })
})
