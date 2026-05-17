// Adapted using referensi/openclaw/extensions/whatsapp/src/socket-timing.ts

export type WhatsAppSocketTimingOptions = {
  keepAliveIntervalMs?: number
  connectTimeoutMs?: number
  defaultQueryTimeoutMs?: number
}

export const DEFAULT_WHATSAPP_SOCKET_TIMING: Required<WhatsAppSocketTimingOptions> = {
  keepAliveIntervalMs: 25_000,
  connectTimeoutMs: 60_000,
  defaultQueryTimeoutMs: 60_000,
}

/**
 * Returns the value if it is a positive integer, otherwise undefined.
 */
function positiveInteger(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined
}

/**
 * A minimal runtime config shape for WhatsApp socket timing.
 * Only the fields relevant to socket timing are required.
 */
export type WhatsAppSocketTimingConfig = {
  web?: {
    whatsapp?: {
      keepAliveIntervalMs?: number
      connectTimeoutMs?: number
      defaultQueryTimeoutMs?: number
    }
  }
}

/**
 * Resolve WhatsApp socket timing from config and optional overrides.
 * Precedence: overrides > config > defaults.
 * Non-positive-integer values are ignored and fall through to the next level.
 */
export function resolveWhatsAppSocketTiming(
  cfg: WhatsAppSocketTimingConfig,
  overrides?: WhatsAppSocketTimingOptions,
): Required<WhatsAppSocketTimingOptions> {
  const configured = cfg.web?.whatsapp
  return {
    keepAliveIntervalMs:
      positiveInteger(overrides?.keepAliveIntervalMs) ??
      positiveInteger(configured?.keepAliveIntervalMs) ??
      DEFAULT_WHATSAPP_SOCKET_TIMING.keepAliveIntervalMs,
    connectTimeoutMs:
      positiveInteger(overrides?.connectTimeoutMs) ??
      positiveInteger(configured?.connectTimeoutMs) ??
      DEFAULT_WHATSAPP_SOCKET_TIMING.connectTimeoutMs,
    defaultQueryTimeoutMs:
      positiveInteger(overrides?.defaultQueryTimeoutMs) ??
      positiveInteger(configured?.defaultQueryTimeoutMs) ??
      DEFAULT_WHATSAPP_SOCKET_TIMING.defaultQueryTimeoutMs,
  }
}
