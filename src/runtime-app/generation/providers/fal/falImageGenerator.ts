// src/runtime-app/generation/providers/fal/falImageGenerator.ts
// fal.ai image generation implementation.
// Config: FAL_API_KEY

import { type ImageGenerator, type ImageGenerationRequest, type ImageGenerationResponse, GenerationError } from '../../generationCore.js'

const FAL_API_URL = 'https://fal.run'

export class FalImageGenerator implements ImageGenerator {
  readonly id = 'fal-image'

  constructor(private readonly apiKey: string) {}

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.apiKey) {
      throw new GenerationError({
        toolId: this.id,
        message: 'fal.ai: API key missing.',
        retryable: false,
      })
    }

    const model = request.model ?? 'fal-ai/flux/schnell'
    const endpoint = `${FAL_API_URL}/${model}`

    let response: Response
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          image_size: request.aspectRatio?.replace(':', '_') ?? '1024x1024',
          num_inference_steps: 4,
          enable_safety_checker: true,
        }),
      })
    } catch (err) {
      throw new GenerationError({
        toolId: this.id,
        message: `fal.ai: network error — ${err instanceof Error ? err.message : 'unknown'}`,
        retryable: true,
        cause: err,
      })
    }

    if (response.status === 401 || response.status === 403) {
      throw new GenerationError({
        toolId: this.id,
        message: `fal.ai: invalid API key (HTTP ${response.status}).`,
        retryable: false,
      })
    }

    if (!response.ok) {
      const text = await response.text()
      throw new GenerationError({
        toolId: this.id,
        message: `fal.ai: API error (HTTP ${response.status}) — ${text.slice(0, 100)}`,
        retryable: response.status >= 500 || response.status === 429,
      })
    }

    const raw = await response.json() as {
      images?: Array<{ url: string }>
    }

    return {
      images: (raw.images ?? []).map(img => ({ url: img.url })),
      raw,
    }
  }
}

export function createFalImageGenerator(): FalImageGenerator {
  const apiKey = process.env['FAL_API_KEY'] ?? ''
  return new FalImageGenerator(apiKey)
}
