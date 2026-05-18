import { describe, expect, it } from 'bun:test'
import { createSessionMemoryService } from './sessionMemoryService.js'

describe('createSessionMemoryService', () => {
  it('keeps a session-local memory lifecycle and prompt prelude', () => {
    const service = createSessionMemoryService()
    service.append({ role: 'user', content: 'halo' })
    service.append({ role: 'assistant', content: 'siap' })
    expect(service.buildPromptPrelude()).toBe('user: halo\nassistant: siap')
  })
})
