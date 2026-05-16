import { describe, expect, it } from 'bun:test'

import {
  calculateTranscriptionAccuracy,
  createRealtimeTranscriptionClient,
  type RealtimeTranscriptionProvider,
  type TranscriptionAudioChunk,
  type TranscriptionStreamEvent,
} from './index.js'

describe('createRealtimeTranscriptionClient', () => {
  it('streams cloned audio chunks through provider interfaces without retaining raw audio', async () => {
    const events: TranscriptionStreamEvent[] = []
    const receivedChunks: TranscriptionAudioChunk[] = []
    const provider: RealtimeTranscriptionProvider = {
      id: 'fake-stt',
      async startSession({ sessionId, onEvent }) {
        return {
          id: sessionId,
          async write(chunk) {
            receivedChunks.push(chunk)
            onEvent({
              type: 'partial',
              sessionId,
              segment: {
                id: chunk.chunkId,
                text: 'hello',
                isFinal: false,
              },
            })
          },
          async close() {
            onEvent({
              type: 'final',
              sessionId,
              segment: {
                id: 'final-1',
                text: 'hello world',
                isFinal: true,
              },
            })
          },
        }
      },
    }
    const client = createRealtimeTranscriptionClient({
      provider,
      createSessionId: () => 'rt-1',
      onEvent: (event) => events.push(event),
    })

    const session = await client.start({ language: 'en' })
    const audio = new Uint8Array([1, 2, 3])
    await session.write({
      chunkId: 'chunk-1',
      audio,
      sampleRateHz: 16_000,
      timestamp: new Date('2026-05-16T00:00:00.000Z'),
    })
    audio[0] = 99
    await session.close()

    expect(session.id).toBe('rt-1')
    expect(Array.from(receivedChunks[0]?.audio ?? [])).toEqual([1, 2, 3])
    expect(events.map((event) => event.type)).toEqual([
      'session_started',
      'partial',
      'final',
      'session_closed',
    ])
  })

  it('treats close as idempotent and rejects writes after session close', async () => {
    let closeCalls = 0
    const events: TranscriptionStreamEvent[] = []
    const provider: RealtimeTranscriptionProvider = {
      id: 'fake-stt',
      async startSession({ sessionId }) {
        return {
          id: sessionId,
          async write() {
            throw new Error('provider write should not be called after close')
          },
          async close() {
            closeCalls += 1
          },
        }
      },
    }
    const client = createRealtimeTranscriptionClient({
      provider,
      createSessionId: () => 'rt-closed',
      onEvent: (event) => events.push(event),
    })

    const session = await client.start()
    await session.close()
    await session.close()

    expect(closeCalls).toBe(1)
    expect(events.map((event) => event.type)).toEqual(['session_started', 'session_closed'])
    await expect(
      session.write({
        chunkId: 'late',
        audio: new Uint8Array([1]),
        sampleRateHz: 16_000,
        timestamp: new Date('2026-05-16T00:00:00.000Z'),
      }),
    ).rejects.toThrow('Realtime transcription session "rt-closed" is closed')
  })

  it('emits an error event when provider startup fails', async () => {
    const events: TranscriptionStreamEvent[] = []
    const provider: RealtimeTranscriptionProvider = {
      id: 'fake-stt',
      async startSession() {
        throw new Error('provider unavailable')
      },
    }
    const client = createRealtimeTranscriptionClient({
      provider,
      createSessionId: () => 'rt-failed',
      onEvent: (event) => events.push(event),
    })

    await expect(client.start()).rejects.toThrow('provider unavailable')
    expect(events).toHaveLength(1)
    expect(events[0]?.type).toBe('error')
  })
})

describe('calculateTranscriptionAccuracy', () => {
  it('reports word error rate and accuracy metrics', () => {
    const metrics = calculateTranscriptionAccuracy('hello brave world', 'hello world')

    expect(metrics).toMatchObject({
      referenceWordCount: 3,
      hypothesisWordCount: 2,
      substitutions: 0,
      insertions: 0,
      deletions: 1,
    })
    expect(metrics.wordErrorRate).toBeCloseTo(1 / 3)
    expect(metrics.accuracy).toBeCloseTo(2 / 3)
  })

  it('handles empty references explicitly', () => {
    expect(calculateTranscriptionAccuracy('', 'extra words')).toMatchObject({
      referenceWordCount: 0,
      hypothesisWordCount: 2,
      wordErrorRate: 1,
      accuracy: 0,
    })
  })
})
