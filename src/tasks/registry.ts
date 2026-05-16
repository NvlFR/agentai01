// Adapted from referensi/openclaw/src/tasks/registry.ts
import { err, ok, type Result } from '../shared/index.js'
import { wouldCreateCycle } from './graph.js'
import { canTransition } from './transitions.js'
import type {
  RegisteredTask,
  TaskDefinition,
  TaskId,
  TaskRegistryError,
  TaskRegistryErrorCode,
  TaskResult,
  TaskSnapshot,
  TaskState,
} from './types.js'

export class TaskRegistry {
  readonly #tasks = new Map<TaskId, RegisteredTask>()
  readonly #results = new Map<TaskId, TaskResult>()
  readonly #now: () => Date

  constructor(options: { readonly now?: () => Date } = {}) {
    this.#now = options.now ?? (() => new Date())
  }

  register<TInput>(definition: TaskDefinition<TInput>): Result<RegisteredTask<TInput>, TaskRegistryError> {
    if (this.#tasks.has(definition.id)) {
      return err(error('duplicate', `Task "${definition.id}" is already registered.`, definition.id))
    }

    for (const dependency of definition.depends_on ?? []) {
      if (!this.#tasks.has(dependency)) {
        return err(error('missing-dependency', `Task "${definition.id}" depends on missing task "${dependency}".`, definition.id))
      }
    }

    if (wouldCreateCycle(definition.id, definition.depends_on ?? [], id => this.#tasks.get(id))) {
      return err(error('cycle', `Task "${definition.id}" would create a dependency cycle.`, definition.id))
    }

    const timestamp = this.#timestamp()
    const task: RegisteredTask<TInput> = {
      ...definition,
      state: this.#isReady(definition.depends_on ?? []) ? 'ready' : 'pending',
      created_at: timestamp,
      updated_at: timestamp,
    }
    this.#tasks.set(task.id, task)
    return ok(task)
  }

  get(taskId: TaskId): Result<RegisteredTask, TaskRegistryError> {
    const task = this.#tasks.get(taskId)
    return task ? ok(task) : err(error('not-found', `Task "${taskId}" is not registered.`, taskId))
  }

  listReady(): readonly RegisteredTask[] {
    this.#refreshPendingTasks()
    return [...this.#tasks.values()].filter(task => task.state === 'ready')
  }

  transition(taskId: TaskId, nextState: TaskState): Result<RegisteredTask, TaskRegistryError> {
    const task = this.#tasks.get(taskId)
    if (!task) {
      return err(error('not-found', `Task "${taskId}" is not registered.`, taskId))
    }

    if (!canTransition(task.state, nextState)) {
      return err(error('invalid-transition', `Cannot transition task "${taskId}" from ${task.state} to ${nextState}.`, taskId))
    }

    const updated = { ...task, state: nextState, updated_at: this.#timestamp() }
    this.#tasks.set(taskId, updated)
    return ok(updated)
  }

  storeResult<TOutput>(result: Omit<TaskResult<TOutput>, 'finished_at'> & { readonly finished_at?: string }): Result<TaskResult<TOutput>, TaskRegistryError> {
    const task = this.#tasks.get(result.task_id)
    if (!task) {
      return err(error('not-found', `Task "${result.task_id}" is not registered.`, result.task_id))
    }

    const stored: TaskResult<TOutput> = {
      ...result,
      finished_at: result.finished_at ?? this.#timestamp(),
    }
    this.#results.set(result.task_id, stored)
    const state: TaskState = result.status === 'succeeded' ? 'succeeded' : result.status
    this.#tasks.set(task.id, { ...task, state, updated_at: stored.finished_at })
    this.#refreshPendingTasks()
    return ok(stored)
  }

  result(taskId: TaskId): Result<TaskResult, TaskRegistryError> {
    const result = this.#results.get(taskId)
    return result ? ok(result) : err(error('not-found', `Result for task "${taskId}" is not stored.`, taskId))
  }

  snapshot(): TaskSnapshot {
    return {
      tasks: [...this.#tasks.values()],
      results: [...this.#results.values()],
    }
  }

  #refreshPendingTasks(): void {
    for (const task of this.#tasks.values()) {
      if (task.state === 'pending' && this.#isReady(task.depends_on ?? [])) {
        this.#tasks.set(task.id, { ...task, state: 'ready', updated_at: this.#timestamp() })
      }
    }
  }

  #isReady(dependencies: readonly TaskId[]): boolean {
    return dependencies.every(taskId => this.#tasks.get(taskId)?.state === 'succeeded')
  }

  #timestamp(): string {
    return this.#now().toISOString()
  }
}

function error(code: TaskRegistryErrorCode, message: string, taskId?: TaskId): TaskRegistryError {
  return taskId ? { code, message, task_id: taskId } : { code, message }
}
