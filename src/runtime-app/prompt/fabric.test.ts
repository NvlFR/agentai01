import { describe, expect, it } from 'bun:test'

import { routeRestoredContextModule, listRuntimeRelevantContextRoutes } from './contextRoutes.js'
import { processPromptInput } from './inputPipeline.js'
import {
  appendPromptTag,
  mapPromptMessagesToProviderInput,
  normalizeRuntimePromptMessages,
} from './messageNormalization.js'
import { buildPromptSuggestions } from './suggestions.js'

describe('processPromptInput', () => {
  it('classifies slash commands without sending them to the model query pipeline', () => {
    const result = processPromptInput(' /assign sales ')

    expect(result.kind).toBe('slash-command')
    expect(result.commandName).toBe('assign')
    expect(result.argsText).toBe('sales')
    expect(result.shouldQuery).toBe(false)
  })

  it('classifies bash commands separately from text prompts', () => {
    const result = processPromptInput('! bun test')

    expect(result.kind).toBe('bash-command')
    expect(result.normalized).toBe('bun test')
    expect(result.tags).toEqual(['bash'])
  })

  it('keeps plain text queryable after normalization', () => {
    const result = processPromptInput(' Halo tim \n tolong bantu ')

    expect(result.kind).toBe('text-prompt')
    expect(result.normalized).toBe('Halo tim\ntolong bantu')
    expect(result.shouldQuery).toBe(true)
  })
})

describe('message normalization', () => {
  it('normalizes content and maps tool messages into provider-safe assistant messages', () => {
    const normalized = normalizeRuntimePromptMessages([
      { role: 'user', content: ' Halo  ', tags: [' operator '] },
      { role: 'tool', content: '  file read ok  ' },
    ])

    expect(normalized).toEqual([
      { role: 'user', content: 'Halo', tags: ['operator'] },
      { role: 'tool', content: 'file read ok', tags: [] },
    ])

    expect(mapPromptMessagesToProviderInput(normalized)).toEqual([
      { role: 'user', content: 'Halo' },
      { role: 'assistant', content: 'file read ok' },
    ])
  })

  it('appends tags without duplicates', () => {
    expect(
      appendPromptTag({ role: 'assistant', content: 'done', tags: ['summary'] }, 'summary'),
    ).toEqual({
      role: 'assistant',
      content: 'done',
      tags: ['summary'],
    })
  })
})

describe('buildPromptSuggestions', () => {
  it('returns inline completion and ranked suggestions across commands, skills, and prompts', () => {
    const result = buildPromptSuggestions({
      input: '/as',
      commands: ['/assign', '/ask'],
      skills: ['analysis'],
      recentPrompts: ['assign the project owner'],
    })

    expect(result.inlineCompletion).toBe('k')
    expect(result.suggestions[0]?.value).toBe('/ask')
    expect(result.suggestions.some(item => item.kind === 'command')).toBe(true)
  })
})

describe('routeRestoredContextModule', () => {
  it('classifies runtime-relevant context modules away from UI-only overlays', () => {
    expect(
      routeRestoredContextModule('restored-src/src/context/voice.tsx'),
    ).toEqual({
      sourceModule: 'restored-src/src/context/voice.tsx',
      targetSurface: 'speech-context',
      landingPath: 'src/runtime-app/speech',
      rationale: 'Voice toggles and state belong to the speech pipeline boundary.',
    })

    expect(listRuntimeRelevantContextRoutes().every(route => route.targetSurface !== 'operator-surface')).toBe(
      true,
    )
  })
})
