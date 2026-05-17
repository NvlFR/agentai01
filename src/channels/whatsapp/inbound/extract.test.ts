import { describe, expect, it } from 'bun:test'
import {
  extractWhatsAppContextInfo,
  extractWhatsAppLocationData,
  extractWhatsAppMediaPlaceholder,
  extractWhatsAppMessageContent,
  extractWhatsAppMentionedJids,
  extractWhatsAppText,
  hasInboundUserContent,
  resolveWhatsAppMessageKind,
  type WAMessage,
} from './extract.js'

describe('extractWhatsAppText', () => {
  it('returns undefined for null/undefined', () => {
    expect(extractWhatsAppText(null)).toBeUndefined()
    expect(extractWhatsAppText(undefined)).toBeUndefined()
  })

  it('extracts conversation text', () => {
    const msg: WAMessage = { conversation: 'hello world' }
    expect(extractWhatsAppText(msg)).toBe('hello world')
  })

  it('extracts extendedTextMessage text', () => {
    const msg: WAMessage = { extendedTextMessage: { text: '  hi  ' } }
    expect(extractWhatsAppText(msg)).toBe('hi')
  })

  it('extracts image caption', () => {
    const msg: WAMessage = { imageMessage: { caption: 'a photo' } }
    expect(extractWhatsAppText(msg)).toBe('a photo')
  })

  it('extracts video caption', () => {
    const msg: WAMessage = { videoMessage: { caption: 'a video' } }
    expect(extractWhatsAppText(msg)).toBe('a video')
  })

  it('extracts document caption', () => {
    const msg: WAMessage = { documentMessage: { caption: 'a doc' } }
    expect(extractWhatsAppText(msg)).toBe('a doc')
  })

  it('extracts button response selectedButtonId', () => {
    const msg: WAMessage = { buttonsResponseMessage: { selectedButtonId: 'btn1' } }
    expect(extractWhatsAppText(msg)).toBe('btn1')
  })

  it('extracts list response selectedRowId', () => {
    const msg: WAMessage = {
      listResponseMessage: { singleSelectReply: { selectedRowId: 'row1' } },
    }
    expect(extractWhatsAppText(msg)).toBe('row1')
  })

  it('extracts template button reply selectedId', () => {
    const msg: WAMessage = { templateButtonReplyMessage: { selectedId: 'tpl1' } }
    expect(extractWhatsAppText(msg)).toBe('tpl1')
  })

  it('unwraps ephemeral wrapper', () => {
    const inner: WAMessage = { conversation: 'ephemeral text' }
    const msg: WAMessage = { ephemeralMessage: { message: inner } }
    expect(extractWhatsAppText(msg)).toBe('ephemeral text')
  })

  it('unwraps viewOnce wrapper', () => {
    const inner: WAMessage = { conversation: 'view once text' }
    const msg: WAMessage = { viewOnceMessage: { message: inner } }
    expect(extractWhatsAppText(msg)).toBe('view once text')
  })

  it('returns undefined for audio-only message', () => {
    const msg: WAMessage = { audioMessage: {} }
    expect(extractWhatsAppText(msg)).toBeUndefined()
  })
})

describe('extractWhatsAppMediaPlaceholder', () => {
  it('returns undefined for null', () => {
    expect(extractWhatsAppMediaPlaceholder(null)).toBeUndefined()
  })

  it('returns <media:image> for imageMessage', () => {
    expect(extractWhatsAppMediaPlaceholder({ imageMessage: {} })).toBe('<media:image>')
  })

  it('returns <media:video> for videoMessage', () => {
    expect(extractWhatsAppMediaPlaceholder({ videoMessage: {} })).toBe('<media:video>')
  })

  it('returns <media:audio> for audioMessage', () => {
    expect(extractWhatsAppMediaPlaceholder({ audioMessage: {} })).toBe('<media:audio>')
  })

  it('returns <media:document> for documentMessage', () => {
    expect(extractWhatsAppMediaPlaceholder({ documentMessage: {} })).toBe('<media:document>')
  })

  it('returns <media:sticker> for stickerMessage', () => {
    expect(extractWhatsAppMediaPlaceholder({ stickerMessage: {} })).toBe('<media:sticker>')
  })

  it('returns undefined for text message', () => {
    expect(extractWhatsAppMediaPlaceholder({ conversation: 'hi' })).toBeUndefined()
  })
})

