export type UltraPlanStepStatus = 'pending' | 'in_progress' | 'completed' | 'blocked'

export type UltraPlanStep = {
  readonly id: string
  readonly title: string
  readonly status: UltraPlanStepStatus
  readonly owner?: string
}

export function createUltraPlan(input: {
  readonly objective: string
  readonly steps: readonly UltraPlanStep[]
}): string {
  const lines = [`Objective: ${input.objective.trim()}`]
  for (const step of input.steps) {
    const owner = step.owner ? ` @${step.owner}` : ''
    lines.push(`- [${step.status}] ${step.id} ${step.title}${owner}`)
  }
  return lines.join('\n')
}
