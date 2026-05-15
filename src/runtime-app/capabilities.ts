import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import type { OwnerCommand } from '../agents/ceo/models.js'
import { getSubprocessEnvironment } from './config.js'

export type RuntimeCapabilityAction =
  | 'read_file'
  | 'search_code'
  | 'git_status'
  | 'git_diff'
  | 'read_log'
  | 'list_files'

export type RuntimeCapabilityExecution = {
  action: RuntimeCapabilityAction
  ok: boolean
  title: string
  summary: string
  output: string
  artifactPath: string
}

export function executeWorkspaceCapability(input: {
  command: OwnerCommand
  env: string
  now: string
  cwd?: string
  subprocessEnv?: Record<string, string | undefined>
}): RuntimeCapabilityExecution {
  const cwd = input.cwd ?? process.cwd()
  const subprocessEnv = input.subprocessEnv ?? getSubprocessEnvironment()
  const action = normalizeCapabilityAction(input.command.parameters['action'])
  if (!action) {
    return buildCapabilityFailure({
      env: input.env,
      now: input.now,
      cwd,
      title: 'Workspace Capability Failed',
      summary: 'Action tidak dikenali. Gunakan read_file, search_code, git_status, git_diff, read_log, atau list_files.',
      output: JSON.stringify(input.command.parameters, null, 2),
      suffix: 'unknown-action',
    })
  }

  try {
    switch (action) {
      case 'read_file':
        return executeReadFile(input.command, input.env, input.now, cwd)
      case 'search_code':
        return executeSearchCode(input.command, input.env, input.now, cwd, subprocessEnv)
      case 'git_status':
        return executeGitStatus(input.command, input.env, input.now, cwd, subprocessEnv)
      case 'git_diff':
        return executeGitDiff(input.command, input.env, input.now, cwd, subprocessEnv)
      case 'read_log':
        return executeReadLog(input.command, input.env, input.now, cwd)
      case 'list_files':
        return executeListFiles(input.command, input.env, input.now, cwd, subprocessEnv)
    }
  } catch (error) {
    return buildCapabilityFailure({
      env: input.env,
      now: input.now,
      cwd,
      title: `Workspace ${action}`,
      summary: error instanceof Error ? error.message : String(error),
      output: error instanceof Error && error.stack ? error.stack : String(error),
      suffix: action,
    })
  }
}

function executeReadFile(
  command: OwnerCommand,
  env: string,
  now: string,
  cwd: string,
): RuntimeCapabilityExecution {
  const requestedPath = readRequiredString(command.parameters['path'], 'Path file wajib diisi.')
  const filePath = resolveWorkspacePath(cwd, requestedPath)
  const content = readFileSync(filePath, 'utf8')
  const excerpt = limitTextByLines(content, 220)
  return buildCapabilitySuccess({
    env,
    now,
    cwd,
    title: 'Workspace Read File',
    summary: `Berhasil membaca ${requestedPath}`,
    output: excerpt,
    suffix: 'read-file',
  })
}

function executeSearchCode(
  command: OwnerCommand,
  env: string,
  now: string,
  cwd: string,
  subprocessEnv: Record<string, string | undefined>,
): RuntimeCapabilityExecution {
  const query = readRequiredString(command.parameters['query'], 'Query pencarian wajib diisi.')
  const requestedPath = readOptionalString(command.parameters['path'])
  const searchRoot = requestedPath ? resolveWorkspacePath(cwd, requestedPath) : cwd
  const args = ['-n', '--hidden', '--glob', '!.git', '--glob', '!node_modules', query, searchRoot]
  const result = spawnSync('rg', args, {
    cwd,
    encoding: 'utf8',
    timeout: 120_000,
    env: subprocessEnv,
  })
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim()
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(output || `rg exited with status ${result.status ?? 'unknown'}`)
  }
  const normalized = output || '(no matches)'
  return buildCapabilitySuccess({
    env,
    now,
    cwd,
    title: 'Workspace Search Code',
    summary: `Pencarian kode untuk "${query}" selesai${requestedPath ? ` di ${requestedPath}` : ''}.`,
    output: limitTextByLines(normalized, 240),
    suffix: 'search-code',
  })
}