describe('resolveWhatsAppMessageKind', () => {
  it('returns unknown for null', () => {
    expect(resolveWhatsAppMessageKind(null)).toBe('unknown')
  })

  it('returns text for conversation', () => {
    expect(resolveWhatsAppMessageKind({ conversation: 'hi' })).toBe('text')
  })

  it('returns text for extendedTextMessage', () => {
    expect(resolveWhatsAppMessageKind({ extendedTextMessage: { text: 'hi' } })).toBe('text')
  })

  it('returns image for imageMessage', () => {
    expect(resolveWhatsAppMessageKind({ imageMessage: {} })).toBe('image')
  })

  it('returns video for videoMessage', () => {
    expect(resolveWhatsAppMessageKind({ videoMessage: {} })).toBe('video')
  })

  it('returns audio for audioMessage', () => {
    expect(resolveWhatsAppMessageKind({ audioMessage: {} })).toBe('audio')
  })

  it('returns document for documentMessage', () => {
    expect(resolveWhatsAppMessageKind({ documentMessage: {} })).toBe('document')
  })

  it('returns sticker for stickerMessage', () => {
    expect(resolveWhatsAppMessageKind({ stickerMessage: {} })).toBe('sticker')
  })

  it('returns location for locationMessage', () => {
    expect(resolveWhatsAppMessageKind({ locationMessage: {} })).toBe('location')
  })

  it('returns location for liveLocationMessage', () => {
    expect(resolveWhatsAppMessageKind({ liveLocationMessage: {} })).toBe('location')
  })

  it('returns contact for contactMessage', () => {
    expect(resolveWhatsAppMessageKind({ contactMessage: {} })).toBe('contact')
  })

  it('returns contacts for contactsArrayMessage', () => {
    expect(resolveWhatsAppMessageKind({ contactsArrayMessage: {} })).toBe('contacts')
  })

  it('returns button-response for buttonsResponseMessage', () => {
    expect(resolveWhatsAppMessageKind({ buttonsResponseMessage: {} })).toBe('button-response')
  })

  it('returns list-response for listResponseMessage', () => {
    expect(resolveWhatsAppMessageKind({ listResponseMessage: {} })).toBe('list-response')
  })

  it('returns template-button-reply for templateButtonReplyMessage', () => {
    expect(resolveWhatsAppMessageKind({ templateButtonReplyMessage: {} })).toBe(
      'template-button-reply',
    )
  })

  it('returns interactive-response for interactiveResponseMessage', () => {
    expect(resolveWhatsAppMessageKind({ interactiveResponseMessage: {} })).toBe(
      'interactive-response',
    )
  })
})

describe('extractWhatsAppContextInfo', () => {
  it('returns undefined for null', () => {
    expect(extractWhatsAppContextInfo(null)).toBeUndefined()
  })

  it('extracts contextInfo from extendedTextMessage', () => {
    const ctx = { stanzaId: 'abc', participant: 'user@s.whatsapp.net' }
    const msg: WAMessage = { extendedTextMessage: { contextInfo: ctx } }
    expect(extractWhatsAppContextInfo(msg)).toEqual(ctx)
  })

  it('extracts contextInfo from imageMessage', () => {
    const ctx = { stanzaId: 'img-ctx' }
    const msg: WAMessage = { imageMessage: { contextInfo: ctx } }
    expect(extractWhatsAppContextInfo(msg)).toEqual(ctx)
  })

  it('returns undefined when no contextInfo present', () => {
    expect(extractWhatsAppContextInfo({ conversation: 'hi' })).toBeUndefined()
  })
})

