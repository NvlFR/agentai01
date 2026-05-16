import { createHash } from 'node:crypto'

import { constantTimeEquals } from '../security/index.js'
import { generateId } from '../shared/index.js'
import { nowIso } from '../utils/index.js'

export type PairingStatus = 'pending' | 'paired' | 'expired' | 'revoked'

export type PairingToken = {
  tokenId: string
  token: string
  expiresAt: string
}

export type PairingSession = {
  id: string
  tokenId: string
  status: PairingStatus
  createdAt: string
  expiresAt: string
  pairedAt?: string
  subject?: string
  metadata?: Record<string, unknown>
}

type StoredPairingSession = PairingSession & {
  tokenDigest: string
}

export type PairingManager = {
  issue(input?: { ttlMs?: number; subject?: string; metadata?: Record<string, unknown> }): PairingToken
  consume(tokenId: string, token: string, now?: Date): PairingSession | null
  revoke(tokenId: string): PairingSession | null
  list(): PairingSession[]
}

const DEFAULT_TTL_MS = 10 * 60 * 1000

export function createPairingManager(): PairingManager {
  const sessions = new Map<string, StoredPairingSession>()

  return {
    issue(input = {}) {
      const tokenId = generateId('pair')
      const token = generateId('pair-token')
      const createdAt = new Date()
      const expiresAt = new Date(createdAt.getTime() + (input.ttlMs ?? DEFAULT_TTL_MS)).toISOString()
      sessions.set(tokenId, {
        id: generateId('pair-session'),
        tokenId,
        tokenDigest: digestToken(token),
        status: 'pending',
        createdAt: createdAt.toISOString(),
        expiresAt,
        subject: input.subject,
        metadata: input.metadata,
      })

      return { tokenId, token, expiresAt }
    },
    consume(tokenId, token, now = new Date()) {
      const session = sessions.get(tokenId)
      if (!session || session.status !== 'pending') {
        return null
      }

      if (Date.parse(session.expiresAt) <= now.getTime()) {
        session.status = 'expired'
        return publicSession(session)
      }

      if (!constantTimeEquals(session.tokenDigest, digestToken(token))) {
        return null
      }

      session.status = 'paired'
      session.pairedAt = nowIso()
      return publicSession(session)
    },
    revoke(tokenId) {
      const session = sessions.get(tokenId)
      if (!session) {
        return null
      }

      session.status = 'revoked'
      return publicSession(session)
    },
    list() {
      return [...sessions.values()].map(publicSession)
    },
  }
}

function digestToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function publicSession(session: StoredPairingSession): PairingSession {
  const { tokenDigest: _tokenDigest, ...publicValue } = session
  return structuredClone(publicValue)
}