function executeGitStatus(
  _command: OwnerCommand,
  env: string,
  now: string,
  cwd: string,
  subprocessEnv: Record<string, string | undefined>,
): RuntimeCapabilityExecution {
  const result = runCommand(cwd, ['git', 'status', '--short', '--branch'], subprocessEnv)
  if (result.exitCode !== 0) {
    throw new Error(result.output || 'git status gagal dijalankan.')
  }
  return buildCapabilitySuccess({
    env,
    now,
    cwd,
    title: 'Workspace Git Status',
    summary: 'Status git workspace berhasil dibaca.',
    output: result.output || '(clean working tree)',
    suffix: 'git-status',
  })
}

function executeGitDiff(
  command: OwnerCommand,
  env: string,
  now: string,
  cwd: string,
  subprocessEnv: Record<string, string | undefined>,
): RuntimeCapabilityExecution {
  const requestedPath = readOptionalString(command.parameters['path'])
  const args = ['git', 'diff', '--no-ext-diff', '--', ...(requestedPath ? [requestedPath] : [])]
  const result = runCommand(cwd, args, subprocessEnv)
  if (result.exitCode !== 0) {
    throw new Error(result.output || 'git diff gagal dijalankan.')
  }
  return buildCapabilitySuccess({
    env,
    now,
    cwd,
    title: 'Workspace Git Diff',
    summary: requestedPath
      ? `Diff git untuk ${requestedPath} berhasil dibaca.`
      : 'Diff git workspace berhasil dibaca.',
    output: limitText(result.output || '(no diff)', 12_000),
    suffix: 'git-diff',
  })
}

function executeReadLog(
  command: OwnerCommand,
  env: string,
  now: string,
  cwd: string,
): RuntimeCapabilityExecution {
  const requestedPath = readRequiredString(command.parameters['path'], 'Path log wajib diisi.')
  const lines = readOptionalNumber(command.parameters['lines']) ?? 200
  const filePath = resolveWorkspacePath(cwd, requestedPath)
  const content = readFileSync(filePath, 'utf8')
  const excerpt = tailLines(content, lines)
  return buildCapabilitySuccess({
    env,
    now,
    cwd,
    title: 'Workspace Read Log',
    summary: `Berhasil membaca ${Math.max(1, lines)} baris terakhir dari ${requestedPath}`,
    output: excerpt,
    suffix: 'read-log',
  })
}

function executeListFiles(
  command: OwnerCommand,
  env: string,
  now: string,
  cwd: string,
  subprocessEnv: Record<string, string | undefined>,
): RuntimeCapabilityExecution {
  const requestedPath = readOptionalString(command.parameters['path'])
  const root = requestedPath ? resolveWorkspacePath(cwd, requestedPath) : cwd
  const result = spawnSync('rg', ['--files', root], {
    cwd,
    encoding: 'utf8',
    timeout: 120_000,
    env: subprocessEnv,
  })
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim()
  if (result.status !== 0) {
    throw new Error(output || `rg --files exited with status ${result.status ?? 'unknown'}`)
  }
  return buildCapabilitySuccess({
    env,
    now,
    cwd,
    title: 'Workspace List Files',
    summary: requestedPath
      ? `Daftar file di ${requestedPath} berhasil dibaca.`
      : 'Daftar file workspace berhasil dibaca.',
    output: limitTextByLines(output || '(no files)', 300),
    suffix: 'list-files',
  })
}

function buildCapabilitySuccess(input: {
  env: string
  now: string
  cwd: string
  title: string
  summary: string
  output: string
  suffix: string
}): RuntimeCapabilityExecution {
  const artifactPath = writeCapabilityArtifact({
    env: input.env,
    now: input.now,
    title: input.title,
    summary: input.summary,
    output: input.output,
    suffix: input.suffix,
    ok: true,
    cwd: input.cwd,
  })
  return {
    action: suffixToAction(input.suffix),
    ok: true,
    title: input.title,
    summary: input.summary,
    output: input.output,
    artifactPath,
  }
}

