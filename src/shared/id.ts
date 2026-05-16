export function generateId(prefix = 'id'): string {
  const normalizedPrefix = prefix.trim() || 'id'
  return `${normalizedPrefix}-${readRandomUuid()}`
}

export function generateCorrelationId(prefix = 'corr'): string {
  return generateId(prefix)
}

function readRandomUuid(): string {
  const testGlobal = globalThis as typeof globalThis & {
    __AGENTAI_TEST_RANDOM_UUID__?: (() => string) | undefined
  }
  const deterministicFactory = testGlobal.__AGENTAI_TEST_RANDOM_UUID__

  if (typeof deterministicFactory === 'function') {
    return deterministicFactory()
  }

  return crypto.randomUUID()
}
