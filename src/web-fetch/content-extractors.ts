import { Readability, isProbablyReaderable } from '@mozilla/readability'
import { parseHTML } from 'linkedom'

import { normalizeWhitespace } from '../shared/index.js'
import type { ReadableContent } from './types.js'

export function extractReadableContent(
  html: string,
  url: string,
  maxContentLength?: number,
): ReadableContent {
  const window = parseHTML(html)
  const document = window.document

  if (document.baseURI !== url) {
    const base = document.createElement('base')
    base.setAttribute('href', url)
    if (document.head) {
      document.head.prepend(base)
    }
  }

  const fallbackTitle = normalizeOptional(document.querySelector('title')?.textContent)
  const fallbackText = limitContent(normalizeWhitespace(document.body?.textContent ?? ''), maxContentLength)
  const fallbackExcerpt = createExcerpt(fallbackText)

  const readability = isProbablyReaderable(document)
    ? new Readability(document, { charThreshold: 20 }).parse()
    : null

  const readableText = limitContent(
    normalizeOptional(readability?.textContent) ?? fallbackText,
    maxContentLength,
  )

  return {
    title: normalizeOptional(readability?.title) ?? fallbackTitle,
    content: readableText,
    excerpt: normalizeOptional(readability?.excerpt) ?? fallbackExcerpt,
  }
}

function normalizeOptional(value: string | null | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = normalizeWhitespace(value)
  return normalized.length > 0 ? normalized : undefined
}

function createExcerpt(content: string): string | undefined {
  if (!content) {
    return undefined
  }

  return content.length <= 220 ? content : `${content.slice(0, 217).trimEnd()}...`
}

function limitContent(content: string, maxContentLength?: number): string {
  if (!maxContentLength || maxContentLength < 1) {
    return content
  }

  return content.length <= maxContentLength
    ? content
    : `${content.slice(0, Math.max(0, maxContentLength - 3)).trimEnd()}...`
}
