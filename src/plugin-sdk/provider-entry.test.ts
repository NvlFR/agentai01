import { describe, expect, it } from 'bun:test'
import { defineSingleProviderPlugin } from './provider-entry.js'

describe('defineSingleProviderPlugin', () => {
  it('creates a plugin entry with id, name, and description', () => {
    const entry = defineSingleProviderPlugin({
      id: 'openai',
      name: 'OpenAI',
      description: 'OpenAI provider plugin',
    })

    expect(entry.id).toBe('openai')
    expect(entry.name).toBe('OpenAI')
    expect(entry.description).toBe('OpenAI provider plugin')
    expect(typeof entry.register).toBe('function')
  })

  it('calls custom register function during registration', async () => {
    let registered = false
    const entry = defineSingleProviderPlugin({
      id: 'test',
      name: 'Test',
      description: 'Test provider',
      register: () => { registered = true },
    })

    await entry.register({
      registrationMode: 'full',
      registerChannel: () => {},
    })

    expect(registered).toBe(true)
  })

  it('handles provider with catalog', () => {
    const entry = defineSingleProviderPlugin({
      id: 'custom',
      name: 'Custom',
      description: 'Custom provider',
      provider: {
        label: 'Custom Provider',
        docsPath: '/docs/custom',
        catalog: {
          run: async () => ({ provider: { model: 'custom-1' } }),
        },
      },
    })

    expect(entry.id).toBe('custom')
    expect(typeof entry.register).toBe('function')
  })
})
