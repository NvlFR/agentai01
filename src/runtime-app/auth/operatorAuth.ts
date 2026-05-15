import { sanitizeInput, validateOperatorToken } from '../../security/index.js'
import { HttpError } from '../http/errors.js'

export type OperatorIdentity = {
  actor_id: string
  token_id?: string
  authenticated: boolean
}

export type OperatorAuthConfig = {
  owner_id?: string
}

export function readOperatorIdentity(
  request: Request,
  config: OperatorAuthConfig = {},
): OperatorIdentity {
  const authorization = request.headers.get('authorization')
  if (!authorization) {
    return {
      actor_id: sanitizeInput(request.headers.get('x-owner-id')?.trim() || config.owner_id || 'owner'),
      authenticated: false,
    }
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    throw new HttpError(401, 'unauthorized', 'Authorization header must use Bearer token.')
  }

  const tokenResult = validateOperatorToken(match[1]?.trim())
  if (!tokenResult.ok) {
    throw new HttpError(401, 'unauthorized', 'Operator authentication is required.')
  }

  return {
    actor_id: sanitizeInput(request.headers.get('x-owner-id')?.trim() || config.owner_id || 'owner'),
    token_id: tokenResult.value,
    authenticated: true,
  }
}

export function requireAuthenticatedOperator(identity: OperatorIdentity): void {
  if (!identity.authenticated || !validateOperatorToken(identity.token_id).ok) {
    throw new HttpError(401, 'unauthorized', 'Operator authentication is required.')
  }
}
