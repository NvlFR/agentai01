import { afterEach, describe, expect, it } from 'bun:test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import JSZip from 'jszip'

import { createTempDirectory } from '../infra/index.js'
import {
  createBackupArchive,
  detectPluginInstallPathIssue,
  formatPluginInstallPathIssue,
} from './backup-utils.js'

describe('backup-utils', () => {
  let tempDir: Awaited<ReturnType<typeof createTempDirectory>> | null = null

  afterEach(async () => {
    await tempDir?.dispose()
    tempDir = null
  })

  it('creates backup archive with expected files', async () => {
    tempDir = await createTempDirectory('plugin-sdk-backup-')
    const archivePath = join(tempDir.path, 'backup.zip')
    const result = await createBackupArchive({
      outputPath: archivePath,
      files: [
        {
          archivePath: 'manifest.json',
          content: '{"ok":true}',
        },
        {
          archivePath: 'state/session.txt',
          content: 'hello',
        },
      ],
    })

    const loaded = await JSZip.loadAsync(await Bun.file(result.archivePath).arrayBuffer())
    expect(result.entryCount).toBe(2)
    expect(await loaded.file('manifest.json')?.async('text')).toBe('{"ok":true}')
    expect(await loaded.file('state/session.txt')?.async('text')).toBe('hello')
  })

  it('detects plugin install path issues and formats them', async () => {
    tempDir = await createTempDirectory('plugin-sdk-backup-')
    const existingPath = join(tempDir.path, 'plugin')
    await mkdir(existingPath, { recursive: true })

    const customIssue = await detectPluginInstallPathIssue({
      pluginId: 'telegram',
      install: {
        source: 'path',
        sourcePath: existingPath,
      },
    })
    expect(customIssue?.kind).toBe('custom-path')

    const formatted = formatPluginInstallPathIssue({
      issue: customIssue!,
      pluginLabel: 'Telegram',
      defaultInstallCommand: 'npm run install telegram',
    })
    expect(formatted[0]).toContain('custom path')
  })
})
