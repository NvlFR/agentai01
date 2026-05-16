import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'bun:test'
import { MemoryFileStore } from './index.js'

let tempDir: string | undefined

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true })
    tempDir = undefined
  }
})

async function makeStore(): Promise<MemoryFileStore> {
  tempDir = await mkdtemp(join(tmpdir(), 'agentai-memory-'))
  return new MemoryFileStore(tempDir)
}

describe('memory', () => {
  it('isolates files by namespace and keeps owner attribution', async () => {
    const store = await makeStore()
    const project = store.namespace('project', 'client-a', { projectId: 'client-a' })
    const agent = store.namespace('agent', 'support-agent', { agentId: 'support-agent' })

    await store.write(project, 'brief', { text: 'project memory' }, new Date('2026-05-16T00:00:00.000Z'))
    await store.write(agent, 'brief', { text: 'agent memory' }, new Date('2026-05-16T00:00:00.000Z'))

    expect((await store.read(project, 'brief'))?.value).toEqual({ text: 'project memory' })
    expect((await store.read(agent, 'brief'))?.value).toEqual({ text: 'agent memory' })
    expect((await store.read(project, 'brief'))?.namespace.owner).toEqual({ projectId: 'client-a' })
  })

  it('migrates versioned memory files and repairs malformed json', async () => {
    const store = await makeStore()
    const namespace = store.namespace('project', 'client-a')
    await store.write(namespace, 'profile', { version: 0, name: 'Ada' })

    const migrated = await store.migrate(namespace, [
      {
        id: 'add-kind',
        fromVersion: 0,
        toVersion: 1,
        migrate: value => ({ ...(typeof value === 'object' && value !== null ? value : {}), kind: 'profile' }),
      },
    ])

    await writeFile(join(namespace.path, 'broken.json'), '{bad json', 'utf8')
    const repair = await store.repair(namespace)
    const raw = await readFile(migrated[0]?.path ?? '', 'utf8')

    expect(JSON.parse(raw)).toMatchObject({ value: { version: 1, name: 'Ada', kind: 'profile' } })
    expect(repair.repaired).toHaveLength(1)
    expect(await store.exists(join(namespace.path, 'broken.json'))).toBe(false)
  })
})
