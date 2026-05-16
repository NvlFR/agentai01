import { err, isRecord, ok, type Result } from '../shared/index.js'
import { validateOperatorToken } from '../security/index.js'

export type GatewayProtocol = 'http' | 'websocket'
export type GatewayRequestKind = 'health' | 'ready' | 'operator_message' | 'tool_call'
export type GatewayAuthMode = 'none' | 'operator_token'
export type GatewayHealthState = 'ready' | 'not_ready'

export type GatewayRequest = {
  id: string
  protocol: GatewayProtocol
  kind: GatewayRequestKind
  payload: Record<string, unknown>
  receivedAt: string
}

export type GatewayAuthContract = {
  mode: GatewayAuthMode
  operatorToken?: string
}

export type GatewayHealthResponse = {
  status: GatewayHealthState
  service: string
  checkedAt: string
  dependencies: readonly {
    name: string
    healthy: boolean
    detail?: string
  }[]
}

export type GatewayWebSocketHook = {
  onConnect?: (clientId: string) => void | Promise<void>
  onMessage?: (clientId: string, request: GatewayRequest) => void | Promise<void>
  onClose?: (clientId: string, reason?: string) => void | Promise<void>
}

export function validateGatewayRequest(input: unknown, now: () => Date = () => new Date()): Result<GatewayRequest, string[]> {
  if (!isRecord(input)) {
    return err(['Gateway request must be an object.'])
  }

  const errors: string[] = []
  const id = readRequired(input, 'id', errors)
  const protocol = readEnum(input, 'protocol', ['http', 'websocket'], errors)
  const kind = readEnum(input, 'kind', ['health', 'ready', 'operator_message', 'tool_call'], errors)
  const payload = isRecord(input['payload']) ? input['payload'] : {}
  const receivedAt = typeof input['receivedAt'] === 'string' && input['receivedAt'].trim()
    ? input['receivedAt'].trim()
    : now().toISOString()

  if (errors.length > 0) {
    return err(errors)
  }

  return ok({ id, protocol, kind, payload, receivedAt })
}

export function authenticateGatewayRequest(
  contract: GatewayAuthContract,
  suppliedToken: string | undefined,
): Result<'authenticated', 'missing_token' | 'invalid_token'> {
  if (contract.mode === 'none') {
    return ok('authenticated')
  }

  const expected = validateOperatorToken(contract.operatorToken)
  const supplied = validateOperatorToken(suppliedToken)
  if (!expected.ok || !supplied.ok) {
    return err('missing_token')
  }

  if (expected.value !== supplied.value) {
    return err('invalid_token')
  }

  return ok('authenticated')
}

export function createGatewayHealthResponse(input: {
  service: string
  dependencies?: readonly { name: string; healthy: boolean; detail?: string }[]
  now?: () => Date
}): GatewayHealthResponse {
  const dependencies = input.dependencies ?? []
  return {
    service: input.service,
    status: dependencies.every(dependency => dependency.healthy) ? 'ready' : 'not_ready',
    checkedAt: (input.now ?? (() => new Date()))().toISOString(),
    dependencies,
  }
}

function readRequired(record: Record<string, unknown>, field: string, errors: string[]): string {
  const value = record[field]
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`Gateway request field "${field}" is required.`)
    return ''
  }

  return value.trim()
}

function readEnum<T extends string>(
  record: Record<string, unknown>,
  field: string,
  allowed: readonly T[],
  errors: string[],
): T {
  const value = record[field]
  if (typeof value === 'string' && allowed.includes(value as T)) {
    return value as T
  }

  errors.push(`Gateway request field "${field}" is invalid.`)
  return allowed[0]
}
