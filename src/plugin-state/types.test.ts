import { describe, expect, it } from 'bun:test'

import { PLUGIN_STATE_ERROR_CODES, isPluginStateErrorCode } from './types.js'

describe('plugin-state type runtime helpers', () => {
  it('exports supported plugin-state error codes', () => {
    expect(PLUGIN_STATE_ERROR_CODES).toEqual(['not-found', 'migration-missing'])
  })

  it('narrows known plugin-state error codes', () => {
    expect(isPluginStateErrorCode('not-found')).toBe(true)
    expect(isPluginStateErrorCode('unknown')).toBe(false)
  })
})
