import { createHash } from 'node:crypto'
import { mkdir, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { readFileSafe, writeFileAtomic } from '../../infra/index.js'

const STORE_VERSION = 1

type TelegramUpdateOffsetRecord = {
  version: number
  lastUpdateId: number | null
  tokenFingerprint: string | null
}

export type TelegramUpdateOffsetStoreOptions = {
  storePath?: string
  stateRoot?: string
  accountId?: string
  token?: string | null
}

export function resolveTelegramUpdateOffsetPath(
  stateRoot: string,
  accountId = 'default',
): string {
  return join(
    stateRoot,
    'telegram',
    `update-offset-${normalizeAccountId(accountId)}.json`,
  )
}

export async function readTelegramUpdateOffset(
  options: TelegramUpdateOffsetStoreOptions,
): Promise<number | null> {
  const storePath = resolveStorePath(options)
  const result = await readFileSafe(storePath)
  if (!result.ok) {
    return null
  }

  const parsed = parseTelegramUpdateOffset(result.value)
  if (!parsed) {
    return null
  }

  if (parsed.version !== STORE_VERSION) {
    return null
  }

  const currentFingerprint = fingerprintTelegramToken(options.token)
  if (currentFingerprint && parsed.tokenFingerprint !== currentFingerprint) {
    return null
  }

  return parsed.lastUpdateId
}

export async function writeTelegramUpdateOffset(
  options: TelegramUpdateOffsetStoreOptions & { updateId: number },
): Promise<void> {
  if (!Number.isSafeInteger(options.updateId) || options.updateId < 0) {
    throw new Error('Telegram update offset must be a non-negative safe integer.')
  }

  const storePath = resolveStorePath(options)
  await mkdir(dirname(storePath), { recursive: true })
  const payload: TelegramUpdateOffsetRecord = {
    version: STORE_VERSION,
    lastUpdateId: options.updateId,
    tokenFingerprint: fingerprintTelegramToken(options.token),
  }
  const writeResult = await writeFileAtomic(storePath, JSON.stringify(payload, null, 2))
  if (!writeResult.ok) {
    throw new Error(writeResult.error)
  }
}

export async function deleteTelegramUpdateOffset(
  options: TelegramUpdateOffsetStoreOptions,
): Promise<void> {
  const storePath = resolveStorePath(options)
  await rm(storePath, { force: true })
}

function resolveStorePath(options: TelegramUpdateOffsetStoreOptions): string {
  if (options.storePath) {
    return options.storePath
  }

  return resolveTelegramUpdateOffsetPath(options.stateRoot ?? '.agentai-state', options.accountId)
}

function parseTelegramUpdateOffset(raw: string): TelegramUpdateOffsetRecord | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }

    const version = readRecordNumber(parsed, 'version')
    const lastUpdateId = readNullableUpdateId(parsed, 'lastUpdateId')
    const tokenFingerprint = readNullableString(parsed, 'tokenFingerprint')
    if (version == null || lastUpdateId === undefined || tokenFingerprint === undefined) {
      return null
    }

    return {
      version,
      lastUpdateId,
      tokenFingerprint,
    }
  } catch {
    return null
  }
}

function readRecordNumber(record: unknown, key: string): number | null {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return null
  }

  const value = (record as Record<string, unknown>)[key]
  return typeof value === 'number' && Number.isSafeInteger(value) ? value : null
}

function readNullableUpdateId(record: unknown, key: string): number | null | undefined {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return undefined
  }

  const value = (record as Record<string, unknown>)[key]
  if (value === null) {
    return null
  }

  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? value
    : undefined
}

function readNullableString(record: unknown, key: string): string | null | undefined {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return undefined
  }

  const value = (record as Record<string, unknown>)[key]
  if (value === null) {
    return null
  }

  return typeof value === 'string' ? value : undefined
}

function normalizeAccountId(accountId: string): string {
  const trimmed = accountId.trim()
  if (!trimmed) {
    return 'default'
  }

  return trimmed.replace(/[^a-z0-9._-]+/giu, '_').toLowerCase()
}

function fingerprintTelegramToken(token: string | null | undefined): string | null {
  const normalized = token?.trim()
  if (!normalized) {
    return null
  }

  return createHash('sha256').update(normalized).digest('hex').slice(0, 16)
}
