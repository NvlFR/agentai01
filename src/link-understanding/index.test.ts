import { describe, expect, test } from 'bun:test'

import { extractLinkMetadata, inspectLink } from './index.js'
import type { FetchLike } from '../web-fetch/index.js'

describe('link-understanding', () => {
  test('extracts metadata and builds a preview', () => {
    const metadata = extractLinkMetadata(
      'https://example.com',
      '<html><head><title>Agent &amp; Runtime</title><meta name="description" content="Thin contracts"></head></html>',
      'text/html',
    )

    expect(metadata.title).toBe('Agent & Runtime')
    expect(metadata.description).toBe('Thin contracts')
  })

  test('returns unsafe inspection for blocked links', async () => {
    const fetchImpl: FetchLike = async () => new Response('should not fetch')
    const inspection = await inspectLink('http://127.0.0.1/admin', { fetch: fetchImpl })

    expect(inspection.safety.safe).toBe(false)
    expect(inspection.metadata).toBeUndefined()
  })
})
