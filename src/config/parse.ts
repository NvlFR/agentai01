import type { Result } from '../shared/index.js'

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
      continue
    }

    errors.push(result.error)
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
