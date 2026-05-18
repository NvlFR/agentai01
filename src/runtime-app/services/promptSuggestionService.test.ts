import { describe, expect, it } from 'bun:test'
import { createPromptSuggestionService } from './promptSuggestionService.js'

describe('createPromptSuggestionService', () => {
  it('returns prompt and skill suggestions tied to the input prefix', () => {
    const service = createPromptSuggestionService({
      prompts: ['Summarize the issue', 'Plan the migration'],
      skills: ['openai-docs'],
    })
    expect(service.suggest('plan')).toEqual(['Plan the migration'])
  })
})
