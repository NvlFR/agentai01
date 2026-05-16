import { estimateTokens } from './estimate.js'
import { scoreContextItem } from './score.js'

export type ContextOwner = {
  readonly projectId?: string
  readonly agentId?: string
  readonly sessionId?: string
}

export type ContextPriority = 'critical' | 'high' | 'normal' | 'low'

export type ContextItem = {
  readonly id: string
  readonly content: string
  readonly owner: ContextOwner
  readonly priority: ContextPriority
  readonly createdAt: string
  readonly tokenEstimate?: number
  readonly metadata?: Record<string, unknown>
}

export type ContextBudget = {
  readonly maxTokens: number
  readonly reservedOutputTokens: number
}

export type ContextCompressionHook = (
  items: readonly ContextItem[],
  budgetTokens: number,
) => Promise<ContextItem>

export type ContextBatch = {
  readonly owner: ContextOwner
  readonly budget: ContextBudget
  readonly included: readonly ContextItem[]
  readonly compressed: readonly ContextItem[]
  readonly omitted: readonly ContextItem[]
  readonly usedTokens: number
  readonly remainingTokens: number
}

export async function buildContextBatch(
  owner: ContextOwner,
  items: readonly ContextItem[],
  budget: ContextBudget,
  compressionHook?: ContextCompressionHook,
  now = new Date(),
): Promise<ContextBatch> {
  const availableTokens = Math.max(0, budget.maxTokens - budget.reservedOutputTokens)
  const ranked = [...items]
    .filter(item => ownerMatches(owner, item.owner))
    .sort((left, right) => scoreContextItem(right, now) - scoreContextItem(left, now))

  const included: ContextItem[] = []
  const overflow: ContextItem[] = []
  let usedTokens = 0

  for (const item of ranked) {
    const tokens = itemTokens(item)
    if (usedTokens + tokens <= availableTokens) {
      included.push(item)
      usedTokens += tokens
      continue
    }

    overflow.push(item)
  }

  const compressed: ContextItem[] = []
  if (overflow.length > 0 && compressionHook && usedTokens < availableTokens) {
    const compressedItem = await compressionHook(overflow, availableTokens - usedTokens)
    const compressedTokens = itemTokens(compressedItem)
    if (compressedTokens <= availableTokens - usedTokens) {
      compressed.push(compressedItem)
      usedTokens += compressedTokens
    }
  }

  return {
    owner,
    budget,
    included,
    compressed,
    omitted: compressed.length > 0 ? [] : overflow,
    usedTokens,
    remainingTokens: availableTokens - usedTokens,
  }
}

function itemTokens(item: ContextItem): number {
  return item.tokenEstimate ?? estimateTokens(item.content)
}

function ownerMatches(requested: ContextOwner, candidate: ContextOwner): boolean {
  return (
    (requested.projectId === undefined || requested.projectId === candidate.projectId) &&
    (requested.agentId === undefined || requested.agentId === candidate.agentId) &&
    (requested.sessionId === undefined || requested.sessionId === candidate.sessionId)
  )
}
