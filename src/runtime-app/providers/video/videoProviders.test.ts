import { describe, expect, it } from 'bun:test'
import { RunwayVideoProvider } from './runwayVideoProvider.js'
import { VydraVideoProvider } from './vydraVideoProvider.js'

describe('advanced video providers', () => {
  it('supports submit-poll lifecycle for runway', async () => {
    let call = 0
    const provider = new RunwayVideoProvider({
      apiKey: 'key',
      model: 'gen4.5',
      timeoutMs: 5_000,
      retryLimit: 0,
      pollIntervalMs: 0,
      sleep: async () => undefined,
      fetchFn: async (_url, init) => {
        call += 1
        if (init?.method === 'POST') {
          return Response.json({ id: 'job-1' })
        }
        if (call === 2 || call === 3) {
          return Response.json({ status: 'SUCCEEDED', output: ['https://example.com/video.mp4'] })
        }
        return new Response('video-data', { status: 200, headers: { 'content-type': 'video/mp4' } })
      },
    })

    const result = await provider.generateVideo({
      prompt: 'launch demo',
      model: 'gen4',
      durationSeconds: 4,
      resolution: '1280x720',
    })

    expect(call).toBe(4)
    expect(result.handle.status).toBe('completed')
    expect(new TextDecoder().decode(result.artifact.data)).toBe('video-data')
  })

  it('normalizes missing job ids as descriptive errors', async () => {
    const provider = new VydraVideoProvider({
      apiKey: 'key',
      model: 'veo3',
      timeoutMs: 5_000,
      retryLimit: 0,
      pollIntervalMs: 0,
      sleep: async () => undefined,
      fetchFn: async () => Response.json({}),
    })

    await expect(
      provider.submitGeneration({
        prompt: 'scene',
        durationSeconds: 4,
        resolution: '1280x720',
      }),
    ).rejects.toMatchObject({
      provider: 'vydra',
    })
  })
})
