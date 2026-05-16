export type BindingStatus = 'available' | 'fallback' | 'unavailable'

export type Binding<T> = {
  capability: string
  status: BindingStatus
  value: T
  reason?: string
}

export type BindingCandidate<T> = {
  capability: string
  load: () => T | null | undefined
}

export function resolveBinding<T>(
  capability: string,
  candidates: readonly BindingCandidate<T>[],
  fallback: T,
  reason = 'Optional capability is not available.',
): Binding<T> {
  for (const candidate of candidates) {
    const value = candidate.load()
    if (value !== null && value !== undefined) {
      return {
        capability: candidate.capability,
        status: 'available',
        value,
      }
    }
  }

  return {
    capability,
    status: 'fallback',
    value: fallback,
    reason,
  }
}

export function createUnavailableBinding(
  capability: string,
  reason = 'Capability is not installed.',
): Binding<never> {
  return {
    capability,
    status: 'unavailable',
    reason,
    get value(): never {
      throw new Error(`${capability} is unavailable: ${reason}`)
    },
  }
}

export function requireBinding<T>(binding: Binding<T>): T {
  if (binding.status === 'unavailable') {
    throw new Error(`${binding.capability} is unavailable: ${binding.reason ?? 'missing'}`)
  }

  return binding.value
}
