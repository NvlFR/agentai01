import { describe, expect, test } from 'bun:test'

import { createPairingManager } from './index.js'

describe('pairing', () => {
  test('pairs only with the issued token and hides token material from state', () => {
    const manager = createPairingManager()
    const issued = manager.issue({ subject: 'operator-device' })

    expect(manager.consume(issued.tokenId, 'wrong')).toBeNull()
    expect(manager.consume(issued.tokenId, issued.token)?.status).toBe('paired')
    expect(JSON.stringify(manager.list())).not.toContain(issued.token)
  })
})
