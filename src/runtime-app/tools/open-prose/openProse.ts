import type {
  ProviderResponse,
  ProviderTextGenerationRequest,
} from '../../providers/openaiCompatibleProvider.js'

export type OpenProseMode =
  | 'generate'
  | 'expand'
  | 'condense'
  | 'rewrite'
  | 'proofread'

export type OpenProseTone = 'formal' | 'informal'
export type OpenProseFormat = 'markdown' | 'text'

export type OpenProseRequest = {
  mode: OpenProseMode
  input: string
  tone?: OpenProseTone
  targetLength?: number
  format?: OpenProseFormat
}

export type OpenProseResult = {
  content: string
  truncated: boolean
  mode: OpenProseMode
  tone: OpenProseTone
  format: OpenProseFormat
  provider: {
    model: string
    latencyMs: number
    attempts: number
  }
}

export type TextGenerationProvider = {
  generateText(request: ProviderTextGenerationRequest): Promise<ProviderResponse>
}

export class OpenProseTool {
  constructor(private readonly provider: TextGenerationProvider) {}

  async run(request: OpenProseRequest): Promise<OpenProseResult> {
    const tone = request.tone ?? 'formal'
    const format = request.format ?? 'markdown'
    const targetLength = normalizeTargetLength(request.targetLength)
    const input = request.input.trim()

    if (!input) {
      throw new Error('Open Prose input is required.')
    }

    const response = await this.provider.generateText({
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(request.mode, tone, format, targetLength),
        },
        {
          role: 'user',
          content: input,
        },
      ],
      temperature: request.mode === 'proofread' ? 0.1 : 0.4,
      maxTokens: targetLength ? Math.max(256, Math.ceil(targetLength * 1.5)) : 1200,
      metadata: {
        tool: 'open-prose',
        mode: request.mode,
        tone,
        format,
      },
    })

    const normalized = normalizeOutput(response.content, format)
    const content = targetLength ? trimToTargetLength(normalized, targetLength) : normalized

    return {
      content,
      truncated: normalized.length !== content.length,
      mode: request.mode,
      tone,
      format,
      provider: {
        model: response.model,
        latencyMs: response.latencyMs,
        attempts: response.attempts,
      },
    }
  }
}

export function createOpenProseTool(provider: TextGenerationProvider): OpenProseTool {
  return new OpenProseTool(provider)
}

function buildSystemPrompt(
  mode: OpenProseMode,
  tone: OpenProseTone,
  format: OpenProseFormat,
  targetLength: number | null,
): string {
  const base = [
    'You are Open Prose, a long-form writing and editing assistant.',
    `Mode: ${mode}.`,
    `Tone: ${tone}.`,
    `Output format: ${format}.`,
    'Return substantive content only.',
  ]

  if (targetLength) {
    base.push(`Aim for at most ${targetLength} characters while preserving clarity.`)
  }

  switch (mode) {
    case 'generate':
      base.push('Generate polished long-form prose from the provided outline or brief.')
      break
    case 'expand':
      base.push('Expand the material with more detail, examples, and connective tissue.')
      break
    case 'condense':
      base.push('Condense the material while preserving the main message.')
      break
    case 'rewrite':
      base.push('Rewrite the material with improved flow and readability.')
      break
    case 'proofread':
      base.push('Proofread carefully, correcting grammar and clarity issues.')
      break
  }

  return base.join(' ')
}

function normalizeTargetLength(targetLength: number | undefined): number | null {
  if (!Number.isFinite(targetLength) || !targetLength || targetLength <= 0) {
    return null
  }

  return Math.floor(targetLength)
}

function normalizeOutput(content: string, format: OpenProseFormat): string {
  const normalized = content.trim()
  if (!normalized) {
    throw new Error('Open Prose provider returned empty content.')
  }

  if (format === 'text') {
    return normalized.replace(/```[\s\S]*?```/g, block => block.replace(/```/g, '')).trim()
  }

  return normalized
}

function trimToTargetLength(content: string, targetLength: number): string {
  if (content.length <= targetLength) {
    return content
  }

  const candidate = content.slice(0, targetLength).trimEnd()
  const sentenceBoundary = Math.max(
    candidate.lastIndexOf('. '),
    candidate.lastIndexOf('! '),
    candidate.lastIndexOf('? '),
    candidate.lastIndexOf('\n'),
  )

  if (sentenceBoundary >= Math.floor(targetLength * 0.6)) {
    return candidate.slice(0, sentenceBoundary + 1).trimEnd()
  }

  return `${candidate}...`
}
