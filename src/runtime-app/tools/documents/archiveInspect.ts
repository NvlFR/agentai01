import JSZip from 'jszip'

export async function inspectArchive(buffer: Uint8Array): Promise<string[]> {
  const archive = await JSZip.loadAsync(buffer)
  const entries = Object.keys(archive.files)

  if (entries.some(entry => entry.includes('..'))) {
    throw new Error('Archive contains unsafe path traversal segments')
  }

  return entries.sort()
}
