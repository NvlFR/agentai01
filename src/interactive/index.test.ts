import { describe, expect, it } from 'bun:test'

import { confirm, menu, parseConfirmation, parseMenuSelection, promptText, required } from './index.js'

describe('interactive', () => {
  it('validates text prompts with defaults', async () => {
    const result = await promptText(
      { message: 'Name?', defaultValue: 'operator', validate: required() },
      async () => '',
    )

    expect(result).toEqual({ ok: true, value: 'operator' })
  })

  it('parses confirmations', async () => {
    expect(parseConfirmation('', true)).toEqual({ ok: true, value: true })
    expect(await confirm({ message: 'Continue?' }, async () => 'no')).toEqual({
      ok: true,
      value: false,
    })
    expect(parseConfirmation('later')).toMatchObject({ ok: false })
  })

  it('parses menu selections by index or value and blocks disabled entries', async () => {
    const options = [
      { value: 'audit', label: 'Audit' },
      { value: 'deploy', label: 'Deploy', disabled: true },
    ] as const

    expect(parseMenuSelection('1', options)).toEqual({ ok: true, value: 'audit' })
    expect(await menu({ message: 'Mode?', options }, async () => 'audit')).toEqual({
      ok: true,
      value: 'audit',
    })
    expect(parseMenuSelection('2', options)).toEqual({ ok: false, error: 'Selection is disabled.' })
  })
})
