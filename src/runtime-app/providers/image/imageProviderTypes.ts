import type { ProviderBinaryArtifact } from '../tts/shared/providerCommon.js'

export type ImageGenerationRequest = {
  prompt: string
  negativePrompt?: string
  model?: string
  size: {
    width: number
    height: number
  }
  steps?: number
  seed?: number
  format?: 'png' | 'jpeg' | 'webp'
  persistToDisk?: boolean
}

export type ImageGenerationResult = {
  provider: string
  model: string
  seed: number | null
  artifact: ProviderBinaryArtifact
  latencyMs: number
  attempts: number
  requestId: string
}

export interface ImageGenerationProvider {
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult>
}
