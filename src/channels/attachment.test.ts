import { describe, expect, it } from 'bun:test'
import { normalizeAttachments } from './attachment.js'

describe('src/channels/attachment.ts', () => {
  it('normalizes valid attachments', () => {
    const raw = [
      { id: 'att-1', mimeType: 'image/png', url: 'http://example.com/1.png', name: 'image1.png' },
      { id: 'att-2', mimeType: 'text/plain' }
    ]
    const normalized = normalizeAttachments(raw)
    expect(normalized).toHaveLength(2)
    expect(normalized[0]).toEqual({
      id: 'att-1',
      mimeType: 'image/png',
      url: 'http://example.com/1.png',
      name: 'image1.png'
    })
    expect(normalized[1]).toEqual({
      id: 'att-2',
      mimeType: 'text/plain',
      url: undefined,
      name: undefined
    })
  })

  it('skips invalid attachments', () => {
    const raw = [
      { id: '', mimeType: 'image/png' }, // missing id
      { id: 'att-1', mimeType: '' },    // missing mimeType
      { not_an_attachment: true },      // not an attachment
      null,                             // not a record
      'string'                          // not a record
    ]
    const normalized = normalizeAttachments(raw)
    expect(normalized).toHaveLength(0)
  })

  it('returns empty array for non-array input', () => {
    expect(normalizeAttachments(null)).toEqual([])
    expect(normalizeAttachments({})).toEqual([])
  })
})
