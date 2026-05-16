import { err, ok, type Result } from '../shared/index.js'

export type TaskId = string
export type TaskState = 'pending' | 'ready' | 'running' | 'succeeded' | 'failed' | 'blocked' | 'cancelled'

export type TaskDefinition<TInput = unknown> = {
  readonly id: TaskId
  readonly title: string
  readonly input?: TInput
  readonly depends_on?: readonly TaskId[]
  readonly tags?: readonly string[]
}

export type TaskResult<TOutput = unknown> = {
  readonly task_id: TaskId
  readonly status: 'succeeded' | 'failed' | 'cancelled'
  readonly output?: TOutput
  readonly error?: string
  readonly finished_at: string
}

export type RegisteredTask<TInput = unknown> = TaskDefinition<TInput> & {
  readonly state: TaskState
  readonly created_at: string
  readonly updated_at: string
}

export type TaskRegistryErrorCode =
  | 'cycle'
  | 'duplicate'
  | 'invalid-transition'
  | 'missing-dependency'
  | 'not-found'

export type TaskRegistryError = {
  readonly code: TaskRegistryErrorCode
  readonly message: string
  readonly task_id?: TaskId
}

export type TaskSnapshot = {
  readonly tasks: readonly RegisteredTask[]
  readonly results: readonly TaskResult[]
}

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

    if (this.#wouldCreateCycle(definition.id, definition.depends_on ?? [])) {
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

  #wouldCreateCycle(taskId: TaskId, dependencies: readonly TaskId[]): boolean {
    const visit = (current: TaskId, seen: ReadonlySet<TaskId>): boolean => {
      if (current === taskId) {
        return true
      }

      const dependency = this.#tasks.get(current)
      if (!dependency || seen.has(current)) {
        return false
      }

      return (dependency.depends_on ?? []).some(entry => visit(entry, new Set([...seen, current])))
    }

    return dependencies.some(dependency => visit(dependency, new Set()))
  }

  #timestamp(): string {
    return this.#now().toISOString()
  }
}

export function canTransition(current: TaskState, next: TaskState): boolean {
  const allowed: Record<TaskState, readonly TaskState[]> = {
    pending: ['ready', 'blocked', 'cancelled'],
    ready: ['running', 'blocked', 'cancelled'],
    running: ['succeeded', 'failed', 'cancelled'],
    succeeded: [],
    failed: ['ready'],
    blocked: ['ready', 'cancelled'],
    cancelled: [],
  }

  return allowed[current].includes(next)
}

function error(code: TaskRegistryErrorCode, message: string, taskId?: TaskId): TaskRegistryError {
  return taskId ? { code, message, task_id: taskId } : { code, message }
}
