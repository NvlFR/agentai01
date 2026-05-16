import { describe, expect, it } from 'bun:test'

import {
  ansi,
  padVisibleEnd,
  renderProgressBar,
  sanitizeTerminalText,
  stripAnsi,
  terminalWidth,
  truncateVisible,
  visibleWidth,
} from './index.js'

describe('terminal', () => {
  it('styles and strips ANSI safely', () => {
    const styled = ansi('green', 'ready')

    expect(styled).toContain('\u001b[32m')
    expect(stripAnsi(styled)).toBe('ready')
    expect(sanitizeTerminalText(`${styled}\nnext`)).toBe('readynext')
  })

  it('measures and pads visible text', () => {
    expect(visibleWidth(`${ansi('bold', 'A')}界`)).toBe(3)
    expect(padVisibleEnd(ansi('red', 'x'), 3)).toBe(`${ansi('red', 'x')}  `)
    expect(truncateVisible('abcdef', 4)).toBe('a...')
  })

  it('detects terminal width and renders progress', () => {
    expect(terminalWidth(100, 0)).toBe(100)
    expect(terminalWidth(80, 42)).toBe(42)
    expect(renderProgressBar({ current: 3, total: 6, width: 10, label: 'build' })).toBe(
      'build [#####-----] 50%',
    )
  })
})
