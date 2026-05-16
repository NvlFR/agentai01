export type TtsAudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac' | 'pcm'

export type TtsFormatOptions = {
  format?: TtsAudioFormat
  sampleRateHz?: number
  channels?: number
  bitRateKbps?: number
}

export type NormalizedTtsFormat = {
  format: TtsAudioFormat
  mimeType: string
  sampleRateHz: number
  channels: number
  bitRateKbps?: number
}

export type TtsSynthesisRequest = {
  text: string
  voice: string
  providerId?: string
  model?: string
  format?: TtsFormatOptions
  cache?: boolean
  metadata?: Readonly<Record<string, string>>
}

export type TtsSynthesisResult = {
  audio: Uint8Array
  format: NormalizedTtsFormat
  providerId: string
  voice: string
  model?: string
  durationMs?: number
  cache: {
    hit: boolean
    key: string
  }
}

export type TtsProviderSynthesisRequest = {
  text: string
  voice: string
  model?: string
  format: NormalizedTtsFormat
  metadata: Readonly<Record<string, string>>
}

export type TtsProvider = {
  id: string
  synthesize(request: TtsProviderSynthesisRequest): Promise<Omit<TtsSynthesisResult, 'cache'>>
}

export type TtsCacheEntry = {
  audio: Uint8Array
  format: NormalizedTtsFormat
  providerId: string
  voice: string
  model?: string
  durationMs?: number
}

export type TtsCache = {
  get(key: string): Promise<TtsCacheEntry | undefined>
  set(key: string, entry: TtsCacheEntry): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
}

export type TtsClientOptions = {
  provider: TtsProvider
  cache?: TtsCache
  defaultFormat?: TtsFormatOptions
}

const FORMAT_MIME_TYPES: Record<TtsAudioFormat, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  pcm: 'audio/L16',
}

const DEFAULT_FORMAT: NormalizedTtsFormat = {
  format: 'mp3',
  mimeType: FORMAT_MIME_TYPES.mp3,
  sampleRateHz: 24_000,
  channels: 1,
}

export class InMemoryTtsCache implements TtsCache {
  readonly #entries = new Map<string, TtsCacheEntry>()

  async get(key: string): Promise<TtsCacheEntry | undefined> {
    const entry = this.#entries.get(key)
    if (!entry) {
      return undefined
    }

    return cloneCacheEntry(entry)
  }

  async set(key: string, entry: TtsCacheEntry): Promise<void> {
    this.#entries.set(key, cloneCacheEntry(entry))
  }

  async delete(key: string): Promise<void> {
    this.#entries.delete(key)
  }

  async clear(): Promise<void> {
    this.#entries.clear()
  }
}

export function normalizeTtsFormat(
  format: TtsFormatOptions | undefined,
  defaults: TtsFormatOptions = {},
): NormalizedTtsFormat {
  const requestedFormat = format?.format ?? defaults.format ?? DEFAULT_FORMAT.format
  const sampleRateHz = normalizePositiveIntegerWithDefault(
    format?.sampleRateHz,
    defaults.sampleRateHz,
    DEFAULT_FORMAT.sampleRateHz,
  )
  const channels = normalizePositiveIntegerWithDefault(
    format?.channels,
    defaults.channels,
    DEFAULT_FORMAT.channels,
  )
  const bitRateKbps = normalizeOptionalPositiveIntegerWithDefault(
    format?.bitRateKbps,
    defaults.bitRateKbps,
  )

  return {
    format: requestedFormat,
    mimeType: FORMAT_MIME_TYPES[requestedFormat],
    sampleRateHz,
    channels,
    ...(bitRateKbps === undefined ? {} : { bitRateKbps }),
  }
}

export function createTtsCacheKey(request: {
  text: string
  voice: string
  providerId: string
  model?: string
  format: NormalizedTtsFormat
}): string {
  return stableStringify({
    text: request.text,
    voice: request.voice,
    providerId: request.providerId,
    model: request.model ?? null,
    format: request.format,
  })
}

export function createTtsClient(options: TtsClientOptions): {
  synthesize(request: TtsSynthesisRequest): Promise<TtsSynthesisResult>
} {
  const cache = options.cache ?? new InMemoryTtsCache()

  return {
    async synthesize(request) {
      const format = normalizeTtsFormat(request.format, options.defaultFormat)
      const providerId = request.providerId ?? options.provider.id
      const cacheKey = createTtsCacheKey({
        text: request.text,
        voice: request.voice,
        providerId,
        model: request.model,
        format,
      })

      if (request.cache !== false) {
        const cached = await cache.get(cacheKey)
        if (cached) {
          return {
            ...cached,
            audio: cached.audio.slice(),
            cache: {
              hit: true,
              key: cacheKey,
            },
          }
        }
      }

      const result = await options.provider.synthesize({
        text: request.text,
        voice: request.voice,
        model: request.model,
        format,
        metadata: request.metadata ?? {},
      })

      const entry: TtsCacheEntry = {
        audio: result.audio.slice(),
        format: { ...result.format },
        providerId: result.providerId,
        voice: result.voice,
        ...(result.model === undefined ? {} : { model: result.model }),
        ...(result.durationMs === undefined ? {} : { durationMs: result.durationMs }),
      }

      if (request.cache !== false) {
        await cache.set(cacheKey, entry)
      }

      return {
        ...entry,
        audio: entry.audio.slice(),
        format: { ...entry.format },
        cache: {
          hit: false,
          key: cacheKey,
        },
      }
    },
  }
}

function cloneCacheEntry(entry: TtsCacheEntry): TtsCacheEntry {
  return {
    ...entry,
    audio: entry.audio.slice(),
    format: { ...entry.format },
  }
}

function normalizePositiveIntegerWithDefault(
  value: number | undefined,
  defaultValue: number | undefined,
  fallback: number,
): number {
  const normalized = normalizeOptionalPositiveInteger(value)
  if (normalized !== undefined) {
    return normalized
  }

  return normalizeOptionalPositiveInteger(defaultValue) ?? fallback
}

function normalizeOptionalPositiveIntegerWithDefault(
  value: number | undefined,
  defaultValue: number | undefined,
): number | undefined {
  return normalizeOptionalPositiveInteger(value) ?? normalizeOptionalPositiveInteger(defaultValue)
}

function normalizeOptionalPositiveInteger(value: number | undefined): number | undefined {
  return value === undefined || !Number.isFinite(value) || value <= 0
    ? undefined
    : Math.trunc(value)
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`
  }

  return JSON.stringify(value)
}
