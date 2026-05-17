// Adapted using referensi/openclaw/src/plugin-sdk/runtime.ts and referensi/openclaw/src/infra/plugin-install-path-warnings.ts
import { access, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve as resolvePath } from 'node:path'

import JSZip from 'jszip'

export type BackupArchiveInput = {
  archivePath: string
  content: string | Uint8Array
}

export type BackupArchiveResult = {
  archivePath: string
  entryCount: number
  bytes: number
}

export type PluginInstallPathIssue = {
  kind: 'custom-path' | 'missing-path'
  pluginId: string
  path: string
}

export async function createBackupArchive(params: {
  outputPath: string
  files: readonly BackupArchiveInput[]
}): Promise<BackupArchiveResult> {
  const zip = new JSZip()
  for (const file of params.files) {
    zip.file(file.archivePath, file.content)
  }

  const content = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
  })
  const outputPath = resolvePath(params.outputPath)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, content)

  return {
    archivePath: outputPath,
    entryCount: params.files.length,
    bytes: content.byteLength,
  }
}

export async function detectPluginInstallPathIssue(params: {
  pluginId: string
  install: {
    source?: string | null
    sourcePath?: string | null
    installPath?: string | null
  } | null | undefined
}): Promise<PluginInstallPathIssue | null> {
  const install = params.install
  if (!install || install.source !== 'path') {
    return null
  }

  const candidatePaths = [install.sourcePath, install.installPath]
    .map(value => value?.trim() ?? '')
    .filter(Boolean)

  if (candidatePaths.length === 0) {
    return null
  }

  for (const candidatePath of candidatePaths) {
    try {
      await access(resolvePath(candidatePath))
      return {
        kind: 'custom-path',
        pluginId: params.pluginId,
        path: candidatePath,
      }
    } catch {
      continue
    }
  }

  return {
    kind: 'missing-path',
    pluginId: params.pluginId,
    path: candidatePaths[0],
  }
}

export function formatPluginInstallPathIssue(params: {
  issue: PluginInstallPathIssue
  pluginLabel: string
  defaultInstallCommand: string
  repoInstallCommand?: string | null
  formatCommand?: (command: string) => string
}): string[] {
  const formatCommand = params.formatCommand ?? (command => command)
  if (params.issue.kind === 'custom-path') {
    return [
      `${params.pluginLabel} is installed from a custom path: ${params.issue.path}`,
      `Reinstall with "${formatCommand(params.defaultInstallCommand)}" to restore the default package.`,
      ...(params.repoInstallCommand
        ? [
            `If you intentionally use a repo checkout, reinstall it with "${formatCommand(params.repoInstallCommand)}".`,
          ]
        : []),
    ]
  }

  return [
    `${params.pluginLabel} is installed from a custom path that no longer exists: ${params.issue.path}`,
    `Reinstall with "${formatCommand(params.defaultInstallCommand)}".`,
    ...(params.repoInstallCommand
      ? [
          `If you are running from a repo checkout, you can also use "${formatCommand(params.repoInstallCommand)}".`,
        ]
      : []),
  ]
}
