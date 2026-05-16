import { describe, expect, test } from 'bun:test'

import { createWizard } from './index.js'

describe('wizard', () => {
  test('advances through required setup steps', () => {
    const wizard = createWizard([
      { id: 'project', prompt: 'Project?', required: true },
      { id: 'model', prompt: 'Model?', required: true },
    ])
    const started = wizard.start()
    const first = wizard.answer(started, 'agentai01')

    expect(first.ok).toBe(true)
    if (!first.ok) {
      throw new Error(first.error)
    }

    const second = wizard.answer(first.value, 'gpt-4.1-mini')
    expect(second.ok && second.value.completed).toBe(true)
  })
})
