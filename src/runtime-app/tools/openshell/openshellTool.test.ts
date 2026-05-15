import { describe, expect, it } from 'bun:test'
import { OpenShellTool } from './openshellTool.js'

describe('OpenShellTool', () => {
  it('blocks commands outside allowed directories', async () => {
    const tool = new OpenShellTool({
      allowedDirs: ['/workspace/allowed'],
      runner: async () => ({
        stdout: '',
        stderr: '',
        exitCode: 0,
        timedOut: false,
      }),
    })
    process.env['OPENSHELL_ENABLED'] = 'true'

    const result = await tool.execute('ls', '/workspace/denied')

    expect(result.status).toBe('blocked')
    expect(result.output).toContain('outside OPENSHELL_ALLOWED_DIRS')
  })

  it('blocks dangerous command patterns', async () => {
    const tool = new OpenShellTool({
      allowedDirs: ['/workspace'],
      runner: async () => ({
        stdout: '',
        stderr: '',
        exitCode: 0,
        timedOut: false,
      }),
    })
    process.env['OPENSHELL_ENABLED'] = 'true'

    const result = await tool.execute('rm -rf /', '/workspace')

    expect(result.status).toBe('blocked')
    expect(result.output).toContain('security validation')
  })

  it('returns timeout results when the runner exceeds the command timeout', async () => {
    const tool = new OpenShellTool({
      allowedDirs: ['/workspace'],
      timeoutMs: 1,
      runner: async () => ({
        stdout: '',
        stderr: 'Command timed out.',
        exitCode: null,
        timedOut: true,
      }),
    })
    process.env['OPENSHELL_ENABLED'] = 'true'

    const result = await tool.execute('ls', '/workspace')

    expect(result.status).toBe('timeout')
    expect(result.ok).toBe(false)
  })
})
