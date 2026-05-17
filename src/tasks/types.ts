// Adapted using referensi/openclaw/src/tasks/types.ts

export const TASK_STATES = ['pending', 'ready', 'running', 'succeeded', 'failed', 'blocked', 'cancelled'] as const
export const TASK_RESULT_STATUSES = ['succeeded', 'failed', 'cancelled'] as const
export const TASK_REGISTRY_ERROR_CODES = [
  'cycle',
  'duplicate',
  'invalid-transition',
  'missing-dependency',
  'not-found',
] as const

export type TaskId = string
export type TaskState = (typeof TASK_STATES)[number]

export type TaskDefinition<TInput = unknown> = {
  readonly id: TaskId
  readonly title: string
  readonly input?: TInput
  readonly depends_on?: readonly TaskId[]
  readonly tags?: readonly string[]
}

export type TaskResult<TOutput = unknown> = {
  readonly task_id: TaskId
  readonly status: (typeof TASK_RESULT_STATUSES)[number]
  readonly output?: TOutput
  readonly error?: string
  readonly finished_at: string
}

export type RegisteredTask<TInput = unknown> = TaskDefinition<TInput> & {
  readonly state: TaskState
  readonly created_at: string
  readonly updated_at: string
}

export type TaskRegistryErrorCode = (typeof TASK_REGISTRY_ERROR_CODES)[number]

export type TaskRegistryError = {
  readonly code: TaskRegistryErrorCode
  readonly message: string
  readonly task_id?: TaskId
}

export type TaskSnapshot = {
  readonly tasks: readonly RegisteredTask[]
  readonly results: readonly TaskResult[]
}

export function isTaskState(value: unknown): value is TaskState {
  return typeof value === 'string' && TASK_STATES.includes(value as TaskState)
}

export function isTaskResultStatus(value: unknown): value is (typeof TASK_RESULT_STATUSES)[number] {
  return typeof value === 'string' && TASK_RESULT_STATUSES.includes(value as (typeof TASK_RESULT_STATUSES)[number])
}

export function isTaskRegistryErrorCode(value: unknown): value is TaskRegistryErrorCode {
  return typeof value === 'string' && TASK_REGISTRY_ERROR_CODES.includes(value as TaskRegistryErrorCode)
}
