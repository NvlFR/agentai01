import { afterEach, describe, expect, it } from 'bun:test'
import { createFinalizableDraftStreamControls, createFinalizableDraftStreamControlsForState, takeMessageIdAfterStop } from './channel-lifecycle.js'

describe('createFinalizableDraftStreamControls', () => {
  let timers: ReturnType<typeof setTimeout>[] = []

  afterEach(() => {
    timers.forEach(t => clearTimeout(t))
    timers = []
  })

  it('updates and stops cleanly', async () => {
    const sent: string[] = []
    let stopped = false
    let final = false

    const controls = createFinalizableDraftStreamControls({
      throttleMs: 0,
      isStopped: () => stopped,
      isFinal: () => final,
      markStopped: () => { stopped = true },
      markFinal: () => { final = true },
      sendOrEditStreamMessage: async (text) => {
        sent.push(text)
        return true
      },
    })

    controls.update('hello')
    await new Promise(resolve => { timers.push(setTimeout(resolve, 50)) })
    await controls.stop()

    expect(final).toBe(true)
    expect(sent.length).toBeGreaterThanOrEqual(1)
  })

  it('ignores updates after final', async () => {
    const sent: string[] = []

    const controls = createFinalizableDraftStreamControls({
      throttleMs: 0,
      isStopped: () => false,
      isFinal: () => true,
      markStopped: () => {},
      markFinal: () => {},
      sendOrEditStreamMessage: async (text) => {
        sent.push(text)
        return true
      },
    })

    controls.update('ignored')
    await new Promise(resolve => { timers.push(setTimeout(resolve, 50)) })
    expect(sent).toEqual([])
  })
})

describe('createFinalizableDraftStreamControlsForState', () => {
  let timers: ReturnType<typeof setTimeout>[] = []

  afterEach(() => {
    timers.forEach(t => clearTimeout(t))
    timers = []
  })

  it('manages state object directly', async () => {
    const state = { stopped: false, final: false }
    const controls = createFinalizableDraftStreamControlsForState({
      throttleMs: 0,
      state,
      sendOrEditStreamMessage: async () => true,
    })

    await controls.stop()
    expect(state.final).toBe(true)
  })
})

describe('takeMessageIdAfterStop', () => {
  it('returns the message ID after stopping', async () => {
    let messageId: number | undefined = 42
    const result = await takeMessageIdAfterStop({
      stopForClear: async () => {},
      readMessageId: () => messageId,
      clearMessageId: () => { messageId = undefined },
    })
    expect(result).toBe(42)
    expect(messageId).toBeUndefined()
  })

  it('returns undefined when no message ID', async () => {
    const result = await takeMessageIdAfterStop({
      stopForClear: async () => {},
      readMessageId: () => undefined,
      clearMessageId: () => {},
    })
    expect(result).toBeUndefined()
  })
})
