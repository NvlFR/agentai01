import { err, ok, type Result } from '../shared/index.js'

export type FrontmatterDocument = {
  attributes: Record<string, string | boolean | number>
  body: string
}

export type MarkdownToken =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'listItem'; text: string }
  | { type: 'code'; language?: string; text: string }

export function parseFrontmatter(markdown: string): Result<FrontmatterDocument, string> {
  if (!markdown.startsWith('---\n')) {
    return ok({ attributes: {}, body: markdown })
  }

  const end = markdown.indexOf('\n---', 4)
  if (end === -1) {
    return err('Frontmatter closing marker is missing.')
  }

  const rawAttributes = markdown.slice(4, end)
  const body = markdown.slice(end + 4).replace(/^\n/, '')
  const attributes: Record<string, string | boolean | number> = {}

  for (const line of rawAttributes.split('\n')) {
    if (line.trim().length === 0) {
      continue
    }

    const separator = line.indexOf(':')
    if (separator <= 0) {
      return err(`Invalid frontmatter line: ${line}`)
    }

    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim()
    attributes[key] = parseScalar(value)
  }

  return ok({ attributes, body })
}

export function stringifyFrontmatter(document: FrontmatterDocument): string {
  const entries = Object.entries(document.attributes)
  if (entries.length === 0) {
    return document.body
  }

  const attributes = entries.map(([key, value]) => `${key}: ${String(value)}`).join('\n')
  return `---\n${attributes}\n---\n${document.body}`
}

export function tokenizeMarkdown(markdown: string): MarkdownToken[] {
  const tokens: MarkdownToken[] = []
  const lines = markdown.split(/\r?\n/)

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ''
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      tokens.push({ type: 'heading', level: heading[1].length, text: heading[2] })
      continue
    }

    const listItem = /^\s*[-*]\s+(.*)$/.exec(line)
    if (listItem) {
      tokens.push({ type: 'listItem', text: listItem[1] })
      continue
    }

    const fence = /^```(\S*)\s*$/.exec(line)
    if (fence) {
      const codeLines: string[] = []
      index += 1
      while (index < lines.length && lines[index] !== '```') {
        codeLines.push(lines[index] ?? '')
        index += 1
      }
      tokens.push({
        type: 'code',
        language: fence[1] || undefined,
        text: codeLines.join('\n'),
      })
      continue
    }

    if (line.trim().length > 0) {
      tokens.push({ type: 'paragraph', text: line.trim() })
    }
  }

  return tokens
}

export function markdownToPlainText(markdown: string): string {
  const parsed = parseFrontmatter(markdown)
  const body = parsed.ok ? parsed.value.body : markdown

  return tokenizeMarkdown(body)
    .map(token => {
      if (token.type === 'heading') {
        return token.text
      }
      if (token.type === 'listItem') {
        return `- ${token.text}`
      }
      return token.text
    })
    .join('\n')
}

export function markdownToHtml(markdown: string): string {
  const parsed = parseFrontmatter(markdown)
  const body = parsed.ok ? parsed.value.body : markdown

  return tokenizeMarkdown(body)
    .map(token => {
      if (token.type === 'heading') {
        return `<h${token.level}>${escapeHtml(token.text)}</h${token.level}>`
      }
      if (token.type === 'listItem') {
        return `<li>${escapeHtml(token.text)}</li>`
      }
      if (token.type === 'code') {
        const language = token.language ? ` class="language-${escapeHtml(token.language)}"` : ''
        return `<pre><code${language}>${escapeHtml(token.text)}</code></pre>`
      }
      return `<p>${escapeHtml(token.text)}</p>`
    })
    .join('\n')
}

function parseScalar(value: string): string | boolean | number {
  if (value === 'true') {
    return true
  }
  if (value === 'false') {
    return false
  }

  const numeric = Number(value)
  if (value.length > 0 && Number.isFinite(numeric)) {
    return numeric
  }

  return value.replace(/^['"]|['"]$/g, '')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
