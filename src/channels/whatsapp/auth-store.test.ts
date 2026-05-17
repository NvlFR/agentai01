import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { rm, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { 
  resolveWebCredsPath, 
  resolveWebCredsBackupPath, 
  writeCredsJsonAtomically, 
  readCredsJsonRaw,
  restoreCredsFromBackupIfNeeded,
  enqueueCredsSave
} from './auth-store.js'

describe('WhatsApp Auth Store', () => {
  const testRoot = join(process.cwd(), '.agentai-test-auth-store')
  const env = { stateRoot: testRoot }
  const accountId = 'test-account'

  beforeEach(async () => {
    await rm(testRoot, { recursive: true, force: true })
    await mkdir(testRoot, { recursive: true })
  })

  afterEach(async () => {
    await rm(testRoot, { recursive: true, force: true })
  })

  it('resolves credentials paths', () => {
    const path = resolveWebCredsPath(accountId, env)
    const backupPath = resolveWebCredsBackupPath(accountId, env)
    
    expect(path).toContain('whatsapp/creds-test-account.json')
    expect(backupPath).toContain('whatsapp/creds-test-account.json.bak')
  })

  it('writes and reads credentials', async () => {
    const data = { foo: 'bar', buf: Buffer.from('hello') }
    await writeCredsJsonAtomically(accountId, data, env)
    
    const raw = await readCredsJsonRaw(accountId, env)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.foo).toBe('bar')
    // BufferJSON encoding check (base64)
    expect(parsed.buf.type).toBe('Buffer')
  })

  it('restores from backup if main file is missing', async () => {
    const path = resolveWebCredsPath(accountId, env)
    const backupPath = resolveWebCredsBackupPath(accountId, env)
    
    await mkdir(join(testRoot, 'whatsapp'), { recursive: true })
    const data = JSON.stringify({ recovered: true })
    await writeFile(backupPath, data)
    
    const restored = await restoreCredsFromBackupIfNeeded(accountId, env)
    expect(restored).toBe(true)
    
    const raw = await readCredsJsonRaw(accountId, env)
    expect(JSON.parse(raw!).recovered).toBe(true)
  })

  it('queues saves for the same account', async () => {
    let callCount = 0
    const data = { count: 0 }
    
    // We can't easily mock writeCredsJsonAtomically because it's in the same file
    // but we can check if it finishes correctly
    await Promise.all([
      enqueueCredsSave(accountId, { v: 1 }, env),
      enqueueCredsSave(accountId, { v: 2 }, env),
      enqueueCredsSave(accountId, { v: 3 }, env)
    ])
    
    const raw = await readCredsJsonRaw(accountId, env)
    expect(JSON.parse(raw!).v).toBe(3)
  })
})
