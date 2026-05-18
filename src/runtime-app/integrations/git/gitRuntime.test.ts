import { describe, expect, it } from 'bun:test'
import { classifyGitCommand, resolveGitRuntimeContext, validateGitTargetPath } from './gitRuntime.js'

describe('gitRuntime', () => {
  it('detects worktree-aware relative path', () => {
    expect(resolveGitRuntimeContext('/repo', '/repo/src/runtime-app')).toEqual({
      repoRoot: '/repo',
      workingDirectory: '/repo/src/runtime-app',
      relativePath: 'src/runtime-app',
      isInsideRepo: true,
    })
  })

  it('classifies destructive git commands', () => {
    expect(classifyGitCommand(['git', 'reset', '--hard'])).toBe('destructive')
    expect(classifyGitCommand(['git', 'status'])).toBe('read')
  })

  it('rejects paths outside the repo root', () => {
    const result = validateGitTargetPath('/repo', '/tmp/outside')
    expect(result.ok).toBe(false)
  })
})
