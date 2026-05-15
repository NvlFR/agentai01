import { beforeEach } from 'bun:test'

const testUuidState = {
  counter: 0,
}

;(globalThis as { __AGENTAI_TEST_RANDOM_UUID__?: () => string }).__AGENTAI_TEST_RANDOM_UUID__ =
  () => `00000000-0000-4000-8000-${String(++testUuidState.counter).padStart(12, '0')}`

beforeEach(() => {
  process.env['NODE_ENV'] = 'test'
  process.env['APP_ENV'] = 'test'
})
