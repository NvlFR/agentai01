import { generateId } from '../shared/index.js'
import type { MediaKind } from '../media/index.js'

export type GeneratedMediaArtifact = {
  id: string
  kind: Exclude<MediaKind, 'unknown'>
  mime: string
  bytes?: Uint8Array
  uri?: string
  prompt: string
  provider_id: string
  model?: string
  metadata?: Record<string, unknown>
}

export type MediaGenerationRequest = {
  kind: Exclude<MediaKind, 'unknown'>
  prompt: string
  model?: string
  options?: Record<string, unknown>
  signal?: AbortSignal
}

export type MediaGenerationProvider = {
  id: string
  supports: readonly Exclude<MediaKind, 'unknown'>[]
  generate: (request: MediaGenerationRequest) => Promise<Omit<GeneratedMediaArtifact, 'id' | 'provider_id'>>
}

export type MediaResultStore = {
  save: (artifact: GeneratedMediaArtifact) => Promise<GeneratedMediaArtifact>
  get: (id: string) => Promise<GeneratedMediaArtifact | undefined>
  list: () => Promise<GeneratedMediaArtifact[]>
}

export function createInMemoryMediaResultStore(): MediaResultStore {
  const artifacts = new Map<string, GeneratedMediaArtifact>()
  return {
    async save(artifact) {
      artifacts.set(artifact.id, cloneArtifact(artifact))
      return cloneArtifact(artifact)
    },
    async get(id) {
      const artifact = artifacts.get(id)
      return artifact ? cloneArtifact(artifact) : undefined
    },
    async list() {
      return [...artifacts.values()].map(cloneArtifact)
    },
  }
}

export async function generateMedia(
  request: MediaGenerationRequest,
  providers: readonly MediaGenerationProvider[],
  store: MediaResultStore = createInMemoryMediaResultStore(),
): Promise<GeneratedMediaArtifact> {
  const errors: string[] = []
  for (const provider of providers) {
    if (!provider.supports.includes(request.kind)) {
      continue
    }

    try {
      const generated = await provider.generate(request)
      return await store.save({
        ...generated,
        id: generateId('media'),
        kind: request.kind,
        prompt: request.prompt,
        provider_id: provider.id,
      })
    } catch (error) {
      errors.push(`${provider.id}: ${error instanceof Error ? error.message : 'failed'}`)
    }
  }

  throw new Error(`No media generation provider succeeded for ${request.kind}: ${errors.join('; ')}`)
}

function cloneArtifact(artifact: GeneratedMediaArtifact): GeneratedMediaArtifact {
  return {
    ...artifact,
    bytes: artifact.bytes ? new Uint8Array(artifact.bytes) : undefined,
    metadata: artifact.metadata ? { ...artifact.metadata } : undefined,
  }
}
