import { err, isRecord, ok, type Result } from '../shared/index.js'

export type ConfigIssue = {
  field: string
  message: string
}

export type ConfigReader<T> = (source: Record<string, unknown>, field: string) => Result<T, ConfigIssue>

export type ConfigSchema<T extends Record<string, unknown>> = {
  readonly [K in keyof T]: ConfigReader<T[K]>
}

export type ConfigParseResult<T> =
  | { ok: true; config: T; warnings: ConfigIssue[] }
  | { ok: false; errors: ConfigIssue[]; warnings: ConfigIssue[] }

export function parseConfig<T extends Record<string, unknown>>(
  source: Record<string, unknown>,
  schema: ConfigSchema<T>,
): ConfigParseResult<T> {
  const errors: ConfigIssue[] = []
  const entries: Array<[string, unknown]> = []

  for (const [field, reader] of Object.entries(schema) as Array<
    [keyof T & string, ConfigReader<T[keyof T]>]
  >) {
    const result = reader(source, field)
    if (result.ok) {
      entries.push([field, result.value])
    } else {
      errors.push(result.error)
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors, warnings: [] }
  }

  return {
    ok: true,
    config: Object.fromEntries(entries) as T,
    warnings: [],
  }
}

export function readString(options: {
  env?: string
  defaultValue?: string
  required?: boolean
} = {}): ConfigReader<string> {
  return (source, field) => {
    const value = source[options.env ?? field]
    if (typeof value === 'string' && value.trim().length > 0) {
      return ok(value.trim())
    }

    if (options.defaultValue !== undefined) {
      return ok(options.defaultValue)
    }

    if (options.required ?? true) {
      return err({ field, message: `${field} is required.` })
    }

    return ok('')
  }
}

export function readInteger(options: {
  env?: string
  defaultValue?: number
  min?: number
  max?: number
} = {}): ConfigReader<number> {
  return (source, field) => {
    const rawValue = source[options.env ?? field]
    const value = typeof rawValue === 'number'
      ? rawValue
      : typeof rawValue === 'string'
        ? Number.parseInt(rawValue, 10)
        : options.defaultValue

    if (value === undefined || !Number.isInteger(value)) {
      return err({ field, message: `${field} must be an integer.` })
    }

    if (options.min !== undefined && value < options.min) {
      return err({ field, message: `${field} must be at least ${options.min}.` })
    }

    if (options.max !== undefined && value > options.max) {
      return err({ field, message: `${field} must be at most ${options.max}.` })
    }

    return ok(value)
  }
}

export function readBoolean(options: {
  env?: string
  defaultValue?: boolean
} = {}): ConfigReader<boolean> {
  return (source, field) => {
    const rawValue = source[options.env ?? field]
    if (typeof rawValue === 'boolean') {
      return ok(rawValue)
    }

    if (typeof rawValue === 'string') {
      const normalized = rawValue.trim().toLowerCase()
      if (['1', 'true', 'yes', 'on'].includes(normalized)) {
        return ok(true)
      }
      if (['0', 'false', 'no', 'off'].includes(normalized)) {
        return ok(false)
      }
    }

    if (options.defaultValue !== undefined) {
      return ok(options.defaultValue)
    }

    return err({ field, message: `${field} must be a boolean.` })
  }
}

export function readObject<T extends Record<string, unknown>>(
  schema: ConfigSchema<T>,
): ConfigReader<T> {
  return (source, field) => {
    const value = source[field]
    if (!isRecord(value)) {
      return err({ field, message: `${field} must be an object.` })
    }

    const result = parseConfig(value, schema)
    return result.ok
      ? ok(result.config)
      : err({ field, message: result.errors.map(issue => issue.message).join(' ') })
  }
}

export function envSource(
  env: Record<string, string | undefined>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => entry[1] !== undefined),
  )
}
