import { PDFDocument, StandardFonts } from 'pdf-lib'

export async function createOperatorPdf(input: {
  title: string
  body: string
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595, 842])
  const font = await pdf.embedFont(StandardFonts.Helvetica)

  page.drawText(input.title, {
    x: 48,
    y: 780,
    size: 20,
    font,
  })
  page.drawText(input.body, {
    x: 48,
    y: 740,
    size: 12,
    font,
    maxWidth: 480,
    lineHeight: 16,
  })

  return pdf.save()
}
