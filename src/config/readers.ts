import { err, isRecord, ok } from '../shared/index.js'

import { parseConfig, type ConfigIssue, type ConfigReader, type ConfigSchema } from './parse.js'

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
      : err({
        field,
        message: joinIssueMessages(result.errors),
      })
  }
}

function joinIssueMessages(errors: ConfigIssue[]): string {
  return errors.map(issue => issue.message).join(' ')
}
