export type ErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'locked'
  | 'not_found'
  | 'conflict'
  | 'method_not_allowed'
  | 'internal_error'
  | 'rate_limited'
  | 'webhook_unconfigured'
  | 'webhook_verification_failed'
  | 'webhook_replay_rejected'
  | 'channel_unconfigured'

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError
}
