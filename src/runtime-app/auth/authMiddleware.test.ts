import { describe, expect, test } from 'bun:test'
import { extractOperatorIdentity, requireAuth, createAuthMiddlewareConfig } from './authMiddleware.js'
import { HttpError } from '../http/errors.js'

const TEST_TOKEN = 'test-operator-token-12345'
const WRONG_TOKEN = 'wrong-token'

const testConfig = {
  operatorToken: TEST_TOKEN,
  ownerToken: 'test-owner-token-12345',
  observerToken: 'test-observer-token-12345',
  env: 'test' as const,
}

describe('extractOperatorIdentity', () => {
  test('returns unauthenticated identity when no authorization header', () => {
    const req = new Request('http://localhost/api/test')
    const identity = extractOperatorIdentity(req, testConfig)

    expect(identity.authenticated).toBe(false)
    expect(identity.actor_id).toBe('anonymous')
    expect(identity.role).toBe(null)
  })

  test('returns unauthenticated identity when authorization header is malformed', () => {
    const req = new Request('http://localhost/api/test', {
      headers: { authorization: 'InvalidFormat' },
    })
    const identity = extractOperatorIdentity(req, testConfig)

    expect(identity.authenticated).toBe(false)
    expect(identity.actor_id).toBe('anonymous')
  })

  test('returns unauthenticated identity when token is wrong', () => {
    const req = new Request('http://localhost/api/test', {
      headers: { authorization: `Bearer ${WRONG_TOKEN}` },
    })
    const identity = extractOperatorIdentity(req, testConfig)

    expect(identity.authenticated).toBe(false)
    expect(identity.actor_id).toBe('anonymous')
  })

  test('returns authenticated identity when token is correct', () => {
    const req = new Request('http://localhost/api/test', {
      headers: { authorization: `Bearer ${TEST_TOKEN}` },
    })
    const identity = extractOperatorIdentity(req, testConfig)

    expect(identity.authenticated).toBe(true)
    expect(identity.actor_id).toBe('operator')
    expect(identity.role).toBe('operator')
    expect(identity.token_id).not.toBe(TEST_TOKEN)
    expect(identity.token_id).toStartWith('sha256:')
  })

  test('extracts actor_id from x-operator-id header', () => {
    const req = new Request('http://localhost/api/test', {
      headers: {
        authorization: `Bearer ${TEST_TOKEN}`,
        'x-operator-id': 'alice',
      },
    })
    const identity = extractOperatorIdentity(req, testConfig)

    expect(identity.authenticated).toBe(true)
    expect(identity.actor_id).toBe('alice')
  })

  test('extracts owner role from owner token', () => {
    const req = new Request('http://localhost/api/test', {
      headers: {
        authorization: `Bearer ${testConfig.ownerToken}`,
      },
    })
    const identity = extractOperatorIdentity(req, testConfig)

    expect(identity.authenticated).toBe(true)
    expect(identity.role).toBe('owner')
  })

  test('does not allow operator token to escalate into owner role by header', () => {
    const req = new Request('http://localhost/api/test', {
      headers: {
        authorization: `Bearer ${TEST_TOKEN}`,
        'x-operator-role': 'owner',
      },
    })
    const identity = extractOperatorIdentity(req, testConfig)

    expect(identity.authenticated).toBe(true)
    expect(identity.role).toBe('operator')
  })

  test('defaults to operator role when x-operator-role is invalid', () => {
    const req = new Request('http://localhost/api/test', {
      headers: {
        authorization: `Bearer ${TEST_TOKEN}`,
        'x-operator-role': 'invalid-role',
      },
    })
    const identity = extractOperatorIdentity(req, testConfig)

    expect(identity.authenticated).toBe(true)
    expect(identity.role).toBe('operator')
  })

  test('supports observer role', () => {
    const req = new Request('http://localhost/api/test', {
      headers: {
        authorization: `Bearer ${TEST_TOKEN}`,
        'x-operator-role': 'observer',
      },
    })
    const identity = extractOperatorIdentity(req, testConfig)

    expect(identity.authenticated).toBe(true)
    expect(identity.role).toBe('observer')
  })
})

