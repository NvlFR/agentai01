import { describe, expect, it } from 'bun:test'

import { createTelegramPollingStatusPublisher } from './polling-status.js'

describe('src/channels/telegram/polling-status.ts', () => {
  it('is a safe no-op when no status sink is provided', () => {
    const publisher = createTelegramPollingStatusPublisher()

    publisher.notePollingStart()
    publisher.notePollSuccess(new Date('2026-05-17T10:00:00.000Z'))
    publisher.notePollingStop()
  })

  it('publishes start, success, and stop patches', () => {
    const patches: Array<Record<string, unknown>> = []
    const publisher = createTelegramPollingStatusPublisher((patch) => {
      patches.push(patch)
    })

    publisher.notePollingStart()
    publisher.notePollSuccess(new Date('2026-05-17T10:00:00.000Z'))
    publisher.notePollingStop()

    expect(patches[0]).toEqual({
      mode: 'polling',
      connected: false,
      lastConnectedAt: null,
      lastEventAt: null,
      lastTransportActivityAt: null,
    })
    expect(patches[1]).toEqual({
      mode: 'polling',
      connected: true,
      lastConnectedAt: '2026-05-17T10:00:00.000Z',
      lastTransportActivityAt: '2026-05-17T10:00:00.000Z',
      lastError: null,
    })
    expect(patches[2]).toEqual({
      mode: 'polling',
      connected: false,
    })
  })
})
