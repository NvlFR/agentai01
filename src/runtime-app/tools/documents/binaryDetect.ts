import { fileTypeFromBuffer } from 'file-type'

export async function detectBinaryType(buffer: Uint8Array): Promise<string | undefined> {
  const detected = await fileTypeFromBuffer(buffer)
  return detected?.mime
}
