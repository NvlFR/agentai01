import { generateMedia, type GeneratedMediaArtifact, type MediaGenerationProvider, type MediaResultStore } from '../media-generation/index.js'

export type VideoGenerationProvider = MediaGenerationProvider & {
  supports: readonly ['video', ...Array<'video'>]
}

export type VideoGenerationRequest = {
  prompt: string
  model?: string
  options?: Record<string, unknown>
  signal?: AbortSignal
}

export async function generateVideo(
  request: VideoGenerationRequest,
  providers: readonly MediaGenerationProvider[],
  store?: MediaResultStore,
): Promise<GeneratedMediaArtifact> {
  return generateMedia({ ...request, kind: 'video' }, providers, store)
}
