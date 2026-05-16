import { readFileSync } from 'node:fs'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { afterEach, describe, expect, it } from 'bun:test'

import { createFileLogWriter } from './file-writer.js'
import type { LogEntry } from './logger.js'

const tempDirectories: string[] = []

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true })
  }
})

describe('createFileLogWriter', () => {
  it('appends one JSON log entry per line', () => {
    const directory = mkdtempSync(join(tmpdir(), 'agentai-logging-'))
    tempDirectories.push(directory)
    const filePath = join(directory, 'runtime.log')
    const writer = createFileLogWriter(filePath)

    const first: LogEntry = {
      timestamp: '2026-05-16T00:00:00.000Z',
      level: 'info',
      message: 'boot complete',
    }
    const second: LogEntry = {
      timestamp: '2026-05-16T00:00:01.000Z',
      level: 'warn',
      subsystem: 'telegram/network',
      message: 'retry scheduled',
    }

    writer(first)
    writer(second)

    const lines = readFileSync(filePath, 'utf8').trim().split('\n')
    expect(lines).toHaveLength(2)
    expect(JSON.parse(lines[0] ?? '')).toEqual(first)
    expect(JSON.parse(lines[1] ?? '')).toEqual(second)
  })
})
