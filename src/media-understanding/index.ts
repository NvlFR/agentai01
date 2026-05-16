import type { MediaKind } from '../media/index.js'

export type MediaUnderstandingInput = {
  kind: Exclude<MediaKind, 'unknown'>
  bytes?: Uint8Array
  path?: string
  mime?: string
  prompt?: string
}

export type MediaUnderstandingResult = {
  provider_id: string
  text?: string
  structured?: Record<string, unknown>
  confidence?: number
  metadata?: Record<string, unknown>
}

export type MediaUnderstandingProvider = {
  id: string
  supports: readonly MediaKind[]
  understand: (input: MediaUnderstandingInput) => Promise<Omit<MediaUnderstandingResult, 'provider_id'>>
}

export async function runMediaUnderstanding(
  input: MediaUnderstandingInput,
  providers: readonly MediaUnderstandingProvider[],
): Promise<MediaUnderstandingResult> {
  const errors: string[] = []
  for (const provider of providers) {
    if (!provider.supports.includes(input.kind)) {
      continue
    }

    try {
      const result = await provider.understand(input)
      return { ...result, provider_id: provider.id }
    } catch (error) {
      errors.push(`${provider.id}: ${error instanceof Error ? error.message : 'failed'}`)
    }
  }

  throw new Error(`No media understanding provider succeeded for ${input.kind}: ${errors.join('; ')}`)
}
