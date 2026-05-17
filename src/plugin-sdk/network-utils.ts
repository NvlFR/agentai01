// Adapted using referensi/openclaw/src/plugin-sdk/core.ts and referensi/openclaw/src/config/dangerous-name-matching.ts
import ipaddr from 'ipaddr.js'

export type DangerousNameMatchingScope = {
  prefix: string
  account: Record<string, unknown>
  dangerousNameMatchingEnabled: boolean
  dangerousFlagPath: string
}

export function isTrustedProxyAddress(
  address: string | null | undefined,
  trustedProxyAddresses: readonly string[] = [],
): boolean {
  const normalizedAddress = normalizeIpLiteral(address)
  if (!normalizedAddress) {
    return false
  }

  if (trustedProxyAddresses.length === 0) {
    return isLoopbackAddress(normalizedAddress)
  }

  return trustedProxyAddresses.some(candidate => matchesTrustedProxy(normalizedAddress, candidate))
}

export function resolveClientIp(params: {
  remoteAddress?: string | null
  headers?: Readonly<Record<string, string | string[] | undefined>>
  trustedProxyAddresses?: readonly string[]
}): string | null {
  const remoteAddress = normalizeIpLiteral(params.remoteAddress)
  if (!remoteAddress) {
    return null
  }

  const trustedProxyAddresses = params.trustedProxyAddresses ?? []
  if (!isTrustedProxyAddress(remoteAddress, trustedProxyAddresses)) {
    return remoteAddress
  }

  const forwardedFor = params.headers?.['x-forwarded-for']
  const forwardedValue = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor
  if (!forwardedValue) {
    return remoteAddress
  }

  const firstForwardedIp = forwardedValue
    .split(',')
    .map(entry => normalizeIpLiteral(entry))
    .find(Boolean)

  return firstForwardedIp ?? remoteAddress
}

export function formatZonedTimestamp(
  value: Date | number | string,
  timeZone = 'UTC',
  locale = 'en-CA',
): string {
  const date = value instanceof Date ? value : new Date(value)
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value]),
  )

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} ${timeZone}`
}

export function collectProviderDangerousNameMatchingScopes(
  cfg: unknown,
  provider: string,
): DangerousNameMatchingScope[] {
  const channels = readRecord(readRecord(cfg)?.channels)
  if (!channels) {
    return []
  }

  const providerCfg = readRecord(channels[provider])
  if (!providerCfg) {
    return []
  }

  const providerPrefix = `channels.${provider}`
  const providerDangerousFlagPath = `${providerPrefix}.dangerouslyAllowNameMatching`
  const providerDangerousNameMatchingEnabled = providerCfg.dangerouslyAllowNameMatching === true
  const scopes: DangerousNameMatchingScope[] = [
    {
      prefix: providerPrefix,
      account: providerCfg,
      dangerousNameMatchingEnabled: providerDangerousNameMatchingEnabled,
      dangerousFlagPath: providerDangerousFlagPath,
    },
  ]

  const accounts = readRecord(providerCfg.accounts)
  if (!accounts) {
    return scopes
  }

  for (const [accountId, value] of Object.entries(accounts)) {
    const account = readRecord(value)
    if (!account) {
      continue
    }

    const accountPrefix = `${providerPrefix}.accounts.${accountId}`
    const accountDangerousFlag =
      typeof account.dangerouslyAllowNameMatching === 'boolean'
        ? account.dangerouslyAllowNameMatching
        : providerDangerousNameMatchingEnabled

    scopes.push({
      prefix: accountPrefix,
      account,
      dangerousNameMatchingEnabled: accountDangerousFlag,
      dangerousFlagPath:
        typeof account.dangerouslyAllowNameMatching === 'boolean'
          ? `${accountPrefix}.dangerouslyAllowNameMatching`
          : providerDangerousFlagPath,
    })
  }

  return scopes
}

function normalizeIpLiteral(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim()
  if (!trimmed) {
    return null
  }

  const bracketless = trimmed.replace(/^\[|\]$/g, '')
  if (bracketless.startsWith('::ffff:')) {
    return bracketless.slice('::ffff:'.length)
  }

  return bracketless
}

function isLoopbackAddress(address: string): boolean {
  try {
    const parsed = ipaddr.parse(address)
    return parsed.range() === 'loopback'
  } catch {
    return false
  }
}

function matchesTrustedProxy(address: string, candidate: string): boolean {
  const normalizedCandidate = candidate.trim()
  if (!normalizedCandidate) {
    return false
  }

  if (normalizedCandidate.includes('/')) {
    try {
      const [range, prefixLength] = ipaddr.parseCIDR(normalizedCandidate)
      return ipaddr.parse(address).match(range, prefixLength)
    } catch {
      return false
    }
  }

  return normalizeIpLiteral(normalizedCandidate) === address
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}