describe('requireAuth', () => {
  test('throws HttpError 401 when identity is not authenticated', () => {
    const identity = {
      actor_id: 'anonymous',
      role: null,
      authenticated: false,
      token_id: null,
    } as const

    expect(() => requireAuth(identity)).toThrow(HttpError)
    expect(() => requireAuth(identity)).toThrow('Operator authentication is required')
  })

  test('allows authenticated operator with operator role', () => {
    const identity = {
      actor_id: 'alice',
      role: 'operator' as const,
      authenticated: true as const,
      token_id: TEST_TOKEN,
    }

    expect(() => requireAuth(identity, 'operator')).not.toThrow()
  })

  test('allows authenticated owner with operator role requirement', () => {
    const identity = {
      actor_id: 'bob',
      role: 'owner' as const,
      authenticated: true as const,
      token_id: TEST_TOKEN,
    }

    expect(() => requireAuth(identity, 'operator')).not.toThrow()
  })

  test('throws HttpError 403 when observer tries to access operator endpoint', () => {
    const identity = {
      actor_id: 'charlie',
      role: 'observer' as const,
      authenticated: true as const,
      token_id: TEST_TOKEN,
    }

    expect(() => requireAuth(identity, 'operator')).toThrow(HttpError)
    expect(() => requireAuth(identity, 'operator')).toThrow('Insufficient permissions')
  })

  test('throws HttpError 403 when operator tries to access owner endpoint', () => {
    const identity = {
      actor_id: 'dave',
      role: 'operator' as const,
      authenticated: true as const,
      token_id: TEST_TOKEN,
    }

    expect(() => requireAuth(identity, 'owner')).toThrow(HttpError)
    expect(() => requireAuth(identity, 'owner')).toThrow('Insufficient permissions')
  })

  test('allows observer to access observer endpoints', () => {
    const identity = {
      actor_id: 'eve',
      role: 'observer' as const,
      authenticated: true as const,
      token_id: TEST_TOKEN,
    }

    expect(() => requireAuth(identity, 'observer')).not.toThrow()
  })

  test('allows owner to access owner endpoints', () => {
    const identity = {
      actor_id: 'frank',
      role: 'owner' as const,
      authenticated: true as const,
      token_id: TEST_TOKEN,
    }

    expect(() => requireAuth(identity, 'owner')).not.toThrow()
  })
})

describe('createAuthMiddlewareConfig', () => {
  test('creates config from RuntimeAppConfig', () => {
    const runtimeConfig = {
      operatorToken: 'my-token',
      env: 'production' as const,
      host: 'localhost',
      port: 3000,
      baseUrl: 'http://localhost:3000',
      runtimeId: 'test-runtime',
      telegramToken: null,
      ownerToken: 'owner-token',
      observerToken: 'observer-token',
      allowedChatIds: [],
      ai: {
        baseUrl: 'http://localhost:8045/v1',
        apiKey: null,
        model: 'gpt-4',
        timeoutMs: 30000,
        retryLimit: 2,
        logLatency: true,
      },
      storage: {
        mode: 'memory' as const,
        databaseUrl: null,
        artifactsRoot: '/tmp/artifacts',
        operationalRoot: '/tmp/operational',
      },
      queue: {
        concurrency: 1,
        retryLimit: 3,
      },
      readiness: {
        ready: true,
        reasons: [],
        checklist: [],
      },
      webhook: {
        telegramSecret: null,
        whatsappSecret: null,
      },
    }

    const config = createAuthMiddlewareConfig(runtimeConfig)

    expect(config.operatorToken).toBe('my-token')
    expect(config.ownerToken).toBe('owner-token')
    expect(config.observerToken).toBe('observer-token')
    expect(config.env).toBe('production')
  })
})
