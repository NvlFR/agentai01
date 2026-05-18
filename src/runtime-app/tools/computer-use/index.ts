export type ComputerUseActionKind = 'tap' | 'type' | 'screenshot' | 'launch'

export type ComputerUseDecision =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: string }

export type ComputerUseHostAdapter = {
  perform(action: { readonly kind: ComputerUseActionKind; readonly payload?: unknown }): Promise<string>
}

export function decideComputerUseAction(input: {
  readonly enabled: boolean
  readonly requiresApproval: boolean
  readonly approved: boolean
  readonly action: ComputerUseActionKind
}): ComputerUseDecision {
  if (!input.enabled) {
    return { allowed: false, reason: 'Computer use is disabled.' }
  }

  if (input.requiresApproval && !input.approved) {
    return { allowed: false, reason: 'Computer use action requires approval.' }
  }

  if (input.action === 'launch' && !input.approved) {
    return { allowed: false, reason: 'Launch actions require explicit approval.' }
  }

  return { allowed: true }
}

export async function executeComputerUseAction(input: {
  readonly adapter: ComputerUseHostAdapter
  readonly enabled: boolean
  readonly requiresApproval: boolean
  readonly approved: boolean
  readonly action: ComputerUseActionKind
  readonly payload?: unknown
}): Promise<string> {
  const decision = decideComputerUseAction(input)
  if (!decision.allowed) {
    throw new Error(decision.reason)
  }

  return input.adapter.perform({ kind: input.action, payload: input.payload })
}
