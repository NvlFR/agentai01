import { HttpError } from '../http/errors.js'

export type RateLimitPolicy = {
  limit: number
  windowMs: number
}

type Bucket = {
  count: number
  resetAtMs: number
}

export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>()

  assertAllowed(key: string, policy: RateLimitPolicy, nowMs = Date.now()): void {
    const bucket = this.buckets.get(key)
    if (!bucket || nowMs >= bucket.resetAtMs) {
      this.buckets.set(key, {
        count: 1,
        resetAtMs: nowMs + policy.windowMs,
      })
      return
    }

    if (bucket.count >= policy.limit) {
      throw new HttpError(429, 'rate_limited', 'Too many mutation requests. Retry after the rate-limit window resets.', {
        retry_after_ms: bucket.resetAtMs - nowMs,
      })
    }

    bucket.count += 1
  }

  reset(): void {
    this.buckets.clear()
  }
}
