// Adapted using referensi/openclaw/src/tools/result.ts
import { isRecord, ok, type Result } from '../shared/index.js'
import type { ToolError, ToolErrorCode } from './types.js'

export type ToolExecutionResult<TOutput = unknown> = Result<
  {
    readonly output: TOutput
    readonly metadata?: Record<string, unknown>
  },
  ToolError
>

export function normalizeToolResult<TOutput>(
  output: TOutput,
  metadata?: Record<string, unknown>,
): ToolExecutionResult<TOutput> {
  return ok(metadata ? { output, metadata } : { output })
}

export function normalizeToolError(
  error: unknown,
  code: ToolErrorCode = 'execution_failed',
  retryable = false,
): ToolError {
  if (isToolError(error)) {
    return error
  }

  if (error instanceof Error) {
    return createToolError(code, error.message, retryable, { name: error.name })
  }

  return createToolError(code, String(error), retryable)
}

export function createToolError(
  code: ToolErrorCode,
  message: string,
  retryable: boolean,
  details?: Record<string, unknown>,
): ToolError {
  return details ? { code, message, retryable, details } : { code, message, retryable }
}

export function isToolError(value: unknown): value is ToolError {
  return (
    isRecord(value) &&
    typeof value['code'] === 'string' &&
    typeof value['message'] === 'string' &&
    typeof value['retryable'] === 'boolean'
  )
}
