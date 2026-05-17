import { afterEach, describe, expect, it } from 'bun:test'
import { createOpenAICompatibleSpeechProvider } from './provider.js'

describe('createOpenAICompatibleSpeechProvider', () => {
  const originalEnv = snapshotEnv()

  afterEach(() => {
    resetEnv(originalEnv)
  })

  it('uses AI_BASE_URL and AI_API_KEY from env when config does not override them', async () => {
    process.env['AI_API_KEY'] = 'sk-env-key'
    process.env['AI_BASE_URL'] = 'http://127.0.0.1:9000/v1'
    process.env['AI_MODEL'] = 'env-shared-model'
    process.env['AI_TRANSCRIBE_MODEL'] = 'env-transcribe-model'

    const captured: Array<Record<string, string>> = []
    const provider = createOpenAICompatibleSpeechProvider({
      createClient(options) {
        captured.push({
          apiKey: (options.apiKey as string) ?? '',
          baseURL: options.baseURL ?? '',
        })

        return {
          audio: {
            speech: {
              async create(body) {
                expect(body.model).toBe('env-shared-model')
                return new Response(new Uint8Array([1, 2, 3]))
              },
            },
            transcriptions: {
              async create(body) {
                expect(body.model).toBe('env-transcribe-model')
                return { text: 'hello world' }
              },
            },
          },
        }
      },
    })

    await provider.synthesize('hello')
    await provider.transcribe(new Uint8Array([9, 8, 7]), { mimeType: 'audio/wav' })

    expect(captured).toEqual([
      {
        apiKey: 'sk-env-key',
        baseURL: 'http://127.0.0.1:9000/v1',
      },
    ])
  })

  it('adapts synthesize and transcribe responses from the OpenAI client', async () => {
    const provider = createOpenAICompatibleSpeechProvider({
      apiKey: 'sk-local',
      baseURL: 'http://localhost:8045/v1',
      synthesizeModel: 'speech-model',
      transcribeModel: 'transcribe-model',
      defaultVoice: 'sage',
      defaultFormat: 'wav',
      client: {
        audio: {
          speech: {
            async create(body) {
              expect(body).toMatchObject({
                input: 'speak now',
                model: 'speech-model',
                voice: 'sage',
                response_format: 'wav',
              })
              return new Response(new Uint8Array([4, 5, 6]))
            },
          },
          transcriptions: {
            async create(body) {
              expect(body.file.name).toBe('sample.wav')
              expect(body.file.type).toBe('audio/wav')
              expect(body.model).toBe('transcribe-model')
              return { text: 'transcribed output' }
            },
          },
        },
      },
    })

    const synthesis = await provider.synthesize('speak now')
    const transcription = await provider.transcribe(new Uint8Array([4, 5, 6]), {
      mimeType: 'audio/wav',
      fileName: 'sample.wav',
    })

    expect(synthesis).toMatchObject({
      providerId: 'openai-compatible-speech',
      model: 'speech-model',
      voice: 'sage',
      format: 'wav',
      mimeType: 'audio/wav',
    })
    expect([...synthesis.audio]).toEqual([4, 5, 6])
    expect(transcription).toEqual({
      providerId: 'openai-compatible-speech',
      model: 'transcribe-model',
      text: 'transcribed output',
      raw: { text: 'transcribed output' },
    })
  })
})

function resetEnv(env: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key]
      continue
    }

    process.env[key] = value
  }
}

function snapshotEnv(): Record<string, string | undefined> {
  return {
    AI_API_KEY: readEnv('AI_API_KEY'),
    AI_BASE_URL: readEnv('AI_BASE_URL'),
    AI_MODEL: readEnv('AI_MODEL'),
    AI_TRANSCRIBE_MODEL: readEnv('AI_TRANSCRIBE_MODEL'),
  }
}

function readEnv(name: string): string | undefined {
  const value = process.env[name]
  return typeof value === 'string' ? value : undefined
}
