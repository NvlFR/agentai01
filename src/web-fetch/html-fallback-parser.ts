import { parse } from 'node-html-parser'

export function parseHtmlFallback(html: string): {
  title?: string
  text: string
} {
  const root = parse(html)
  const normalizedText = root.text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\s+/g, ' ')
  return {
    title: root.querySelector('title')?.text.trim(),
    text: normalizedText,
  }
}
