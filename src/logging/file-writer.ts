import { appendFileSync } from 'node:fs'

import { formatLogEntry, type LogWriter } from './logger.js'

export function createFileLogWriter(filePath: string): LogWriter {
  return entry => {
    appendFileSync(filePath, `${formatLogEntry(entry, 'json')}\n`, 'utf8')
  }
}
