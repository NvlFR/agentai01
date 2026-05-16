import { generateMedia, type GeneratedMediaArtifact, type MediaGenerationProvider, type MediaResultStore } from '../media-generation/index.js'

export type MusicGenerationProvider = MediaGenerationProvider & {
  supports: readonly ['audio', ...Array<'audio'>]
}

export type MusicGenerationRequest = {
  prompt: string
  model?: string
  options?: Record<string, unknown>
  signal?: AbortSignal
}

export async function generateMusic(
  request: MusicGenerationRequest,
  providers: readonly MediaGenerationProvider[],
  store?: MediaResultStore,
): Promise<GeneratedMediaArtifact> {
  return generateMedia({ ...request, kind: 'audio' }, providers, store)
}
