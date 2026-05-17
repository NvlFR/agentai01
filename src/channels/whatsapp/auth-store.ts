// Adapted using referensi/openclaw/extensions/whatsapp/src/creds-persistence.ts and referensi/openclaw/src/infra/atomic.ts
import { mkdir, readFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { BufferJSON } from 'baileys'

import { writeFileAtomic, readFileSafe } from '../../infra/index.js'
import { KeyedAsyncQueue } from '../../plugin-sdk/keyed-async-queue.js'

const CREDS_SAVE_QUEUES = new KeyedAsyncQueue()

export type WhatsAppAuthStoreEnv = {
  stateRoot?: string
}

export function resolveWebCredsPath(accountId: string, env?: WhatsAppAuthStoreEnv): string {
  const root = env?.stateRoot ?? '.agentai-state'
  return join(root, 'whatsapp', `creds-${normalizeAccountId(accountId)}.json`)
}

export function resolveWebCredsBackupPath(accountId: string, env?: WhatsAppAuthStoreEnv): string {
  const root = env?.stateRoot ?? '.agentai-state'
  return join(root, 'whatsapp', `creds-${normalizeAccountId(accountId)}.json.bak`)
}

export async function readCredsJsonRaw(accountId: string, env?: WhatsAppAuthStoreEnv): Promise<string | null> {
  const path = resolveWebCredsPath(accountId, env)
  const result = await readFileSafe(path)
  if (!result.ok) {
    return null
  }
  return result.value
}

export async function writeCredsJsonAtomically(
  accountId: string,
  data: unknown,
  env?: WhatsAppAuthStoreEnv,
): Promise<void> {
  const path = resolveWebCredsPath(accountId, env)
  await mkdir(dirname(path), { recursive: true })
  
  const json = JSON.stringify(data, BufferJSON.replacer)
  const result = await writeFileAtomic(path, json)
  
  if (!result.ok) {
    throw new Error(`Failed to write credentials for ${accountId}: ${result.error}`)
  }

  // Create backup
  const backupPath = resolveWebCredsBackupPath(accountId, env)
  try {
    await writeFileAtomic(backupPath, json)
  } catch {
    // Backup failure is non-fatal for the main write
  }
}

export async function restoreCredsFromBackupIfNeeded(
  accountId: string,
  env?: WhatsAppAuthStoreEnv,
): Promise<boolean> {
  const mainPath = resolveWebCredsPath(accountId, env)
  const backupPath = resolveWebCredsBackupPath(accountId, env)

  try {
    const mainStats = await stat(mainPath)
    if (mainStats.isFile() && mainStats.size > 0) {
      return false
    }
  } catch {
    // Main missing or inaccessible
  }

  try {
    const backupStats = await stat(backupPath)
    if (backupStats.isFile() && backupStats.size > 0) {
      const content = await readFile(backupPath)
      await mkdir(dirname(mainPath), { recursive: true })
      const result = await writeFileAtomic(mainPath, content.toString())
      return result.ok
    }
  } catch {
    // Backup missing
  }

  return false
}

export async function enqueueCredsSave(
  accountId: string,
  data: unknown,
  env?: WhatsAppAuthStoreEnv,
): Promise<void> {
  await CREDS_SAVE_QUEUES.enqueue(accountId, () => writeCredsJsonAtomically(accountId, data, env))
}

function normalizeAccountId(accountId: string): string {
  return accountId.trim().replace(/[^a-z0-9._-]+/giu, '_').toLowerCase() || 'default'
}
