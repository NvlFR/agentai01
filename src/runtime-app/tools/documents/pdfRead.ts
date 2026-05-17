import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

export async function readPdfSummary(buffer: Uint8Array): Promise<{
  pageCount: number
}> {
  const document = await getDocument({
    data: buffer,
    useWorkerFetch: false,
  }).promise

  return {
    pageCount: document.numPages,
  }
}
