import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

export type WorkspaceSnapshot = {
  project_id: string
  active_stage: string
  context: Record<string, unknown>
  saved_at: string
}

export type AuditEntry = {
  timestamp: string
  kind: 'command' | 'test' | 'approval' | 'handoff' | 'recovery' | 'artifact'
  detail: string
}

export function getProjectWorkspaceRoot(
  baseDir: string,
  clientId: string,
  projectId: string,
): string {
  return path.join(baseDir, clientId, projectId)
}

export async function ensureWorkspaceStructure(workspaceRoot: string): Promise<{
  workspaceRoot: string
  artifactsDir: string
  auditDir: string
}> {
  const artifactsDir = path.join(workspaceRoot, 'artifacts')
  const auditDir = path.join(workspaceRoot, 'audit')

  await mkdir(artifactsDir, { recursive: true })
  await mkdir(auditDir, { recursive: true })

  return { workspaceRoot, artifactsDir, auditDir }
}

export async function writeWorkspaceArtifact(
  workspaceRoot: string,
  relativePath: string,
  content: string,
): Promise<string> {
  const fullPath = path.join(workspaceRoot, relativePath)
  const normalized = path.normalize(fullPath)
  const normalizedRoot = path.normalize(workspaceRoot + path.sep)
  if (!normalized.startsWith(normalizedRoot)) {
    throw new Error(`Artifact path escapes workspace: ${relativePath}`)
  }

  await mkdir(path.dirname(fullPath), { recursive: true })
  await writeFile(fullPath, content, 'utf8')
  return fullPath
}

export async function appendAuditEntry(
  workspaceRoot: string,
  entry: AuditEntry,
): Promise<string> {
  const { auditDir } = await ensureWorkspaceStructure(workspaceRoot)
  const auditPath = path.join(auditDir, 'activity.log')
  const line = `${JSON.stringify(entry)}\n`
  await writeFile(auditPath, line, { encoding: 'utf8', flag: 'a' })
  return auditPath
}

export async function saveRecoverySnapshot(
  workspaceRoot: string,
  snapshot: WorkspaceSnapshot,
): Promise<string> {
  return writeWorkspaceArtifact(
    workspaceRoot,
    'audit/recovery-snapshot.json',
    `${JSON.stringify(snapshot, null, 2)}\n`,
  )
}

export async function loadRecoverySnapshot(
  workspaceRoot: string,
): Promise<WorkspaceSnapshot | null> {
  const snapshotPath = path.join(workspaceRoot, 'audit', 'recovery-snapshot.json')
  try {
    const content = await readFile(snapshotPath, 'utf8')
    return JSON.parse(content) as WorkspaceSnapshot
  } catch {
    return null
  }
}

export async function listDeliverableVersions(workspaceRoot: string): Promise<string[]> {
  try {
    const entries = await readdir(workspaceRoot, { withFileTypes: true })
    return entries
      .filter(entry => entry.isDirectory() && /^deliverable-v\d+$/.test(entry.name))
      .map(entry => entry.name)
      .sort()
  } catch {
    return []
  }
}

export async function assertWorkspaceContainsOnlyProjectArtifacts(
  workspaceRoot: string,
): Promise<boolean> {
  const info = await stat(workspaceRoot)
  return info.isDirectory()
}
