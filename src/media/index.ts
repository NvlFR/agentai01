import { mkdir, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'

import { createTempDirectory, resolveInside, type TempDirectory } from '../infra/index.js'
import { err, ok, type Result } from '../shared/index.js'

export type MediaKind = 'image' | 'audio' | 'video' | 'document' | 'unknown'

export type MediaDescriptor = {
  kind: MediaKind
  mime: string
  extension?: string
}

export type MediaValidationPolicy = {
  allowedKinds?: readonly MediaKind[]
  maxBytes: number
}

export type MediaInput = {
  bytes: Uint8Array
  fileName?: string
  mime?: string
}

export type StoredTempMedia = {
  path: string
  descriptor: MediaDescriptor
  bytes: number
  dispose: () => Promise<void>
}

const EXTENSIONS: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
}

export function normalizeMimeType(mime?: string | null): string | undefined {
  const normalized = mime?.split(';')[0]?.trim().toLowerCase()
  return normalized || undefined
}

export function detectMedia(input: MediaInput): MediaDescriptor {
  const sniffed = sniffMime(input.bytes)
  const mime = sniffed ?? normalizeMimeType(input.mime) ?? mimeFromName(input.fileName) ?? 'application/octet-stream'
  return {
    kind: kindFromMime(mime),
    mime,
    extension: EXTENSIONS[mime],
  }
}

export function validateMediaInput(
  input: MediaInput,
  policy: MediaValidationPolicy,
): Result<MediaDescriptor, string> {
  if (input.bytes.byteLength > policy.maxBytes) {
    return err(`Media exceeds ${policy.maxBytes} bytes`)
  }

  const descriptor = detectMedia(input)
  if (policy.allowedKinds && !policy.allowedKinds.includes(descriptor.kind)) {
    return err(`Media kind ${descriptor.kind} is not allowed`)
  }

  return ok(descriptor)
}

export async function writeTempMedia(
  input: MediaInput,
  policy: MediaValidationPolicy,
  tempDirectory?: TempDirectory,
): Promise<Result<StoredTempMedia, string>> {
  const validation = validateMediaInput(input, policy)
  if (!validation.ok) {
    return validation
  }

  const ownedDirectory = tempDirectory ?? await createTempDirectory('agentai01-media-')
  const fileName = safeFileName(input.fileName, validation.value.extension)
  const safePath = resolveInside(ownedDirectory.path, fileName)
  if (!safePath.ok) {
    await ownedDirectory.dispose()
    return safePath
  }

  await mkdir(ownedDirectory.path, { recursive: true })
  await writeFile(safePath.value.path, input.bytes)

  return ok({
    path: safePath.value.path,
    descriptor: validation.value,
    bytes: input.bytes.byteLength,
    dispose: ownedDirectory.dispose,
  })
}

function kindFromMime(mime: string): MediaKind {
  if (mime.startsWith('image/')) {
    return 'image'
  }
  if (mime.startsWith('audio/')) {
    return 'audio'
  }
  if (mime.startsWith('video/')) {
    return 'video'
  }
  if (mime === 'application/pdf' || mime.startsWith('text/')) {
    return 'document'
  }
  return 'unknown'
}

function sniffMime(bytes: Uint8Array): string | undefined {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png'
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return 'image/jpeg'
  }
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'application/pdf'
  }
  return undefined
}

function mimeFromName(fileName?: string): string | undefined {
  const extension = fileName?.toLowerCase().match(/\.[a-z0-9]+$/)?.[0]
  return Object.entries(EXTENSIONS).find(([, ext]) => ext === extension)?.[0]
}

function safeFileName(fileName?: string, extension = '.bin'): string {
  const leaf = basename(fileName ?? `media-${crypto.randomUUID()}${extension}`)
  const sanitized = leaf.replace(/[^A-Za-z0-9._-]/g, '-')
  return sanitized.includes('.') ? sanitized : `${sanitized}${extension}`
}
