import type { ProviderBinaryArtifact } from '../tts/shared/providerCommon.js'

export type VideoGenerationRequest = {
  prompt: string
  model?: string
  durationSeconds: number
  resolution: string
  outputFormat?: 'mp4' | 'mov'
  promptImageUrl?: string
  persistToDisk?: boolean
}

export type VideoGenerationHandleStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type VideoGenerationHandle = {
  provider: string
  jobId: string
  model: string
  status: VideoGenerationHandleStatus
}

export type VideoGenerationResult = {
  provider: string
  model: string
  handle: VideoGenerationHandle
  artifact: ProviderBinaryArtifact
  attempts: number
  latencyMs: number
}

export interface VideoGenerationProvider {
  submitGeneration(request: VideoGenerationRequest): Promise<VideoGenerationHandle>
  pollGeneration(handle: VideoGenerationHandle): Promise<VideoGenerationHandle>
  retrieveGeneration(handle: VideoGenerationHandle): Promise<VideoGenerationResult>
  cleanupGeneration(handle: VideoGenerationHandle): Promise<void>
  generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult>
}
