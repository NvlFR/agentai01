import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { AgentCreationService } from './service.js'

const tempDirs: string[] = []

afterEach(async () => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()
    if (dir) {
      await rm(dir, { recursive: true, force: true })
    }
  }
})

async function makeTempDir() {
  const dir = await mkdtemp(path.join(tmpdir(), 'agent-creation-'))
  tempDirs.push(dir)
  return dir
}

describe('AgentCreationService', () => {
  it('builds restored wizard-style step definitions in the expected order', () => {
    const service = new AgentCreationService({ memoryEnabled: true })
    const steps = service.buildStepDefinitions('gpt-4.1-mini')

    expect(steps.map(step => step.id)).toEqual([
      'location',
      'method',
      'generate',
      'type',
      'prompt',
      'description',
      'tools',
      'model',
      'color',
      'memory',
      'confirm',
    ])
  })

  it('generates fields from provider JSON', async () => {
    const service = new AgentCreationService({
      provider: {
        async generateText() {
          return {
            content: JSON.stringify({
              identifier: 'agent-risk-radar',
              whenToUse: 'Use this agent when you need to assess delivery risk before a sprint slips.',
              systemPrompt: 'You are a delivery-risk specialist. Identify signals, quantify risk, and suggest mitigations.',
            }),
          }
        },
      },
    })

    const generated = await service.generateFields('Bikin agent yang mantau risiko delivery')
    expect(generated.identifier).toBe('agent-risk-radar')
    expect(generated.whenToUse).toContain('Use this agent when')
  })

  it('validates, saves, and lists draft artifacts', async () => {
    const cwd = await makeTempDir()
    const service = new AgentCreationService({ cwd, now: () => '2026-05-18T12:00:00.000Z' })
    const draft = {
      location: 'project' as const,
      method: 'manual' as const,
      agentType: 'ops-health-auditor',
      whenToUse: 'Use this agent when operator needs a health and readiness audit before deployment.',
      systemPrompt:
        'You are an operations auditor. Review runtime health, readiness, deployment blockers, and next actions.',
      selectedTools: ['github', 'bash_tool'] as const,
      selectedModel: 'gpt-4.1-mini',
      selectedColor: 'blue' as const,
      memoryScope: 'project' as const,
    }

    const validation = await service.validateDraft(draft)
    expect(validation.isValid).toBe(true)
    expect(validation.preview?.relativeArtifactPath).toContain('workspaces/generated-agents/project')

    const saved = await service.saveDraft(draft)
    expect(saved.markdownPath.endsWith('ops-health-auditor.md')).toBe(true)

    const listed = await service.listSavedDrafts('project')
    expect(listed).toHaveLength(1)
    expect(listed[0]?.agentType).toBe('ops-health-auditor')

    const duplicate = await service.validateDraft(draft)
    expect(duplicate.isValid).toBe(false)
    expect(duplicate.errors[0]).toContain('ops-health-auditor')
  })
})
