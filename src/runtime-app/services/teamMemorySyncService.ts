import { redactSecrets } from '../../logging/redaction.js'

export type TeamMemoryRecord = {
  readonly projectId: string
  readonly department: string
  readonly content: string
}

export function syncTeamMemory(input: {
  readonly currentProjectId: string
  readonly allowedDepartment: string
  readonly records: readonly TeamMemoryRecord[]
}): readonly TeamMemoryRecord[] {
  return input.records
    .filter(record => record.projectId === input.currentProjectId && record.department === input.allowedDepartment)
    .map(record => ({
      ...record,
      content: redactSecrets(record.content),
    }))
}
