import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

import { generateId } from '../shared/index.js'
import { nowIso } from '../utils/index.js'

export type CredentialRef = {
  id: string
  namespace: string
}

export type CredentialMetadata = CredentialRef & {
  createdAt: string
  updatedAt: string
  rotationDueAt?: string
  labels: readonly string[]
}

export type StoredCredential = CredentialMetadata & {
  ciphertext: string
}

export type CredentialEncryption = {
  encrypt(plaintext: string): Promise<string>
  decrypt(ciphertext: string): Promise<string>
}

export type CredentialStore = {
  put(input: { namespace: string; plaintext: string; labels?: readonly string[]; rotationDueAt?: string }): Promise<CredentialMetadata>
  get(ref: CredentialRef): Promise<string | null>
  rotate(ref: CredentialRef, nextPlaintext: string, rotationDueAt?: string): Promise<CredentialMetadata | null>
  list(namespace: string): Promise<CredentialMetadata[]>
}

export function createInMemoryCredentialStore(encryption: CredentialEncryption): CredentialStore {
  const records = new Map<string, StoredCredential>()

  return {
    async put(input) {
      const timestamp = nowIso()
      const metadata: CredentialMetadata = {
        id: generateId('cred'),
        namespace: input.namespace,
        createdAt: timestamp,
        updatedAt: timestamp,
        rotationDueAt: input.rotationDueAt,
        labels: input.labels ?? [],
      }
      records.set(recordKey(metadata), {
        ...metadata,
        ciphertext: await encryption.encrypt(input.plaintext),
      })
      return structuredClone(metadata)
    },
    async get(ref) {
      const record = records.get(recordKey(ref))
      return record ? encryption.decrypt(record.ciphertext) : null
    },
    async rotate(ref, nextPlaintext, rotationDueAt) {
      const record = records.get(recordKey(ref))
      if (!record) {
        return null
      }

      const updated: StoredCredential = {
        ...record,
        updatedAt: nowIso(),
        rotationDueAt,
        ciphertext: await encryption.encrypt(nextPlaintext),
      }
      records.set(recordKey(ref), updated)
      const { ciphertext: _ciphertext, ...metadata } = updated
      return structuredClone(metadata)
    },
    async list(namespace) {
      return [...records.values()]
        .filter(record => record.namespace === namespace)
        .map(({ ciphertext: _ciphertext, ...metadata }) => structuredClone(metadata))
    },
  }
}

export function createAesGcmCredentialEncryption(key: Uint8Array): CredentialEncryption {
  if (key.byteLength !== 32) {
    throw new Error('AES-256-GCM credential encryption requires a 32-byte key.')
  }

  return {
    async encrypt(plaintext) {
      const iv = randomBytes(12)
      const cipher = createCipheriv('aes-256-gcm', key, iv)
      const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
      const tag = cipher.getAuthTag()
      return `${iv.toString('base64')}.${tag.toString('base64')}.${ciphertext.toString('base64')}`
    },
    async decrypt(ciphertext) {
      const parts = ciphertext.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid credential ciphertext.')
      }

      const [ivPart, tagPart, ciphertextPart] = parts
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivPart, 'base64'))
      decipher.setAuthTag(Buffer.from(tagPart, 'base64'))
      return Buffer.concat([
        decipher.update(Buffer.from(ciphertextPart, 'base64')),
        decipher.final(),
      ]).toString('utf8')
    },
  }
}

function recordKey(ref: CredentialRef): string {
  return `${ref.namespace}:${ref.id}`
}
