// Adapted using referensi/openclaw/src/agents/tools/common.ts
export type ActionGate<T extends Record<string, boolean | undefined>> = (
  key: keyof T,
  defaultValue?: boolean,
) => boolean

export type ReactionParams = {
  emoji: string
  remove: boolean
  isEmpty: boolean
}

export class ActionGateParamError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ActionGateParamError'
  }
}

export function createActionGate<T extends Record<string, boolean | undefined>>(
  actions: T | undefined,
): ActionGate<T> {
  return (key, defaultValue = true) => {
    const value = actions?.[key]
    if (value === undefined) {
      return defaultValue
    }

    return value !== false
  }
}

export function jsonResult(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json; charset=utf-8')
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  })
}

export function readStringParam(
  params: Record<string, unknown>,
  key: string,
  options: { required?: boolean; trim?: boolean; label?: string; allowEmpty?: boolean } = {},
): string | undefined {
  const { required = false, trim = true, label = key, allowEmpty = false } = options
  const raw = readParamRaw(params, key)
  if (typeof raw !== 'string') {
    if (required) {
      throw new ActionGateParamError(`${label} required`)
    }

    return undefined
  }

  const value = trim ? raw.trim() : raw
  if (!value && !allowEmpty) {
    if (required) {
      throw new ActionGateParamError(`${label} required`)
    }

    return undefined
  }

  return value
}

export function readNumberParam(
  params: Record<string, unknown>,
  key: string,
  options: { required?: boolean; label?: string; integer?: boolean; strict?: boolean } = {},
): number | undefined {
  const { required = false, label = key, integer = false, strict = false } = options
  const raw = readParamRaw(params, key)
  let value: number | undefined

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    value = raw
  } else if (typeof raw === 'string' && raw.trim()) {
    const parsed = strict ? Number(raw.trim()) : Number.parseFloat(raw.trim())
    if (Number.isFinite(parsed)) {
      value = parsed
    }
  }

  if (value === undefined) {
    if (required) {
      throw new ActionGateParamError(`${label} required`)
    }

    return undefined
  }

  return integer ? Math.trunc(value) : value
}

export function readStringArrayParam(
  params: Record<string, unknown>,
  key: string,
  options: { required?: boolean; label?: string } = {},
): string[] | undefined {
  const { required = false, label = key } = options
  const raw = readParamRaw(params, key)

  if (Array.isArray(raw)) {
    const values = raw
      .filter(entry => typeof entry === 'string')
      .map(entry => entry.trim())
      .filter(Boolean)

    if (values.length > 0) {
      return values
    }
  }

  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(/[\n,;]+/g)
      .map(entry => entry.trim())
      .filter(Boolean)
  }

  if (required) {
    throw new ActionGateParamError(`${label} required`)
  }

  return undefined
}

export function readReactionParams(
  params: Record<string, unknown>,
  options: {
    emojiKey?: string
    removeKey?: string
    removeErrorMessage: string
  },
): ReactionParams {
  const emojiKey = options.emojiKey ?? 'emoji'
  const removeKey = options.removeKey ?? 'remove'
  const remove = readBooleanParam(params, removeKey) ?? false
  const emoji = readStringParam(params, emojiKey, {
    required: true,
    allowEmpty: true,
  }) ?? ''

  if (remove && !emoji) {
    throw new ActionGateParamError(options.removeErrorMessage)
  }

  return {
    emoji,
    remove,
    isEmpty: !emoji,
  }
}

export function parseStrictPositiveInteger(value: unknown, label = 'value'): number {
  const raw =
    typeof value === 'number'
      ? String(value)
      : typeof value === 'string'
        ? value.trim()
        : ''
  if (!/^\d+$/.test(raw)) {
    throw new ActionGateParamError(`${label} must be a positive integer`)
  }

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new ActionGateParamError(`${label} must be a positive integer`)
  }

  return parsed
}

function readParamRaw(params: Record<string, unknown>, key: string): unknown {
  for (const candidate of buildKeyCandidates(key)) {
    if (candidate in params) {
      return params[candidate]
    }
  }

  return undefined
}

function buildKeyCandidates(key: string): string[] {
  const snake = key
    .replace(/[A-Z]/g, match => `_${match.toLowerCase()}`)
    .replace(/-/g, '_')
  const camel = snake.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
  return [...new Set([key, snake, camel])]
}

function readBooleanParam(params: Record<string, unknown>, key: string): boolean | undefined {
  const raw = readParamRaw(params, key)
  if (typeof raw === 'boolean') {
    return raw
  }

  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase()
    if (normalized === 'true') {
      return true
    }
    if (normalized === 'false') {
      return false
    }
  }

  return undefined
}
