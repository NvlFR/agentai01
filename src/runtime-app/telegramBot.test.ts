import { describe, expect, it } from 'bun:test'
import {
  parseTelegramCommand,
  splitTelegramMessage,
} from './telegramBot.js'

describe('parseTelegramCommand', () => {
  it('parses built-in commands', () => {
    expect(parseTelegramCommand('/start')).toEqual({ kind: 'start' })
    expect(parseTelegramCommand('/help')).toEqual({ kind: 'help' })
    expect(parseTelegramCommand('/status')).toEqual({ kind: 'status' })
    expect(parseTelegramCommand('/approvals')).toEqual({ kind: 'approvals' })
    expect(parseTelegramCommand('/audit-system')).toEqual({ kind: 'audit' })
    expect(parseTelegramCommand('/improve')).toEqual({ kind: 'improve' })
    expect(parseTelegramCommand('/self-heal')).toEqual({ kind: 'self_heal' })
    expect(parseTelegramCommand('/reset')).toEqual({ kind: 'reset' })
    expect(parseTelegramCommand('/mode semi')).toEqual({ kind: 'mode', mode: 'semi' })
    expect(parseTelegramCommand('/mode manual')).toEqual({ kind: 'mode', mode: 'manual' })
    expect(parseTelegramCommand('/directive')).toEqual({ kind: 'directive_help' })
  })

  it('parses directive and free chat', () => {
    expect(parseTelegramCommand('/directive buat proposal')).toEqual({
      kind: 'directive',
      input: 'buat proposal',
    })
    expect(parseTelegramCommand('halo ai')).toEqual({
      kind: 'chat',
      input: 'halo ai',
    })
  })
})

describe('splitTelegramMessage', () => {
  it('splits long text into safe chunks', () => {
    const chunks = splitTelegramMessage('a'.repeat(8000), 3000)
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks.every(item => item.length <= 3000)).toBe(true)
  })
})
