import { describe, expect, it } from 'bun:test'

import { handleTextInput, renderBox, renderComponent, splitLayout } from './index.js'

describe('tui', () => {
  it('splits layout into row or column rectangles', () => {
    expect(splitLayout({ x: 0, y: 0, width: 12, height: 6 }, 'row', [
      { id: 'nav', size: 4 },
      { id: 'main' },
    ])).toEqual({
      nav: { x: 0, y: 0, width: 4, height: 6 },
      main: { x: 4, y: 0, width: 8, height: 6 },
    })
  })

  it('renders boxes and selectable lists', () => {
    expect(renderBox('hello', { width: 10, title: 'Log' })).toBe(
      '+ Log ---+\n| hello  |\n+--------+',
    )
    expect(renderComponent({ kind: 'list', items: ['audit', 'deploy'], selectedIndex: 1 }, 10))
      .toBe('  audit\n> deploy')
  })

  it('handles text input state transitions', () => {
    const typed = handleTextInput({ value: 'ac', cursor: 1 }, { key: 'character', value: 'b' })
    expect(typed).toEqual({ value: 'abc', cursor: 2 })
    expect(handleTextInput(typed, { key: 'backspace' })).toEqual({ value: 'ac', cursor: 1 })
    expect(handleTextInput(typed, { key: 'end' })).toEqual({ value: 'abc', cursor: 3 })
  })
})
