import { describe, expect, it } from 'bun:test'
import { composeRuntimeSystemPrompt } from './promptPlumbing.js'

describe('composeRuntimeSystemPrompt', () => {
  it('keeps base prompt first and appends named dynamic sections', () => {
    const prompt = composeRuntimeSystemPrompt({
      base: ['Base rule'],
      sections: [
        { id: 'Group Prompt', content: 'Be helpful in this group.' },
        { id: 'Empty', content: '   ' },
      ],
    })

    expect(prompt).toBe('Base rule\n\n## Group Prompt\nBe helpful in this group.')
  })
})
