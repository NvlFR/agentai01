export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export type Option<T> =
  | { ok: true; value: T }
  | { ok: false }

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}

export function some<T>(value: T): Option<T> {
  return { ok: true, value }
}

export const none: Option<never> = { ok: false }
