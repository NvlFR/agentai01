import { describe, expect, test } from 'bun:test'

import { extractApiSymbols, generateMarkdownToc, validateDocPage } from './index.js'

describe('docs', () => {
  test('validates pages and extracts exported API symbols', () => {
    expect(validateDocPage({ id: 'runtime', title: 'Runtime API', body: 'Hello' }).ok).toBe(true)
    expect(generateMarkdownToc([{ id: 'runtime', title: 'Runtime API', body: 'Hello' }])).toBe('- [Runtime API](#runtime-api)')
    expect(extractApiSymbols('export type Foo = {}\nexport function bar() {}')).toEqual([
      { kind: 'type', name: 'Foo' },
      { kind: 'function', name: 'bar' },
    ])
  })
})
