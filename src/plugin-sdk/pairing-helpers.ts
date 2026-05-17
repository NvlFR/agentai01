// Adapted using referensi/openclaw/src/channels/plugins/helpers.ts
export function formatPairingApproveHint(channelId: string): string {
  const normalizedChannelId = channelId.trim() || 'channel'
  return `Approve via: pairing list ${normalizedChannelId} / pairing approve ${normalizedChannelId} <code>`
}

export function parseOptionalDelimitedEntries(value?: string): string[] | undefined {
  if (!value?.trim()) {
    return undefined
  }

  const parsed = value
    .split(/[\n,;]+/g)
    .map(entry => entry.trim())
    .filter(Boolean)

  return parsed.length > 0 ? parsed : undefined
}

export function normalizeHyphenSlug(raw?: string | null): string {
  const trimmed = normalizeSlugInput(raw)
  if (!trimmed) {
    return ''
  }

  const dashed = trimmed.replace(/\s+/g, '-')
  const cleaned = dashed.replace(/[^\p{L}\p{M}\p{N}#@._+-]+/gu, '-')
  return cleaned.replace(/-{2,}/g, '-').replace(/^[-.]+|[-.]+$/g, '')
}

export function normalizeAtHashSlug(raw?: string | null): string {
  const trimmed = normalizeSlugInput(raw)
  if (!trimmed) {
    return ''
  }

  const withoutPrefix = trimmed.replace(/^[@#]+/, '')
  const dashed = withoutPrefix.replace(/[\s_]+/g, '-')
  const cleaned = dashed.replace(/[^\p{L}\p{M}\p{N}-]+/gu, '-')
  return cleaned.replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '')
}

function normalizeSlugInput(raw?: string | null): string {
  return (raw ?? '').trim().toLowerCase().normalize('NFC')
}
