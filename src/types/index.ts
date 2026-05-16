export type Brand<TValue, TBrand extends string> = TValue & { readonly __brand: TBrand }

export type AgentId = Brand<string, 'AgentId'>
export type ProjectId = Brand<string, 'ProjectId'>
export type SessionId = Brand<string, 'SessionId'>

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonArray
export type JsonObject = { readonly [key: string]: JsonValue }
export type JsonArray = readonly JsonValue[]

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K]
}

export type Discriminant<T, TKey extends keyof T> = T[TKey] & string

export function brand<TBrand extends string>(value: string): Brand<string, TBrand> {
  return value as Brand<string, TBrand>
}

export function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return typeof value !== 'number' || Number.isFinite(value)
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue)
  }

  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).every(isJsonValue)
  }

  return false
}

export function matchUnion<TUnion extends Record<TKey, string>, TKey extends keyof TUnion, TResult>(
  value: TUnion,
  key: TKey,
  handlers: {
    [K in Discriminant<TUnion, TKey>]: (value: Extract<TUnion, Record<TKey, K>>) => TResult
  },
): TResult {
  const handler = handlers[value[key] as Discriminant<TUnion, TKey>]
  return handler(value as Extract<TUnion, Record<TKey, Discriminant<TUnion, TKey>>>)
}
