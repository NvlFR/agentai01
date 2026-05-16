import { generateId } from '../shared/index.js'

export type CommitmentStatus = 'open' | 'fulfilled' | 'breached' | 'cancelled'

export type Commitment = {
  id: string
  agentId: string
  operatorId: string
  description: string
  dueAt: string
  createdAt: string
  status: CommitmentStatus
  fulfilledAt?: string
  breachedAt?: string
}

export type CommitmentAlert = {
  commitmentId: string
  agentId: string
  operatorId: string
  severity: 'warning' | 'breach'
  message: string
  emittedAt: string
}

export function createCommitment(input: {
  agentId: string
  operatorId: string
  description: string
  dueAt: string
  now?: () => Date
  id?: string
}): Commitment {
  const now = input.now ?? (() => new Date())
  return {
    id: input.id ?? generateId('commitment'),
    agentId: input.agentId.trim(),
    operatorId: input.operatorId.trim(),
    description: input.description.trim(),
    dueAt: input.dueAt,
    createdAt: now().toISOString(),
    status: 'open',
  }
}

export function fulfillCommitment(commitment: Commitment, now: () => Date = () => new Date()): Commitment {
  if (commitment.status !== 'open') {
    return commitment
  }

  return {
    ...commitment,
    status: 'fulfilled',
    fulfilledAt: now().toISOString(),
  }
}

export function detectDeadlineBreaches(
  commitments: readonly Commitment[],
  now: Date,
): {
  commitments: readonly Commitment[]
  alerts: readonly CommitmentAlert[]
} {
  const alerts: CommitmentAlert[] = []
  const updated = commitments.map(commitment => {
    if (commitment.status !== 'open' || Date.parse(commitment.dueAt) > now.getTime()) {
      return commitment
    }

    const breached: Commitment = {
      ...commitment,
      status: 'breached',
      breachedAt: now.toISOString(),
    }
    alerts.push({
      commitmentId: commitment.id,
      agentId: commitment.agentId,
      operatorId: commitment.operatorId,
      severity: 'breach',
      message: `Commitment deadline breached: ${commitment.description}`,
      emittedAt: now.toISOString(),
    })
    return breached
  })

  return { commitments: updated, alerts }
}

export function createInMemoryCommitmentStore(initial: readonly Commitment[] = []): {
  add: (commitment: Commitment) => void
  list: () => readonly Commitment[]
  replaceAll: (commitments: readonly Commitment[]) => void
} {
  let values = [...initial]

  return {
    add(commitment) {
      values = [...values, commitment]
    },
    list() {
      return values.map(commitment => ({ ...commitment }))
    },
    replaceAll(commitments) {
      values = commitments.map(commitment => ({ ...commitment }))
    },
  }
}
