import { generateMedia, type GeneratedMediaArtifact, type MediaGenerationProvider, type MediaResultStore } from '../media-generation/index.js'

export type ImageGenerationProvider = MediaGenerationProvider & {
  supports: readonly ['image', ...Array<'image'>]
}

export type ImageGenerationRequest = {
  prompt: string
  model?: string
  options?: Record<string, unknown>
  signal?: AbortSignal
}

export async function generateImage(
  request: ImageGenerationRequest,
  providers: readonly MediaGenerationProvider[],
  store?: MediaResultStore,
): Promise<GeneratedMediaArtifact> {
  return generateMedia({ ...request, kind: 'image' }, providers, store)
}
