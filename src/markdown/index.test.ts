import { describe, expect, it } from 'bun:test'

import {
  markdownToHtml,
  markdownToPlainText,
  parseFrontmatter,
  stringifyFrontmatter,
  tokenizeMarkdown,
} from './index.js'

describe('markdown', () => {
  it('parses and stringifies frontmatter', () => {
    const result = parseFrontmatter('---\ntitle: Demo\npublished: true\ncount: 2\n---\n# Hello')

    expect(result).toEqual({
      ok: true,
      value: {
        attributes: { title: 'Demo', published: true, count: 2 },
        body: '# Hello',
      },
    })
    if (result.ok) {
      expect(stringifyFrontmatter(result.value)).toContain('title: Demo')
    }
  })

  it('tokenizes markdown blocks', () => {
    expect(tokenizeMarkdown('# Title\n- item\n```ts\nconst ok = true\n```')).toEqual([
      { type: 'heading', level: 1, text: 'Title' },
      { type: 'listItem', text: 'item' },
      { type: 'code', language: 'ts', text: 'const ok = true' },
    ])
  })

  it('converts markdown to text and escaped HTML', () => {
    expect(markdownToPlainText('# Hi\n<script>')).toBe('Hi\n<script>')
    expect(markdownToHtml('# Hi\n<script>')).toBe('<h1>Hi</h1>\n<p>&lt;script&gt;</p>')
  })
})
