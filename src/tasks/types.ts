// Adapted from referensi/openclaw/src/tasks/types.ts

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
