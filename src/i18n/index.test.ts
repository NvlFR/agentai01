import { describe, expect, test } from 'bun:test'

import { detectLocale, translate } from './index.js'

describe('i18n', () => {
  test('detects compatible locale and falls back for missing translations', () => {
    const catalog = {
      defaultLocale: 'en',
      locales: {
        en: { hello: 'Hello {name}' },
        id: { hello: 'Halo {name}' },
      },
    }

    expect(detectLocale(['id-ID'], ['en', 'id'], 'en')).toBe('id')
    expect(translate(catalog, 'id', 'hello', { name: 'Rina' })).toBe('Halo Rina')
    expect(translate(catalog, 'id', 'missing')).toBe('missing')
  })
})
