import { describe, expect, it } from 'bun:test'
import { summarizeToolUse } from './toolUseSummaryService.js'

describe('summarizeToolUse', () => {
  it('creates redaction-safe tool summaries', () => {
    expect(summarizeToolUse([
      { toolName: 'web_search', summary: 'Fetched Bearer sk-secret' },
    ])).toBe('- web_search: Fetched Bearer [REDACTED]')
  })
})
