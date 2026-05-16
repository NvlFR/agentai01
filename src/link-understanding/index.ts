import { evaluateUrlSafety, type SafeFetchOptions, safeFetch } from '../web-fetch/index.js'

export type LinkSafety = {
  safe: boolean
  reason?: string
}

export type LinkMetadata = {
  url: string
  final_url?: string
  title?: string
  description?: string
  canonical_url?: string
  content_type?: string
}

export type LinkPreview = {
  title: string
  subtitle?: string
  url: string
  safe: boolean
}

export type LinkInspection = {
  safety: LinkSafety
  metadata?: LinkMetadata
  preview?: LinkPreview
}

export function checkLinkSafety(url: string, resolvedAddresses: readonly string[] = []): LinkSafety {
  const safety = evaluateUrlSafety(url, resolvedAddresses)
  return safety.safe ? { safe: true } : { safe: false, reason: safety.reason }
}

export async function inspectLink(url: string, options: SafeFetchOptions = {}): Promise<LinkInspection> {
  const safety = checkLinkSafety(url)
  if (!safety.safe) {
    return { safety }
  }

  const response = await safeFetch({ url, method: 'GET', retryAttempts: 1 }, options)
  if (!response.ok) {
    return { safety: { safe: false, reason: response.error.code } }
  }

  const metadata = extractLinkMetadata(url, response.value.body, response.value.contentType, response.value.url)
  return {
    safety,
    metadata,
    preview: buildLinkPreview(metadata),
  }
}

export function extractLinkMetadata(
  requestedUrl: string,
  html: string,
  contentType?: string,
  finalUrl?: string,
): LinkMetadata {
  const metadata: LinkMetadata = {
    url: requestedUrl,
    final_url: finalUrl,
    content_type: contentType,
    title: firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i) ?? firstMeta(html, 'og:title'),
    description: firstMeta(html, 'description') ?? firstMeta(html, 'og:description'),
    canonical_url: firstMatch(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i),
  }

  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined && value !== ''),
  ) as LinkMetadata
}

export function buildLinkPreview(metadata: LinkMetadata): LinkPreview {
  return {
    title: normalizeHtmlText(metadata.title ?? metadata.final_url ?? metadata.url),
    subtitle: metadata.description ? normalizeHtmlText(metadata.description) : undefined,
    url: metadata.canonical_url ?? metadata.final_url ?? metadata.url,
    safe: true,
  }
}

function firstMeta(html: string, name: string): string | undefined {
  return firstMatch(
    html,
    new RegExp(`<meta[^>]+(?:name|property)=["']${escapeRegExp(name)}["'][^>]+content=["']([^"']+)["']`, 'i'),
  )
}

function firstMatch(value: string, pattern: RegExp): string | undefined {
  const match = pattern.exec(value)
  return match?.[1] ? normalizeHtmlText(match[1]) : undefined
}

function normalizeHtmlText(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
