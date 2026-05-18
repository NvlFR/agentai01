import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  buildManagedMcpInstallPlan,
  buildManagedMcpWorkspaceManifest,
  getDefaultManagedMcpVendorRoot,
  type ManagedMcpRepositoryInstallPlan,
} from './repositories.js'

type CliOptions = {
  readonly agentIds: readonly string[]
  readonly vendorRoot: string
  readonly manifestPath: string
  readonly planOnly: boolean
}

const options = parseArgs(process.argv.slice(2))
const installPlan = buildManagedMcpInstallPlan({
  agentIds: options.agentIds,
  vendorRoot: options.vendorRoot,
})

if (options.planOnly) {
  const manifest = buildManagedMcpWorkspaceManifest({
    agentIds: options.agentIds,
    vendorRoot: options.vendorRoot,
  })
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`)
  process.exit(0)
}

mkdirSync(options.vendorRoot, { recursive: true })
const installed: string[] = []
const skipped: string[] = []
const failures: Array<{ id: string; reason: string }> = []

for (const repository of installPlan) {
  const result = syncRepository(repository)
  switch (result.status) {
    case 'installed':
      installed.push(repository.id)
      break
    case 'skipped':
      skipped.push(repository.id)
      break
    case 'failed':
      failures.push({ id: repository.id, reason: result.reason })
      break
  }
}

const manifest = buildManagedMcpWorkspaceManifest({
  agentIds: options.agentIds,
  vendorRoot: options.vendorRoot,
})
mkdirSync(path.dirname(options.manifestPath), { recursive: true })
writeFileSync(options.manifestPath, JSON.stringify({
  ...manifest,
  installed,
  skipped,
  failures,
}, null, 2), 'utf8')

process.stdout.write([
  `Managed MCP vendor root: ${options.vendorRoot}`,
  `Manifest: ${options.manifestPath}`,
  `Installed: ${installed.length}`,
  installed.length > 0 ? `  - ${installed.join(', ')}` : '',
  `Skipped: ${skipped.length}`,
  skipped.length > 0 ? `  - ${skipped.join(', ')}` : '',
  `Failures: ${failures.length}`,
  failures.length > 0 ? failures.map(entry => `  - ${entry.id}: ${entry.reason}`).join('\n') : '',
].filter(Boolean).join('\n') + '\n')

if (failures.length > 0) {
  process.exit(1)
}

function parseArgs(args: readonly string[]): CliOptions {
  const agentIds: string[] = []
  let vendorRoot = getDefaultManagedMcpVendorRoot()
  let manifestPath = path.join(vendorRoot, 'manifest.json')
  let planOnly = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--agent') {
      const value = args[index + 1]
      if (!value) {
        throw new Error('--agent requires a value')
      }
      agentIds.push(value)
      index += 1
      continue
    }
    if (arg === '--vendor-root') {
      const value = args[index + 1]
      if (!value) {
        throw new Error('--vendor-root requires a value')
      }
      vendorRoot = path.resolve(value)
      manifestPath = path.join(vendorRoot, 'manifest.json')
      index += 1
      continue
    }
    if (arg === '--manifest') {
      const value = args[index + 1]
      if (!value) {
        throw new Error('--manifest requires a value')
      }
      manifestPath = path.resolve(value)
      index += 1
      continue
    }
    if (arg === '--plan') {
      planOnly = true
      continue
    }
    throw new Error(`Unknown argument: ${arg}`)
  }

  return {
    agentIds,
    vendorRoot,
    manifestPath,
    planOnly,
  }
}

function syncRepository(
  repository: ManagedMcpRepositoryInstallPlan,
): { status: 'installed' | 'skipped' } | { status: 'failed'; reason: string } {
  mkdirSync(path.dirname(repository.localPath), { recursive: true })

  if (!existsSync(repository.localPath)) {
    const clone = spawnSync(
      'git',
      ['clone', '--depth', '1', repository.url, repository.localPath],
      { encoding: 'utf8' },
    )
    if (clone.status !== 0) {
      return {
        status: 'failed',
        reason: compactError(clone.stderr || clone.stdout || 'git clone failed'),
      }
    }
    return { status: 'installed' }
  }

  const remote = spawnSync(
    'git',
    ['-C', repository.localPath, 'remote', 'get-url', 'origin'],
    { encoding: 'utf8' },
  )
  if (remote.status !== 0) {
    return {
      status: 'failed',
      reason: compactError(remote.stderr || remote.stdout || 'unable to inspect git remote'),
    }
  }

  const currentRemote = remote.stdout.trim().replace(/\.git$/, '')
  const expectedRemote = repository.url.trim().replace(/\.git$/, '')
  if (currentRemote !== expectedRemote) {
    return {
      status: 'failed',
      reason: `existing checkout points to ${currentRemote}, expected ${expectedRemote}`,
    }
  }

  const fetch = spawnSync(
    'git',
    ['-C', repository.localPath, 'fetch', '--depth', '1', 'origin'],
    { encoding: 'utf8' },
  )
  if (fetch.status !== 0) {
    return {
      status: 'failed',
      reason: compactError(fetch.stderr || fetch.stdout || 'git fetch failed'),
    }
  }

  return { status: 'skipped' }
}

function compactError(text: string): string {
  return text.trim().split('\n').filter(Boolean)[0] ?? 'unknown error'
}
