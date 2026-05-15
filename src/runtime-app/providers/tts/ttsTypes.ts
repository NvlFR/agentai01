import type { ProviderBinaryArtifact } from './shared/providerCommon.js'

export type TtsSynthesisRequest = {
  text: string
  voiceId?: string
  model?: string
  format?: string
  locale?: string
  persistToDisk?: boolean
}

export type TtsSynthesisResult = {
  provider: string
  voiceId: string
  model: string
  artifact: ProviderBinaryArtifact
  latencyMs: number
  attempts: number
}

export interface TtsProvider {
  synthesize(request: TtsSynthesisRequest): Promise<TtsSynthesisResult>
}
