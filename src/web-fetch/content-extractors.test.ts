import { describe, expect, test } from 'bun:test'

import { extractReadableContent } from './content-extractors.js'

describe('web-fetch/content-extractors', () => {
  test('extracts readable content from html', () => {
    const result = extractReadableContent(
      `
        <html>
          <head><title>Ignored Title</title></head>
          <body>
            <nav>Navigation</nav>
            <article>
              <h1>Readable Title</h1>
              <p>This is the main article body with enough text for readability to keep the meaningful section.</p>
              <p>Second paragraph adds more context for the extractor and helps the parser find the article.</p>
            </article>
          </body>
        </html>
      `,
      'https://example.com/articles/readable',
    )

    expect(result.content).toContain('main article body')
    expect(result.content).toContain('Second paragraph')
    expect(result.title).toBeTruthy()
  })

  test('falls back to body text when readability yields nothing', () => {
    const result = extractReadableContent(
      '<html><head><title>Fallback</title></head><body><div>Short body</div></body></html>',
      'https://example.com/short',
      20,
    )

    expect(result.title).toBe('Fallback')
    expect(result.content).toBe('Short body')
    expect(result.excerpt).toBe('Short body')
  })
})
