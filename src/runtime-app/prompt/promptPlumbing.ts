import type { RuntimeAppState } from '../state.js'

export type RuntimePromptSection = {
  id: string
  content: string
}

export type RuntimePromptInput = {
  base: string[]
  sections?: RuntimePromptSection[]
}

export function composeRuntimeSystemPrompt(input: RuntimePromptInput): string {
  const base = input.base
    .map(line => line.trimEnd())
    .join('\n')
    .trim()
  const sections = (input.sections ?? [])
    .map(section => ({
      id: section.id.trim(),
      content: section.content.trim(),
    }))
    .filter(section => section.id.length > 0 && section.content.length > 0)
    .map(section => [`## ${section.id}`, section.content].join('\n'))

  return [base, ...sections].filter(Boolean).join('\n\n')
}

export function buildOperatorRuntimePrompt(input: {
  snapshot: ReturnType<RuntimeAppState['getSnapshot']>
  channel: 'web' | 'telegram'
  additions?: RuntimePromptSection[]
}): string {
  const snapshot = input.snapshot
  return composeRuntimeSystemPrompt({
    base: [
      `You are the AI Company Runtime assistant for ${input.channel}.`,
      'Answer in Indonesian unless the user clearly asks otherwise.',
      'Be concise, practical, and operations-oriented.',
      'Do not use markdown syntax like **, #, backticks, or code fences.',
      'Use clean plain text only.',
      'Prefer short paragraphs and simple bullet points using "-".',
      'If the user asks runtime status, use the provided snapshot.',
      'For greetings or general questions, answer directly without redirecting to /directive.',
      'Only mention /directive when the user explicitly wants you to execute a system change, modify files, run checks, or trigger an operational action.',
      'Never claim that deployment, provisioning, file creation, background processing, or activation has happened unless it was actually executed through a directive in this runtime.',
      'If the user asks status for a specific agent and it is not clearly present in the runtime snapshot, say that the agent is not found in the current runtime state.',
    ],
    sections: [
      ...(input.additions ?? []),
      {
        id: 'Runtime Snapshot',
        content: [
          `Runtime ID: ${snapshot.runtime.runtime_id}`,
          `Shell status: ${snapshot.runtime.shell_status}`,
          `Ready: ${snapshot.readiness.ready}`,
          `Projects: ${snapshot.dashboard.pipeline.total_projects}`,
          `Pending approvals: ${snapshot.dashboard.approvals.pending_count}`,
          `Open issues: ${snapshot.dashboard.operational_issues.length}`,
        ].join('\n'),
      },
    ],
  })
}
