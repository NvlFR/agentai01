import { describe, expect, it } from 'bun:test'

import {
  createCommitment,
  createInMemoryCommitmentStore,
  detectDeadlineBreaches,
  fulfillCommitment,
} from './index.js'

describe('commitments', () => {
  it('tracks promises and emits breach alerts after deadlines', () => {
    const commitment = createCommitment({
      id: 'commitment-1',
      agentId: 'support',
      operatorId: 'owner',
      description: 'Send incident summary',
      dueAt: '2026-05-16T01:00:00.000Z',
      now: () => new Date('2026-05-16T00:00:00.000Z'),
    })

    const result = detectDeadlineBreaches([commitment], new Date('2026-05-16T02:00:00.000Z'))

    expect(result.commitments[0]?.status).toBe('breached')
    expect(result.alerts[0]).toMatchObject({
      commitmentId: 'commitment-1',
      severity: 'breach',
      message: 'Commitment deadline breached: Send incident summary',
    })
  })

  it('does not breach fulfilled commitments', () => {
    const fulfilled = fulfillCommitment(createCommitment({
      id: 'commitment-2',
      agentId: 'pm',
      operatorId: 'owner',
      description: 'Post update',
      dueAt: '2026-05-16T01:00:00.000Z',
    }), () => new Date('2026-05-16T00:30:00.000Z'))

    expect(detectDeadlineBreaches([fulfilled], new Date('2026-05-16T02:00:00.000Z')).alerts).toHaveLength(0)
  })

  it('stores commitments without leaking mutable references', () => {
    const store = createInMemoryCommitmentStore()
    store.add(createCommitment({
      id: 'commitment-3',
      agentId: 'sales',
      operatorId: 'owner',
      description: 'Follow up',
      dueAt: '2026-05-17T00:00:00.000Z',
    }))

    const listed = store.list()
    expect(listed).toHaveLength(1)
    expect(listed[0]?.id).toBe('commitment-3')
  })
})