function buildCapabilityFailure(input: {
  env: string
  now: string
  cwd: string
  title: string
  summary: string
  output: string
  suffix: string
}): RuntimeCapabilityExecution {
  const artifactPath = writeCapabilityArtifact({
    env: input.env,
    now: input.now,
    title: input.title,
    summary: input.summary,
    output: input.output,
    suffix: input.suffix,
    ok: false,
    cwd: input.cwd,
  })
  return {
    action: suffixToAction(input.suffix),
    ok: false,
    title: input.title,
    summary: input.summary,
    output: input.output,
    artifactPath,
  }
}

function writeCapabilityArtifact(input: {
  env: string
  now: string
  title: string
  summary: string
  output: string
  suffix: string
  ok: boolean
  cwd: string
}): string {
  const dir = path.join(input.cwd, 'runtime', input.env, 'artifacts', 'capabilities')
  mkdirSync(dir, { recursive: true })
  const safeStamp = input.now.replaceAll(':', '-')
  const filePath = path.join(dir, `${safeStamp}-${input.suffix}.md`)
  const content = [
    `# ${input.title}`,
    '',
    `- Status: ${input.ok ? 'PASS' : 'FAIL'}`,
    `- Generated At: ${input.now}`,
    `- Summary: ${input.summary}`,
    '',
    '## Output',
    '```text',
    input.output || '(no output)',
    '```',
    '',
  ].join('\n')
  writeFileSync(filePath, content, 'utf8')
  return filePath
}

function runCommand(
  cwd: string,
  command: readonly string[],
  subprocessEnv: Record<string, string | undefined>,
): {
  exitCode: number | null
  output: string
} {
  if (command.length === 0) {
    throw new Error('Command cannot be empty.')
  }
  const result = spawnSync(command[0], command.slice(1), {
    cwd,
    encoding: 'utf8',
    timeout: 120_000,
    env: subprocessEnv,
  })
  return {
    exitCode: result.status,
    output: `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim(),
  }
}

function resolveWorkspacePath(cwd: string, requestedPath: string): string {
  const resolved = path.resolve(cwd, requestedPath)
  const relative = path.relative(cwd, resolved)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Path di luar workspace tidak diizinkan: ${requestedPath}`)
  }
  return resolved
}

function readRequiredString(value: unknown, message: string): string {
  const normalized = readOptionalString(value)
  if (!normalized) {
    throw new Error(message)
  }
  return normalized
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const normalized = value.trim()
  return normalized || undefined
}

function readOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.floor(value))
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return Math.max(1, Math.floor(parsed))
    }
  }
  return undefined
}

function normalizeCapabilityAction(value: unknown): RuntimeCapabilityAction | undefined {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  switch (normalized) {
    case 'read-file':
    case 'read_file':
      return 'read_file'
    case 'search-code':
    case 'search_code':
      return 'search_code'
    case 'git-status':
    case 'git_status':
      return 'git_status'
    case 'git-diff':
    case 'git_diff':
      return 'git_diff'
    case 'read-log':
    case 'read_log':
      return 'read_log'
    case 'list-files':
    case 'list_files':
      return 'list_files'
    default:
      return undefined
  }
}

function suffixToAction(value: string): RuntimeCapabilityAction {
  return normalizeCapabilityAction(value.replaceAll('-', '_')) ?? 'read_file'
}

function limitTextByLines(text: string, maxLines: number): string {
  return text.split('\n').slice(0, maxLines).join('\n')
}

function tailLines(text: string, maxLines: number): string {
  const lines = text.split('\n')
  return lines.slice(Math.max(0, lines.length - maxLines)).join('\n')
}

function limitText(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text
  }
  return `${text.slice(0, maxChars).trim()}...`
}
