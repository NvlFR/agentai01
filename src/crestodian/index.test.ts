import { describe, expect, test } from 'bun:test'

import { createAesGcmCredentialEncryption, createInMemoryCredentialStore } from './index.js'

describe('crestodian', () => {
  test('stores credentials behind metadata-only listing and supports rotation', async () => {
    const store = createInMemoryCredentialStore(createAesGcmCredentialEncryption(new Uint8Array(32).fill(7)))
    const metadata = await store.put({ namespace: 'runtime', plaintext: 'secret-one', labels: ['api'] })

    expect(await store.get(metadata)).toBe('secret-one')
    await store.rotate(metadata, 'secret-two')

    expect(await store.get(metadata)).toBe('secret-two')
    expect(JSON.stringify(await store.list('runtime'))).not.toContain('secret-two')
  })
})
