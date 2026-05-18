import { relative, resolve } from 'node:path'
import { err, ok, type Result } from '../../../shared/index.js'

export type GitRuntimeContext = {
  readonly repoRoot: string
  readonly workingDirectory: string
  readonly relativePath: string
  readonly isInsideRepo: boolean
}

export type GitCommandClassification = 'read' | 'write' | 'destructive'

export function resolveGitRuntimeContext(repoRoot: string, workingDirectory: string): GitRuntimeContext {
  const normalizedRepoRoot = resolve(repoRoot)
  const normalizedWorkingDirectory = resolve(workingDirectory)
  const relativePath = relative(normalizedRepoRoot, normalizedWorkingDirectory)
  const isInsideRepo = relativePath === '' || !relativePath.startsWith('..')

  return {
    repoRoot: normalizedRepoRoot,
    workingDirectory: normalizedWorkingDirectory,
    relativePath: isInsideRepo ? (relativePath || '.') : relativePath,
    isInsideRepo,
  }
}

export function classifyGitCommand(args: readonly string[]): GitCommandClassification {
  const joined = args.join(' ').toLowerCase()
  if (joined.includes('reset --hard') || joined.includes('clean -fd') || joined.includes('push --force')) {
    return 'destructive'
  }

  if (joined.includes('commit') || joined.includes('merge') || joined.includes('rebase') || joined.includes('push')) {
    return 'write'
  }

  return 'read'
}

export function validateGitTargetPath(repoRoot: string, candidatePath: string): Result<string, string> {
  const context = resolveGitRuntimeContext(repoRoot, candidatePath)
  if (!context.isInsideRepo) {
    return err('Git target path must stay inside repository root.')
  }

  return ok(context.relativePath)
}