describe('extractWhatsAppMentionedJids', () => {
  it('returns undefined when no mentions', () => {
    expect(extractWhatsAppMentionedJids({ conversation: 'hi' })).toBeUndefined()
  })

  it('extracts mentioned JIDs and deduplicates', () => {
    const msg: WAMessage = {
      extendedTextMessage: {
        contextInfo: {
          mentionedJid: ['a@s.whatsapp.net', 'b@s.whatsapp.net', 'a@s.whatsapp.net'],
        },
      },
    }
    const result = extractWhatsAppMentionedJids(msg)
    expect(result).toHaveLength(2)
    expect(result).toContain('a@s.whatsapp.net')
    expect(result).toContain('b@s.whatsapp.net')
  })
})

describe('extractWhatsAppLocationData', () => {
  it('returns null for null', () => {
    expect(extractWhatsAppLocationData(null)).toBeNull()
  })

  it('extracts location from locationMessage', () => {
    const msg: WAMessage = {
      locationMessage: {
        degreesLatitude: 1.23,
        degreesLongitude: 4.56,
        name: 'Home',
        address: '123 Main St',
      },
    }
    const result = extractWhatsAppLocationData(msg)
    expect(result).not.toBeNull()
    expect(result?.latitude).toBe(1.23)
    expect(result?.longitude).toBe(4.56)
    expect(result?.name).toBe('Home')
    expect(result?.source).toBe('place')
    expect(result?.isLive).toBe(false)
  })

  it('extracts live location from liveLocationMessage', () => {
    const msg: WAMessage = {
      liveLocationMessage: {
        degreesLatitude: 10.0,
        degreesLongitude: 20.0,
        accuracyInMeters: 5,
      },
    }
    const result = extractWhatsAppLocationData(msg)
    expect(result?.source).toBe('live')
    expect(result?.isLive).toBe(true)
    expect(result?.accuracy).toBe(5)
  })

  it('returns null for non-finite coordinates', () => {
    const msg: WAMessage = {
      locationMessage: {
        degreesLatitude: NaN,
        degreesLongitude: 4.56,
      },
    }
    expect(extractWhatsAppLocationData(msg)).toBeNull()
  })

  it('returns pin source when no name or address', () => {
    const msg: WAMessage = {
      locationMessage: {
        degreesLatitude: 1.0,
        degreesLongitude: 2.0,
      },
    }
    const result = extractWhatsAppLocationData(msg)
    expect(result?.source).toBe('pin')
  })
})

describe('extractWhatsAppMessageContent', () => {
  it('returns full extraction for text message', () => {
    const msg: WAMessage = { conversation: 'hello' }
    const result = extractWhatsAppMessageContent(msg)
    expect(result.text).toBe('hello')
    expect(result.kind).toBe('text')
    expect(result.mediaPlaceholder).toBeUndefined()
  })

  it('returns full extraction for image message', () => {
    const msg: WAMessage = { imageMessage: { caption: 'pic' } }
    const result = extractWhatsAppMessageContent(msg)
    expect(result.text).toBe('pic')
    expect(result.kind).toBe('image')
    expect(result.mediaPlaceholder).toBe('<media:image>')
  })

  it('round-trip: kind matches text presence', () => {
    const msg: WAMessage = { audioMessage: {} }
    const result = extractWhatsAppMessageContent(msg)
    expect(result.kind).toBe('audio')
    expect(result.text).toBeUndefined()
    expect(result.mediaPlaceholder).toBe('<media:audio>')
  })
})

describe('hasInboundUserContent', () => {
  it('returns false for null', () => {
    expect(hasInboundUserContent(null)).toBe(false)
  })

  it('returns true for text message', () => {
    expect(hasInboundUserContent({ conversation: 'hi' })).toBe(true)
  })

  it('returns true for image message', () => {
    expect(hasInboundUserContent({ imageMessage: {} })).toBe(true)
  })

  it('returns true for location message', () => {
    expect(
      hasInboundUserContent({
        locationMessage: { degreesLatitude: 1.0, degreesLongitude: 2.0 },
      }),
    ).toBe(true)
  })

  it('returns true for button response', () => {
    expect(hasInboundUserContent({ buttonsResponseMessage: { selectedButtonId: 'x' } })).toBe(true)
  })

  it('returns false for empty message object', () => {
    expect(hasInboundUserContent({})).toBe(false)
  })
})
