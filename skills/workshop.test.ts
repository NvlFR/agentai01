import { describe, expect, it } from 'bun:test'
import path from 'node:path'

const repoRoot = process.cwd()

async function runCommand(cmd: string[]) {
  const proc = Bun.spawn(cmd, {
    cwd: repoRoot,
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])

  return {
    exitCode,
    stdout,
    stderr,
  }
}

describe('skills/workshop.mjs', () => {
  it('validates an existing skill directory', async () => {
    const result = await runCommand(['node', path.join('skills', 'workshop.mjs'), 'validate', path.join('skills', 'echo-text')])

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Validated echo-text@1.0.0')
    expect(result.stderr).toBe('')
  })

  it('runs a skill with sample input without the full runtime', async () => {
    const result = await runCommand([
      'node',
      path.join('skills', 'workshop.mjs'),
      'run',
      'echo-text',
      '--input',
      '{"text":"skill workshop","uppercase":true}',
    ])

    expect(result.exitCode).toBe(0)
    expect(JSON.parse(result.stdout)).toEqual({
      text: 'SKILL WORKSHOP',
      original: 'skill workshop',
      characterCount: 14,
    })
  })
})
