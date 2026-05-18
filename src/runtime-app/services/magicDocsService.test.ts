import { describe, expect, it } from 'bun:test'
import { createMagicDocsService } from './magicDocsService.js'

describe('createMagicDocsService', () => {
  it('builds documentation-friendly sections', () => {
    const service = createMagicDocsService()
    expect(service.buildSection({
      title: 'Changes',
      bullets: ['Added MCP service', 'Added file persistence'],
    })).toBe('## Changes\n- Added MCP service\n- Added file persistence')
  })
})
