// Adapted from referensi/openclaw/src/shared/tailscale-status.ts
export type TailscaleStatusCommandResult = {
  code: number | null
  stdout: string
}

export type TailscaleStatusCommandRunner = (
  argv: string[],
  opts: { timeoutMs: number },
) => Promise<TailscaleStatusCommandResult>

const TAILSCALE_STATUS_COMMAND_CANDIDATES = [
  'tailscale',
  '/Applications/Tailscale.app/Contents/MacOS/Tailscale',
]

export async function resolveTailnetHostWithRunner(
  runCommandWithTimeout?: TailscaleStatusCommandRunner,
): Promise<string | null> {
  if (!runCommandWithTimeout) {
    return null
  }

  for (const candidate of TAILSCALE_STATUS_COMMAND_CANDIDATES) {
    try {
      const result = await runCommandWithTimeout([candidate, 'status', '--json'], {
        timeoutMs: 5_000,
      })
      if (result.code !== 0) {
        continue
      }

      const host = extractTailnetHostFromStatusJson(result.stdout)
      if (host) {
        return host
      }
    } catch {
      continue
    }
  }

  return null
}

function extractTailnetHostFromStatusJson(raw: string): string | null {
  const parsed = parsePossiblyNoisyStatus(raw)
  if (!parsed) {
    return null
  }

  const dnsName = typeof parsed.Self?.DNSName === 'string' ? parsed.Self.DNSName.replace(/\.$/, '') : ''
  if (dnsName) {
    return dnsName
  }

  const ips = Array.isArray(parsed.Self?.TailscaleIPs) ? parsed.Self.TailscaleIPs : []
  return typeof ips[0] === 'string' && ips[0].trim() ? ips[0] : null
}

function parsePossiblyNoisyStatus(raw: string): {
  Self?: {
    DNSName?: string
    TailscaleIPs?: unknown[]
  }
} | null {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end <= start) {
    return null
  }

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as unknown
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null
    }

    return parsed as {
      Self?: {
        DNSName?: string
        TailscaleIPs?: unknown[]
      }
    }
  } catch {
    return null
  }
}
