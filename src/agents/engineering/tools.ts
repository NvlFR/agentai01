import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  appendAuditEntry,
  ensureWorkspaceStructure,
  listDeliverableVersions,
  writeWorkspaceArtifact,
} from './workspace.js'

export type ToolExecutionContext = {
  workspaceRoot: string
  activeProjectId: string
  allowedCommands?: string[]
  now?: string
}

export type ToolDefinition<TInput, TOutput> = {
  name: string
  description: string
  inputSchema: (input: unknown) => input is TInput
  checkPermissions: (input: TInput, context: ToolExecutionContext) => void | Promise<void>
  call: (input: TInput, context: ToolExecutionContext) => Promise<TOutput>
}

export function buildTool<TInput, TOutput>(
  definition: ToolDefinition<TInput, TOutput>,
): ToolDefinition<TInput, TOutput> {
  return definition
}

function assertPathInsideWorkspace(workspaceRoot: string, targetPath: string): string {
  const resolvedWorkspace = path.resolve(workspaceRoot)
  const resolvedTarget = path.resolve(workspaceRoot, targetPath)
  if (!resolvedTarget.startsWith(`${resolvedWorkspace}${path.sep}`) && resolvedTarget !== resolvedWorkspace) {
    throw new Error(`Path escapes workspace: ${targetPath}`)
  }
  return resolvedTarget
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export const codeReadTool = buildTool<{ path: string }, { content: string }>({
  name: 'code_read',
  description: 'Reads a file inside the active client workspace.',
  inputSchema: (input): input is { path: string } =>
    isRecord(input) && typeof input.path === 'string',
  checkPermissions: input => {
    if (!input.path.trim()) throw new Error('code_read requires a path')
  },
  async call(input, context) {
    const resolved = assertPathInsideWorkspace(context.workspaceRoot, input.path)
    const content = await readFile(resolved, 'utf8')
    await appendAuditEntry(context.workspaceRoot, {
      timestamp: context.now ?? new Date().toISOString(),
      kind: 'artifact',
      detail: `code_read:${input.path}`,
    })
    return { content }
  },
})

export const codeWriteTool = buildTool<{ path: string; content: string }, { path: string }>({
  name: 'code_write',
  description: 'Writes a file inside the active client workspace.',
  inputSchema: (input): input is { path: string; content: string } =>
    isRecord(input) &&
    typeof input.path === 'string' &&
    typeof input.content === 'string',
  checkPermissions: input => {
    if (!input.path.trim()) throw new Error('code_write requires a path')
  },
  async call(input, context) {
    const resolved = path.relative(
      context.workspaceRoot,
      assertPathInsideWorkspace(context.workspaceRoot, input.path),
    )
    const writtenPath = await writeWorkspaceArtifact(
      context.workspaceRoot,
      resolved,
      input.content,
    )
    await appendAuditEntry(context.workspaceRoot, {
      timestamp: context.now ?? new Date().toISOString(),
      kind: 'artifact',
      detail: `code_write:${resolved}`,
    })
    return { path: writtenPath }
  },
})

export const testRunTool = buildTool<{ command: string; args?: string[] }, { output: string }>({
  name: 'test_run',
  description: 'Runs an allowed test command inside the active client workspace.',
  inputSchema: (input): input is { command: string; args?: string[] } =>
    isRecord(input) &&
    typeof input.command === 'string' &&
    (input.args === undefined ||
      (Array.isArray(input.args) && input.args.every(arg => typeof arg === 'string'))),
  checkPermissions: (input, context) => {
    const allowlist = context.allowedCommands ?? ['bun', 'npm', 'pnpm']
    if (!allowlist.includes(input.command)) {
      throw new Error(`Command not allowed: ${input.command}`)
    }
  },
  async call(input, context) {
    const output = execFileSync(input.command, input.args ?? [], {
      cwd: context.workspaceRoot,
      encoding: 'utf8',
    })
    await appendAuditEntry(context.workspaceRoot, {
      timestamp: context.now ?? new Date().toISOString(),
      kind: 'test',
      detail: `test_run:${input.command} ${(input.args ?? []).join(' ')}`.trim(),
    })
    return { output }
  },
})

export const bashExecTool = buildTool<{ command: string; args?: string[] }, { output: string }>({
  name: 'bash_exec',
  description: 'Executes a guarded allowlisted shell command in the active workspace.',
  inputSchema: (input): input is { command: string; args?: string[] } =>
    isRecord(input) &&
    typeof input.command === 'string' &&
    (input.args === undefined ||
      (Array.isArray(input.args) && input.args.every(arg => typeof arg === 'string'))),
  checkPermissions: (input, context) => {
    const allowlist = context.allowedCommands ?? ['ls', 'pwd', 'echo', 'cat', 'bun']
    if (!allowlist.includes(input.command)) {
      throw new Error(`Command not allowed: ${input.command}`)
    }
  },
  async call(input, context) {
    const output = execFileSync(input.command, input.args ?? [], {
      cwd: context.workspaceRoot,
      encoding: 'utf8',
    })
    await appendAuditEntry(context.workspaceRoot, {
      timestamp: context.now ?? new Date().toISOString(),
      kind: 'command',
      detail: `bash_exec:${input.command} ${(input.args ?? []).join(' ')}`.trim(),
    })
    return { output }
  },
})

export const deliverablePackageTool = buildTool<
  { version: number; files: Array<{ path: string; content: string }> },
  { deliverablePath: string; versions: string[] }
>({
  name: 'deliverable_package',
  description: 'Writes a versioned deliverable package inside the active client workspace.',
  inputSchema: (input): input is {
    version: number
    files: Array<{ path: string; content: string }>
  } =>
    isRecord(input) &&
    typeof input.version === 'number' &&
    Array.isArray(input.files) &&
    input.files.every(
      file => isRecord(file) && typeof file.path === 'string' && typeof file.content === 'string',
    ),
  checkPermissions: input => {
    if (input.version < 1) throw new Error('Deliverable version must start from 1')
  },
  async call(input, context) {
    await ensureWorkspaceStructure(context.workspaceRoot)
    const folder = `deliverable-v${input.version}`
    for (const file of input.files) {
      await writeWorkspaceArtifact(
        context.workspaceRoot,
        path.join(folder, file.path),
        file.content,
      )
    }
    await appendAuditEntry(context.workspaceRoot, {
      timestamp: context.now ?? new Date().toISOString(),
      kind: 'artifact',
      detail: `deliverable_package:${folder}`,
    })
    return {
      deliverablePath: path.join(context.workspaceRoot, folder),
      versions: await listDeliverableVersions(context.workspaceRoot),
    }
  },
})

export const messageSendTool = buildTool<{ message: unknown }, { sent: true }>({
  name: 'message_send',
  description: 'Represents sending a structured cross-agent message.',
  inputSchema: (input): input is { message: unknown } =>
    isRecord(input) && 'message' in input,
  checkPermissions: () => undefined,
  async call(_input, context) {
    await appendAuditEntry(context.workspaceRoot, {
      timestamp: context.now ?? new Date().toISOString(),
      kind: 'command',
      detail: 'message_send',
    })
    return { sent: true }
  },
})

export const ENGINEERING_TOOLS = [
  codeReadTool,
  codeWriteTool,
  testRunTool,
  bashExecTool,
  deliverablePackageTool,
  messageSendTool,
] as const
