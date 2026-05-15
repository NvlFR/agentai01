// src/runtime-app/extensions/plugins/diffsPlugin.ts
// Diffs extension — generates standard unified diffs between two files or contents.

import { execSync } from 'node:child_process'
import { writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { type ExtensionPlugin, type ExtensionContext, type ExtensionResult, validatePath } from '../extensionContract.js'

export class DiffsPlugin implements ExtensionPlugin {
  readonly id = 'diffs'
  readonly description = 'Generate unified diffs between files or text blocks.'

  async execute(args: Record<string, unknown>, context: ExtensionContext): Promise<ExtensionResult> {
    const { fileA, fileB, contentA, contentB } = args as {
      fileA?: string, fileB?: string, contentA?: string, contentB?: string
    }

    try {
      let pathA = ''
      let pathB = ''
      const tempFiles: string[] = []

      if (fileA) {
        pathA = validatePath(fileA, context.workspaceRoot)
      } else if (contentA !== undefined) {
        pathA = join(tmpdir(), `diff-a-${Date.now()}.txt`)
        writeFileSync(pathA, contentA)
        tempFiles.push(pathA)
      }

      if (fileB) {
        pathB = validatePath(fileB, context.workspaceRoot)
      } else if (contentB !== undefined) {
        pathB = join(tmpdir(), `diff-b-${Date.now()}.txt`)
        writeFileSync(pathB, contentB)
        tempFiles.push(pathB)
      }

      if (!pathA || !pathB) {
        return { success: false, output: 'Error: Both A and B sides are required (file or content).' }
      }

      let diffOutput = ''
      try {
        // Use standard 'diff -u' command.
        diffOutput = execSync(`diff -u "${pathA}" "${pathB}"`, { encoding: 'utf8' })
      } catch (err: any) {
        // diff returns exit code 1 if differences are found; this is not an error for us.
        if (err.status === 1) {
          diffOutput = err.stdout || err.stderr
        } else {
          throw err
        }
      } finally {
        for (const f of tempFiles) rmSync(f, { force: true })
      }

      return {
        success: true,
        output: diffOutput || 'No differences found.',
      }
    } catch (err: any) {
      return {
        success: false,
        output: `Diff failed: ${err.message}`,
        error: { code: 'DIFF_ERROR', message: err.message, retryable: false }
      }
    }
  }
}
