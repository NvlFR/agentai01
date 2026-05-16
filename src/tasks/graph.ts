// Adapted from referensi/openclaw/src/tasks/graph.ts
import type { RegisteredTask, TaskId } from './types.js'

export function wouldCreateCycle(
  taskId: TaskId,
  dependencies: readonly TaskId[],
  getTask: (id: TaskId) => RegisteredTask | undefined
): boolean {
  const visit = (current: TaskId, seen: ReadonlySet<TaskId>): boolean => {
    if (current === taskId) {
      return true
    }

    const task = getTask(current)
    if (!task || seen.has(current)) {
      return false
    }

    return (task.depends_on ?? []).some(entry => visit(entry, new Set([...seen, current])))
  }

  return dependencies.some(dependency => visit(dependency, new Set()))
}

export function sortTasksTopologically(tasks: readonly RegisteredTask[]): RegisteredTask[] {
  const sorted: RegisteredTask[] = []
  const visited = new Set<TaskId>()
  const visiting = new Set<TaskId>()
  const taskMap = new Map(tasks.map(t => [t.id, t]))

  function visit(taskId: TaskId) {
    if (visited.has(taskId)) return
    if (visiting.has(taskId)) throw new Error(`Cycle detected at ${taskId}`)

    visiting.add(taskId)
    const task = taskMap.get(taskId)
    if (task) {
      for (const depId of task.depends_on ?? []) {
        visit(depId)
      }
      sorted.push(task)
    }
    visiting.delete(taskId)
    visited.add(taskId)
  }

  for (const task of tasks) {
    visit(task.id)
  }

  return sorted
}
