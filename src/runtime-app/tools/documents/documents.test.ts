import { describe, expect, it } from 'bun:test'
import JSZip from 'jszip'

import { detectBinaryType } from './binaryDetect.js'
import { inspectArchive } from './archiveInspect.js'
import { readPdfSummary } from './pdfRead.js'
import { createOperatorPdf } from './pdfWrite.js'
import { parseHtmlFallback } from '../../../web-fetch/html-fallback-parser.js'

describe('document tooling', () => {
  it('detects binary mime types with file-type', async () => {
    const png = Uint8Array.from([
      137, 80, 78, 71, 13, 10, 26, 10,
      0, 0, 0, 13, 73, 72, 68, 82,
      0, 0, 0, 1, 0, 0, 0, 1,
      8, 2, 0, 0, 0,
    ])
    await expect(detectBinaryType(png)).resolves.toBe('image/png')
  })

  it('creates and reads PDFs', async () => {
    const pdf = await createOperatorPdf({
      title: 'Agent Report',
      body: 'Dependency integration ready.',
    })

    await expect(readPdfSummary(pdf)).resolves.toEqual({
      pageCount: 1,
    })
  })

  it('inspects zip archives and rejects traversal entries', async () => {
    const zip = new JSZip()
    zip.file('report.txt', 'ok')
    const buffer = await zip.generateAsync({ type: 'uint8array' })
    await expect(inspectArchive(buffer)).resolves.toEqual(['report.txt'])
  })

  it('parses html fallback content', () => {
    expect(parseHtmlFallback('<html><head><title>Demo</title></head><body><h1>Hello</h1></body></html>')).toEqual({
      title: 'Demo',
      text: 'Demo Hello',
    })
  })
})
