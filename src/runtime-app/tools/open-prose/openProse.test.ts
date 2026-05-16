import { describe, expect, it } from 'bun:test'
import { createOpenProseTool } from './openProse.js'

describe('OpenProseTool', () => {
  it('uses the active provider interface and returns normalized content', async () => {
    const tool = createOpenProseTool({
      async generateText(request) {
        expect(request.metadata?.['tool']).toBe('open-prose')
        return {
          model: 'gpt-test',
          content: '## Draft\n\nA polished answer.',
          raw: {},
          latencyMs: 12,
          attempts: 1,
        }
      },
    })

    const result = await tool.run({
      mode: 'generate',
      input: 'Outline: intro, body, close',
    })

    expect(result.content).toContain('A polished answer.')
    expect(result.provider.model).toBe('gpt-test')
    expect(result.truncated).toBe(false)
  })

  it('gracefully degrades output that exceeds target length', async () => {
    const tool = createOpenProseTool({
      async generateText() {
        return {
          model: 'gpt-test',
          content: 'Sentence one. Sentence two is longer and should be trimmed for the caller.',
          raw: {},
          latencyMs: 5,
          attempts: 1,
        }
      },
    })

    const result = await tool.run({
      mode: 'condense',
      input: 'Long text',
      targetLength: 20,
      format: 'text',
    })

    expect(result.content.length).toBeLessThanOrEqual(23)
    expect(result.truncated).toBe(true)
  })

  it('rejects empty provider output instead of returning an empty string', async () => {
    const tool = createOpenProseTool({
      async generateText() {
        return {
          model: 'gpt-test',
          content: '   ',
          raw: {},
          latencyMs: 1,
          attempts: 1,
        }
      },
    })

    await expect(
      tool.run({
        mode: 'proofread',
        input: 'Fix this sentence',
      }),
    ).rejects.toThrow('Open Prose provider returned empty content.')
  })
})
