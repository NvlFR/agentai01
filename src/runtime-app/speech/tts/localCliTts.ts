// src/runtime-app/speech/tts/localCliTts.ts
// Local CLI TTS implementation.
// Runs a local command (e.g. espeak, say) to generate speech.
// Config: TTS_CLI_COMMAND (e.g. 'espeak -w {{OutputPath}} "{{Text}}"')
//         TTS_CLI_OUTPUT_FORMAT (mp3, wav — default wav)

import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, rmSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { type TtsRequest, type TtsResponse, SpeechError } from '../speechCore.js'

const DEFAULT_COMMAND = 'espeak -w {{OutputPath}} "{{Text}}"'
const DEFAULT_FORMAT = 'wav'

export class LocalCliTts {
  readonly id = 'tts-local-cli'

  constructor(
    private readonly command: string,
    private readonly outputFormat: 'mp3' | 'wav' = DEFAULT_FORMAT,
  ) {}

  isEnabled(): boolean {
    return Boolean(this.command)
  }

  async tts(request: TtsRequest): Promise<TtsResponse> {
    if (!this.command) {
      throw new SpeechError({
        toolId: this.id,
        message: 'Local CLI TTS: command not configured.',
        retryable: false,
      })
    }

    const tempDir = join(tmpdir(), 'agentai-tts')
    if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true })

    const fileId = randomBytes(8).toString('hex')
    const ext = this.outputFormat === 'mp3' ? '.mp3' : '.wav'
    const outputPath = join(tempDir, `${fileId}${ext}`)

    const cleanText = request.text.replace(/"/g, '\\"')
    const cmdStr = this.command
      .replace(/{{OutputPath}}/g, outputPath)
      .replace(/{{Text}}/g, cleanText)

    // Parse command and args
    const [cmd, ...args] = cmdStr.split(' ')

    return new Promise((resolve, reject) => {
      const proc = spawn(cmd!, args, { stdio: 'inherit' })

      proc.on('error', (err) => {
        reject(new SpeechError({
          toolId: this.id,
          message: `Local CLI TTS: failed to start process — ${err.message}`,
          retryable: false,
          cause: err,
        }))
      })

      proc.on('close', (code) => {
        if (code !== 0) {
          return reject(new SpeechError({
            toolId: this.id,
            message: `Local CLI TTS: process exited with code ${code}`,
            retryable: false,
          }))
        }

        if (!existsSync(outputPath)) {
          return reject(new SpeechError({
            toolId: this.id,
            message: `Local CLI TTS: output file not found at ${outputPath}`,
            retryable: false,
          }))
        }

        try {
          const buffer = readFileSync(outputPath)
          rmSync(outputPath, { force: true })
          resolve({
            audioBuffer: buffer,
            format: this.outputFormat,
          })
        } catch (err) {
          reject(new SpeechError({
            toolId: this.id,
            message: `Local CLI TTS: failed to read output file — ${err instanceof Error ? err.message : 'unknown'}`,
            retryable: false,
            cause: err,
          }))
        }
      })
    })
  }
}

export function createLocalCliTts(): LocalCliTts {
  const command = process.env['TTS_CLI_COMMAND'] ?? DEFAULT_COMMAND
  const format = (process.env['TTS_CLI_OUTPUT_FORMAT'] as 'mp3' | 'wav') ?? DEFAULT_FORMAT
  return new LocalCliTts(command, format)
}
