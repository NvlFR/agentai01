// src/runtime-app/generation/generationCore.ts
// Image and Video Generation Core abstractions.

export type ImageGenerationRequest = {
  prompt: string
  negativePrompt?: string
  aspectRatio?: '1:1' | '16:9' | '4:3' | '9:16'
  size?: { width: number; height: number }
  model?: string
  numImages?: number
}

export type ImageGenerationResponse = {
  images: Array<{
    url?: string
    base64?: string
    seed?: number
  }>
  raw?: unknown
}

export type VideoGenerationRequest = {
  prompt?: string
  imageUri?: string
  duration?: number // in seconds
  aspectRatio?: '1:1' | '16:9' | '9:16'
  model?: string
}

export type VideoGenerationResponse = {
  videoUri: string
  previewImageUri?: string
  raw?: unknown
}

export interface ImageGenerator {
  readonly id: string
  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>
}

export interface VideoGenerator {
  readonly id: string
  generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse>
}

export class GenerationError extends Error {
  readonly toolId: string
  readonly retryable: boolean

  constructor(args: { toolId: string; message: string; retryable: boolean; cause?: unknown }) {
    super(args.message, args.cause ? { cause: args.cause } : undefined)
    this.name = 'GenerationError'
    this.toolId = args.toolId
    this.retryable = args.retryable
  }
}
