import { describe, expect, test } from 'bun:test'

import { createChatHistory } from './index.js'

describe('chat', () => {
  test('builds bounded context and redacts inline secrets', () => {
    const history = createChatHistory()
    history.append({ role: 'user', content: 'api_key=sk-secret' })
    history.append({ role: 'assistant', content: 'A long response' })

    expect(JSON.stringify(history.list())).not.toContain('sk-secret')
    expect(history.buildContext(20).map(message => message.role)).toEqual(['assistant'])
  })
})
