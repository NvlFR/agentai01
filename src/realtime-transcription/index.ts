export type RealtimeTranscriptionLanguage = string

export type TranscriptionAudioChunk = {
  chunkId: string
  audio: Uint8Array
  sampleRateHz: number
  timestamp: Date
}

export type TranscriptionSegment = {
  id: string
  text: string
  isFinal: boolean
  startMs?: number
  endMs?: number
  confidence?: number
  language?: RealtimeTranscriptionLanguage
}

export type TranscriptionStreamEvent =
  | { type: 'session_started'; sessionId: string; providerId: string }
  | { type: 'partial'; sessionId: string; segment: TranscriptionSegment }
  | { type: 'final'; sessionId: string; segment: TranscriptionSegment }
  | { type: 'session_closed'; sessionId: string }
  | { type: 'error'; sessionId: string; error: Error }

export type RealtimeTranscriptionSession = {
  id: string
  write(chunk: TranscriptionAudioChunk): Promise<void>
  close(): Promise<void>
}

export type RealtimeTranscriptionProvider = {
  id: string
  startSession(options: {
    sessionId: string
    language?: RealtimeTranscriptionLanguage
    onEvent: (event: TranscriptionStreamEvent) => void
  }): Promise<RealtimeTranscriptionSession>
}

export type RealtimeTranscriptionClientOptions = {
  provider: RealtimeTranscriptionProvider
  createSessionId?: () => string
  onEvent?: (event: TranscriptionStreamEvent) => void
}

export type TranscriptionAccuracyMetrics = {
  referenceWordCount: number
  hypothesisWordCount: number
  substitutions: number
  insertions: number
  deletions: number
  wordErrorRate: number
  accuracy: number
}

export function createRealtimeTranscriptionClient(options: RealtimeTranscriptionClientOptions): {
  start(options?: { language?: RealtimeTranscriptionLanguage }): Promise<RealtimeTranscriptionSession>
} {
  const createSessionId = options.createSessionId ?? (() => crypto.randomUUID())

  return {
    async start(startOptions = {}) {
      const sessionId = createSessionId()
      const forwardEvent = (event: TranscriptionStreamEvent): void => {
        options.onEvent?.(event)
      }
      let providerSession: RealtimeTranscriptionSession

      try {
        providerSession = await options.provider.startSession({
          sessionId,
          language: startOptions.language,
          onEvent: forwardEvent,
        })
      } catch (error) {
        forwardEvent({ type: 'error', sessionId, error: normalizeError(error) })
        throw error
      }

      forwardEvent({
        type: 'session_started',
        sessionId,
        providerId: options.provider.id,
      })

      let closed = false

      return {
        id: sessionId,
        async write(chunk) {
          if (closed) {
            throw new Error(`Realtime transcription session "${sessionId}" is closed`)
          }

          await providerSession.write({
            ...chunk,
            audio: chunk.audio.slice(),
          })
        },
        async close() {
          if (closed) {
            return
          }

          closed = true
          await providerSession.close()
          forwardEvent({ type: 'session_closed', sessionId })
        },
      }
    },
  }
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  return new Error(String(error))
}

export function calculateTranscriptionAccuracy(
  reference: string,
  hypothesis: string,
): TranscriptionAccuracyMetrics {
  const referenceWords = tokenizeWords(reference)
  const hypothesisWords = tokenizeWords(hypothesis)
  const matrix = createEditMatrix(referenceWords, hypothesisWords)
  const edits = backtrackEdits(referenceWords, hypothesisWords, matrix)
  const errors = edits.substitutions + edits.insertions + edits.deletions
  const denominator = referenceWords.length
  const wordErrorRate = denominator === 0 ? (hypothesisWords.length === 0 ? 0 : 1) : errors / denominator

  return {
    referenceWordCount: referenceWords.length,
    hypothesisWordCount: hypothesisWords.length,
    substitutions: edits.substitutions,
    insertions: edits.insertions,
    deletions: edits.deletions,
    wordErrorRate,
    accuracy: Math.max(0, 1 - wordErrorRate),
  }
}

function tokenizeWords(value: string): string[] {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 0)
}

function createEditMatrix(reference: readonly string[], hypothesis: readonly string[]): number[][] {
  const matrix: number[][] = Array.from({ length: reference.length + 1 }, () =>
    Array.from({ length: hypothesis.length + 1 }, () => 0),
  )

  for (let row = 0; row <= reference.length; row += 1) {
    matrix[row]![0] = row
  }

  for (let column = 0; column <= hypothesis.length; column += 1) {
    matrix[0]![column] = column
  }

  for (let row = 1; row <= reference.length; row += 1) {
    for (let column = 1; column <= hypothesis.length; column += 1) {
      const substitutionCost = reference[row - 1] === hypothesis[column - 1] ? 0 : 1
      matrix[row]![column] = Math.min(
        matrix[row - 1]![column]! + 1,
        matrix[row]![column - 1]! + 1,
        matrix[row - 1]![column - 1]! + substitutionCost,
      )
    }
  }

  return matrix
}

function backtrackEdits(
  reference: readonly string[],
  hypothesis: readonly string[],
  matrix: readonly (readonly number[])[],
): Pick<TranscriptionAccuracyMetrics, 'substitutions' | 'insertions' | 'deletions'> {
  let row = reference.length
  let column = hypothesis.length
  let substitutions = 0
  let insertions = 0
  let deletions = 0

  while (row > 0 || column > 0) {
    if (
      row > 0 &&
      column > 0 &&
      reference[row - 1] === hypothesis[column - 1] &&
      matrix[row]![column] === matrix[row - 1]![column - 1]
    ) {
      row -= 1
      column -= 1
      continue
    }

    if (
      row > 0 &&
      column > 0 &&
      matrix[row]![column] === matrix[row - 1]![column - 1]! + 1
    ) {
      substitutions += 1
      row -= 1
      column -= 1
      continue
    }

    if (column > 0 && matrix[row]![column] === matrix[row]![column - 1]! + 1) {
      insertions += 1
      column -= 1
      continue
    }

    deletions += 1
    row -= 1
  }

  return { substitutions, insertions, deletions }
}
