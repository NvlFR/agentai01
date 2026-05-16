import { isRecord } from './guard.js'

export type DeepPath = ReadonlyArray<string | number>

export type DeepMapVisit =
  | { handled: true; value: unknown }
  | { handled: false }

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`)
}

export function mapDeep(
  value: unknown,
  visit: (value: unknown, path: DeepPath) => DeepMapVisit,
  path: DeepPath = [],
): unknown {
  const decision = visit(value, path)
  if (decision.handled) {
    return decision.value
  }

  if (Array.isArray(value)) {
    return value.map((entry, index) => mapDeep(entry, visit, [...path, index]))
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        mapDeep(entryValue, visit, [...path, key]),
      ]),
    )
  }

  return value
}
