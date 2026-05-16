import { timingSafeEqual } from 'node:crypto'

import { type Result, err, ok } from '../shared/index.js'
import { sanitizeInput } from './sanitize.js'

export function validateOperatorToken(
  token: string | null | undefined,
): Result<string, 'missing'> {
  if (!token || sanitizeInput(token).trim().length === 0) {
    return err('missing')
  }

  return ok(sanitizeInput(token).trim())
}

export function constantTimeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  const length = Math.max(leftBuffer.length, rightBuffer.length, 1)
  const paddedLeft = Buffer.alloc(length)
  const paddedRight = Buffer.alloc(length)

  leftBuffer.copy(paddedLeft)
  rightBuffer.copy(paddedRight)

  const sameContent = timingSafeEqual(paddedLeft, paddedRight)
  return sameContent && leftBuffer.length === rightBuffer.length
}

export function validateOperatorTokenMatch(
  expected: string | null | undefined,
  actual: string | null | undefined,
): Result<true, 'missing' | 'invalid'> {
  const expectedToken = validateOperatorToken(expected)
  const actualToken = validateOperatorToken(actual)

  if (!expectedToken.ok || !actualToken.ok) {
    return err('missing')
  }

  if (!constantTimeEquals(expectedToken.value, actualToken.value)) {
    return err('invalid')
  }

  return ok(true)
}

