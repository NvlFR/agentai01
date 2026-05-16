import { describe, expect, it } from 'bun:test'

import {
  createCommandRegistry,
  formatCliProgress,
  formatHelp,
  formatOutput,
  parseArgs,
} from './index.js'

describe('cli', () => {
  it('parses commands, flags, options, and passthrough args', () => {
    expect(parseArgs(['run', '--model', 'gpt-4.1-mini', '-v', 'task', '--', '--raw'])).toEqual({
      command: ['run'],
      options: { model: 'gpt-4.1-mini', v: true },
      positionals: ['task'],
      passthrough: ['--raw'],
    })
  })

  it('registers and runs commands by alias', async () => {
    const registry = createCommandRegistry<{ prefix: string }>()
    const registered = registry.register({
      name: 'echo',
      aliases: ['say'],
      description: 'Print text',
      run: ({ args, deps }) => ({
        exitCode: 0,
        stdout: `${deps.prefix}${args.positionals.join(' ')}`,
      }),
    })

    expect(registered.ok).toBe(true)
    expect(await registry.run(['say', 'hello'], { prefix: '> ' })).toEqual({
      exitCode: 0,
      stdout: '> hello',
    })
  })

  it('formats output, help, and progress', () => {
    expect(formatOutput({ ready: true })).toBe('ready: true\n')
    expect(formatOutput([{ id: 1 }, { id: 2 }], 'ndjson')).toBe('{"id":1}\n{"id":2}\n')
    expect(formatHelp([{ name: 'run', description: 'Run task', run: () => ({ exitCode: 0 }) }]))
      .toContain('agentai01 <command>')
    expect(formatCliProgress('sync', 1, 2)).toContain('50%')
  })
})
