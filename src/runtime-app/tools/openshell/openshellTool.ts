import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import path from 'node:path'

export type OpenShellAuditEntry = {
  toolId: 'openshell'
  timestamp: string
  command: string
  cwd: string
  exitCode: number | null
  status: 'completed' | 'failed' | 'blocked' | 'timeout'
  durationMs: number
}

export type OpenShellExecution = {
  ok: boolean
  status: OpenShellAuditEntry['status']
  output: string
  audit: OpenShellAuditEntry
}

export type OpenShellRunner = (args: {
  executable: string
  args: string[]
  cwd: string
  timeoutMs: number
}) => Promise<{ stdout: string; stderr: string; exitCode: number | null; timedOut: boolean }>

type OpenShellOptions = {
  allowedDirs?: string[]
  timeoutMs?: number
  networkAllowlist?: string[]
  runner?: OpenShellRunner
}

const BLOCKED_COMMANDS = new Set([
  'rm',
  'sudo',
  'su',
  'chmod',
  'chown',
  'dd',
  'mkfs',
  'poweroff',
  'reboot',
  'shutdown',
])

const BLOCKED_PATTERNS = [
  /(^|[\s"'`])rm\s+-rf\s+\//,
  /(^|[\s"'`])\/etc\/passwd([\s"'`]|$)/,
  /(^|[\s"'`])\.\.(\/|\\)/,
  /[;&|`]/,
  /\$\(/,
]

export class OpenShellTool {
  readonly id = 'openshell' as const
  private readonly allowedDirs: string[]
  private readonly timeoutMs: number
  private readonly networkAllowlist: string[]
  private readonly runner: OpenShellRunner

  constructor(options: OpenShellOptions = {}) {
    this.allowedDirs = (options.allowedDirs ?? parseCsv(process.env['OPENSHELL_ALLOWED_DIRS'] ?? ''))
      .filter(Boolean)
      .map(dir => path.resolve(dir))
    this.timeoutMs = options.timeoutMs ?? parsePositiveInt(process.env['OPENSHELL_COMMAND_TIMEOUT_MS'], 30_000)
    this.networkAllowlist = (options.networkAllowlist ?? parseCsv(process.env['OPENSHELL_NETWORK_ALLOWLIST'] ?? ''))
      .filter(Boolean)
    this.runner = options.runner ?? spawnRunner
  }

  isEnabled(): boolean {
    return process.env['OPENSHELL_ENABLED'] === 'true'
  }

  async execute(command: string, cwd: string): Promise<OpenShellExecution> {
    const startedAt = Date.now()
    const resolvedCwd = path.resolve(cwd)

    if (!this.isEnabled()) {
      return this.blocked(command, resolvedCwd, startedAt, 'OpenShell is disabled. Set OPENSHELL_ENABLED=true to enable it.')
    }

    if (!this.isAllowedDir(resolvedCwd)) {
      return this.blocked(command, resolvedCwd, startedAt, `Working directory is outside OPENSHELL_ALLOWED_DIRS: ${resolvedCwd}`)
    }

    const validation = this.validateCommand(command)
    if (!validation.ok) {
      return this.blocked(command, resolvedCwd, startedAt, validation.message)
    }

    const result = await this.runner({
      executable: validation.executable,
      args: validation.args,
      cwd: resolvedCwd,
      timeoutMs: this.timeoutMs,
    })

    const output = joinOutput(result.stdout, result.stderr)
    const status = result.timedOut
      ? 'timeout'
      : result.exitCode === 0
        ? 'completed'
        : 'failed'

    return {
      ok: status === 'completed',
      status,
      output,
      audit: {
        toolId: this.id,
        timestamp: new Date().toISOString(),
        command,
        cwd: resolvedCwd,
        exitCode: result.exitCode,
        status,
        durationMs: Date.now() - startedAt,
      },
    }
  }

  private blocked(command: string, cwd: string, startedAt: number, message: string): OpenShellExecution {
    return {
      ok: false,
      status: 'blocked',
      output: message,
      audit: {
        toolId: this.id,
        timestamp: new Date().toISOString(),
        command,
        cwd,
        exitCode: null,
        status: 'blocked',
        durationMs: Date.now() - startedAt,
      },
    }
  }

  private isAllowedDir(targetDir: string): boolean {
    return this.allowedDirs.some(allowedDir => targetDir === allowedDir || targetDir.startsWith(`${allowedDir}${path.sep}`))
  }

  private validateCommand(command: string):
    | { ok: true; executable: string; args: string[] }
    | { ok: false; message: string } {
    const trimmed = command.trim()
    if (!trimmed) {
      return { ok: false, message: 'Command must not be empty.' }
    }

    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { ok: false, message: 'Command blocked by security validation.' }
      }
    }

    const parsed = tokenizeCommand(trimmed)
    if (!parsed.ok) {
      return parsed
    }

    const executable = parsed.tokens[0]
    if (!executable) {
      return { ok: false, message: 'Command must include an executable.' }
    }

    if (BLOCKED_COMMANDS.has(executable)) {
      return { ok: false, message: `Executable ${executable} is blocked.` }
    }

    for (const token of parsed.tokens.slice(1)) {
      if (looksLikePath(token) && !isSafePathToken(token)) {
        return { ok: false, message: `Path token is not allowed: ${token}` }
      }
    }

    if (isNetworkCommand(executable)) {
      const host = extractNetworkHost(parsed.tokens)
      if (host && this.networkAllowlist.length > 0 && !this.networkAllowlist.includes(host)) {
        return { ok: false, message: `Network host is outside OPENSHELL_NETWORK_ALLOWLIST: ${host}` }
      }
      if (host && this.networkAllowlist.length === 0) {
        return { ok: false, message: 'Network commands require OPENSHELL_NETWORK_ALLOWLIST.' }
      }
    }

    return { ok: true, executable, args: parsed.tokens.slice(1) }
  }
}

function tokenizeCommand(command: string):
  | { ok: true; tokens: string[] }
  | { ok: false; message: string } {
  const tokens: string[] = []
  let current = ''
  let quote: '"' | "'" | null = null

  for (let index = 0; index < command.length; index += 1) {
    const char = command[index]
    if ((char === '"' || char === "'") && (!quote || quote === char)) {
      quote = quote ? null : char
      continue
    }

    if (!quote && /\s/.test(char)) {
      if (current) {
        tokens.push(current)
        current = ''
      }
      continue
    }

    current += char
  }

  if (quote) {
    return { ok: false, message: 'Unterminated quoted string in command.' }
  }

  if (current) {
    tokens.push(current)
  }

  return { ok: true, tokens }
}

function looksLikePath(token: string): boolean {
  return token.startsWith('.') || token.startsWith('/') || token.includes('/')
}

function isSafePathToken(token: string): boolean {
  if (token.includes('\0') || token.includes('..')) {
    return false
  }

  return true
}

function isNetworkCommand(executable: string): boolean {
  return executable === 'curl' || executable === 'wget' || executable === 'ssh' || executable === 'nc'
}

function extractNetworkHost(tokens: string[]): string | null {
  for (const token of tokens) {
    try {
      const url = new URL(token)
      return url.hostname
    } catch {
      continue
    }
  }
  return null
}

function joinOutput(stdout: string, stderr: string): string {
  return [stdout.trimEnd(), stderr.trimEnd()].filter(Boolean).join('\n')
}

function parseCsv(value: string): string[] {
  return value.split(',').map(entry => entry.trim()).filter(Boolean)
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const spawnRunner: OpenShellRunner = async ({ executable, args, cwd, timeoutMs }) => {
  const child = spawn(executable, args, {
    cwd,
    env: {},
    shell: false,
    stdio: 'pipe',
  })

  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    let settled = false
    const timeout = setTimeout(() => {
      if (settled) {
        return
      }
      settled = true
      child.kill('SIGKILL')
      resolve({
        stdout,
        stderr: stderr ? `${stderr}\nCommand timed out.` : 'Command timed out.',
        exitCode: null,
        timedOut: true,
      })
    }, timeoutMs)

    child.stdout.on('data', chunk => {
      stdout += String(chunk)
    })
    child.stderr.on('data', chunk => {
      stderr += String(chunk)
    })
    child.on('error', error => {
      if (settled) {
        return
      }
      settled = true
      clearTimeout(timeout)
      reject(error)
    })
    child.on('close', exitCode => {
      if (settled) {
        return
      }
      settled = true
      clearTimeout(timeout)
      resolve({
        stdout,
        stderr,
        exitCode,
        timedOut: false,
      })
    })
  })
}
