// src/runtime-app/extensions/extensionContract.ts
// Extension_Contract — standard interface for medium-priority tool plugins.

export type ExtensionContext = {
  projectId: string
  threadId: string
  workspaceRoot: string
  logger: (message: string, level?: 'info' | 'warn' | 'error') => void
}

export type ExtensionResult = {
  success: boolean
  output: string
  data?: unknown
  error?: {
    code: string
    message: string
    retryable: boolean
  }
}

export interface ExtensionPlugin {
  readonly id: string
  readonly description: string
  execute(args: Record<string, unknown>, context: ExtensionContext): Promise<ExtensionResult>
}

/**
 * Validate that a path is within the workspace root to prevent directory traversal.
 */
export function validatePath(requestedPath: string, root: string): string {
  const path = require('node:path')
  const absoluteRoot = path.resolve(root)
  const absolutePath = path.resolve(root, requestedPath)

  if (!absolutePath.startsWith(absoluteRoot)) {
    throw new Error(`Path security violation: ${requestedPath} is outside of workspace root.`)
  }

  return absolutePath
}
