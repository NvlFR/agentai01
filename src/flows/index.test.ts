import { describe, expect, test } from 'bun:test'
import { InMemoryFlowStateStore, executeFlow, type FlowDefinition } from './index.js'

describe('flows', () => {
  test('executes steps and persists final state', async () => {
    const store = new InMemoryFlowStateStore<{ count: number }>()
    const flow: FlowDefinition<{ count: number }> = {
      id: 'counter',
      initial_state: { count: 0 },
      steps: [
        { id: 'one', title: 'One', run: context => ({ count: context.state.count + 1 }) },
        { id: 'two', title: 'Two', run: context => ({ count: context.state.count + 1 }) },
      ],
    }

    const result = await executeFlow(flow, { store })

    expect(result.ok).toBe(true)
    expect(result.ok ? result.value.state.count : 0).toBe(2)
    expect((await store.load('counter'))?.status).toBe('succeeded')
  })

  test('uses step recovery to continue after isolated failure', async () => {
    const result = await executeFlow({
      id: 'recoverable',
      initial_state: { recovered: false },
      steps: [
        {
          id: 'fragile',
          title: 'Fragile',
          run: () => {
            throw new Error('temporary')
          },
          recover: () => ({ recovered: true }),
        },
      ],
    })

    expect(result.ok).toBe(true)
    expect(result.ok ? result.value.state.recovered : false).toBe(true)
  })
})
