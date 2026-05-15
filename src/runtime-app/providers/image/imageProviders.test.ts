import { describe, expect, it } from 'bun:test'
import { ComfyImageProvider } from './comfyImageProvider.js'
import { FalImageProvider } from './falImageProvider.js'

describe('advanced image providers', () => {
  it('returns downloaded image bytes from fal', async () => {
    let callCount = 0
    const provider = new FalImageProvider({
      apiKey: 'key',
      model: 'fal-ai/fast-sdxl',
      timeoutMs: 5_000,
      retryLimit: 0,
      pollIntervalMs: 0,
      sleep: async () => undefined,
      fetchFn: async url => {
        callCount += 1
        if (String(url).includes('/status')) {
          return Response.json({ status: 'COMPLETED' })
        }
        if (String(url).includes('/requests/')) {
          return Response.json({ response: { images: [{ url: 'https://assets.example/image.png' }] } })
        }
        if (String(url).startsWith('https://assets.example/')) {
          return new Response('png-data', { status: 200, headers: { 'content-type': 'image/png' } })
        }
        return Response.json({ request_id: 'req-1' })
      },
    })

    const result = await provider.generateImage({
      prompt: 'sunrise',
      seed: 7,
      size: { width: 512, height: 512 },
    })

    expect(callCount).toBeGreaterThanOrEqual(3)
    expect(new TextDecoder().decode(result.artifact.data)).toBe('png-data')
    expect(result.seed).toBe(7)
  })

  it('preserves reproducibility parameters for comfy requests', async () => {
    let body: string | undefined
    const provider = new ComfyImageProvider({
      baseUrl: 'http://127.0.0.1:8188',
      defaultModel: 'workflow-a',
      timeoutMs: 5_000,
      retryLimit: 0,
      pollIntervalMs: 0,
      sleep: async () => undefined,
      fetchFn: async (_url, init) => {
        const url = String(_url)
        if (url.includes('/history/')) {
          return Response.json({
            'prompt-1': {
              outputs: {
                final: {
                  images: [{ filename: 'image.png', subfolder: '', type: 'output' }],
                },
              },
            },
          })
        }
        if (url.includes('/view?')) {
          return new Response('png-data', { status: 200, headers: { 'content-type': 'image/png' } })
        }
        body = String(init?.body)
        return Response.json({ prompt_id: 'prompt-1' })
      },
    })

    await provider.generateImage({
      prompt: 'robot',
      seed: 42,
      steps: 20,
      model: 'workflow-a',
      size: { width: 1024, height: 1024 },
    })

    expect(body).toContain('"seed":42')
    expect(body).toContain('"steps":20')
    expect(body).toContain('"ckpt_name":"workflow-a"')
  })

  it('normalizes missing image responses as descriptive errors', async () => {
    const provider = new ComfyImageProvider({
      baseUrl: 'http://127.0.0.1:8188',
      defaultModel: 'workflow-a',
      timeoutMs: 5_000,
      retryLimit: 0,
      pollIntervalMs: 0,
      sleep: async () => undefined,
      fetchFn: async () => Response.json({}),
    })

    await expect(
      provider.generateImage({ prompt: 'empty', size: { width: 512, height: 512 } }),
    ).rejects.toMatchObject({
      provider: 'comfy',
    })
  })
})
