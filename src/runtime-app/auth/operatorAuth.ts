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
      actor_id: request.headers.get('x-owner-id')?.trim() || config.owner_id || 'owner',
      authenticated: false,
    }
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    throw new HttpError(401, 'unauthorized', 'Authorization header must use Bearer token.')
  }

  return {
    actor_id: request.headers.get('x-owner-id')?.trim() || config.owner_id || 'owner',
    token_id: match[1]!.trim(),
    authenticated: true,
  }
}

export function requireAuthenticatedOperator(identity: OperatorIdentity): void {
  if (!identity.authenticated || !identity.token_id) {
    throw new HttpError(401, 'unauthorized', 'Operator authentication is required.')
  }
}
