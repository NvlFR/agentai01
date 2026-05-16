import type { ContextItem, ContextPriority } from './batch.js'

export function scoreContextItem(item: ContextItem, now = new Date()): number {
  const priorityScore = priorityWeight(item.priority)
  const ageMs = Math.max(0, now.getTime() - Date.parse(item.createdAt))
  const recencyScore = Math.max(0, 10 - Math.floor(ageMs / 86_400_000))
  const attributionScore = item.owner.projectId || item.owner.agentId || item.owner.sessionId ? 2 : 0

  return priorityScore + recencyScore + attributionScore
}

function priorityWeight(priority: ContextPriority): number {
  switch (priority) {
    case 'critical':
      return 100
    case 'high':
      return 60
    case 'normal':
      return 30
    case 'low':
      return 10
  }
}
