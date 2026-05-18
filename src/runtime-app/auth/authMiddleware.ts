import { createHash } from 'node:crypto'
import { type RuntimeAppConfig } from '../config/index.js'
import { HttpError } from '../http/errors.js'
import { validateOperatorTokenMatch } from '../../security/index.js'
import { sanitizeInput } from '../../security/sanitize.js'

export type OperatorRole = 'observer' | 'operator' | 'owner'

export type AuthenticatedIdentity = {
  actor_id: string
  role: OperatorRole
  authenticated: true
  token_id: string
}

export type UnauthenticatedIdentity = {
  actor_id: string
  role: null
  authenticated: false
  token_id: null
}

export type OperatorIdentity = AuthenticatedIdentity | UnauthenticatedIdentity

export type AuthMiddlewareConfig = {
  operatorToken: string
  ownerToken?: string | null
  observerToken?: string | null
  env: RuntimeAppConfig['env']
  webhook?: RuntimeAppConfig['webhook']
}

/**
 * Extract operator identity from request headers.
 * Does NOT enforce authentication - use requireAuth() for that.
 */
export function extractOperatorIdentity(
  request: Request,
  config: AuthMiddlewareConfig,
): OperatorIdentity {
  const authorization = request.headers.get('authorization')
  
  if (!authorization) {
    return {
      actor_id: 'anonymous',
      role: null,
      authenticated: false,
      token_id: null,
    }
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    return {
      actor_id: 'anonymous',
      role: null,
      authenticated: false,
      token_id: null,
    }
  }

  const providedToken = match[1]?.trim()
  if (!providedToken) {
    return {
      actor_id: 'anonymous',
      role: null,
      authenticated: false,
      token_id: null,
    }
  }

  const matchedRole = resolveTokenRole(providedToken, config)
  if (!matchedRole) {
    return {
      actor_id: 'anonymous',
      role: null,
      authenticated: false,
      token_id: null,
    }
  }

  // Extract actor_id from header or default to 'operator'
  const actorId = sanitizeInput(
    request.headers.get('x-operator-id')?.trim() || 
    request.headers.get('x-owner-id')?.trim() || 
    matchedRole
  )

  // Role headers may only down-scope a valid token, never escalate it.
  const roleHeader = request.headers.get('x-operator-role')?.trim().toLowerCase()
  const requestedRole: OperatorRole | undefined =
    roleHeader === 'observer' || roleHeader === 'operator' || roleHeader === 'owner'
      ? roleHeader
      : undefined
  const role = requestedRole && hasRequiredRole(matchedRole, requestedRole)
    ? requestedRole
    : matchedRole

  return {
    actor_id: actorId,
    role,
    authenticated: true,
    token_id: createTokenFingerprint(providedToken),
  }
}

/**
 * Require authentication for the request.
 * Throws HttpError 401 if not authenticated.
 */
export function requireAuth(
  identity: OperatorIdentity,
  requiredRole: OperatorRole = 'operator',
): asserts identity is AuthenticatedIdentity {
  if (!identity.authenticated) {
    throw new HttpError(
      401,
      'unauthorized',
      'Operator authentication is required. Provide a valid Bearer token in the Authorization header.',
    )
  }

  // Check role hierarchy: owner > operator > observer
  if (!hasRequiredRole(identity.role, requiredRole)) {
    throw new HttpError(
      403,
      'forbidden',
      `Insufficient permissions. Required role: ${requiredRole}, your role: ${identity.role}`,
    )
  }
}

/**
 * Check if the user's role satisfies the required role.
 * Role hierarchy: owner > operator > observer
 */
function hasRequiredRole(userRole: OperatorRole, requiredRole: OperatorRole): boolean {
  const roleHierarchy: Record<OperatorRole, number> = {
    observer: 1,
    operator: 2,
    owner: 3,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Create auth middleware config from RuntimeAppConfig
 */
export function createAuthMiddlewareConfig(config: RuntimeAppConfig): AuthMiddlewareConfig {
  return {
    operatorToken: config.operatorToken,
    ownerToken: config.ownerToken,
    observerToken: config.observerToken,
    env: config.env,
    webhook: config.webhook,
  }
}

function resolveTokenRole(token: string, config: AuthMiddlewareConfig): OperatorRole | null {
  if (config.ownerToken && validateOperatorTokenMatch(config.ownerToken, token).ok) {
    return 'owner'
  }

  if (validateOperatorTokenMatch(config.operatorToken, token).ok) {
    return 'operator'
  }

  if (config.observerToken && validateOperatorTokenMatch(config.observerToken, token).ok) {
    return 'observer'
  }

  return null
}

function createTokenFingerprint(token: string): string {
  return `sha256:${createHash('sha256').update(token).digest('hex').slice(0, 16)}`
}
