import { redactSecrets } from '../../logging/redaction.js'

export type ToolUseRecord = {
  readonly toolName: string
  readonly summary: string
}

export function summarizeToolUse(records: readonly ToolUseRecord[]): string {
  return records
    .map(record => `- ${record.toolName}: ${redactSecrets(record.summary)}`)
    .join('\n')
}
