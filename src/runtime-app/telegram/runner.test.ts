import { describe, expect, it } from 'bun:test'

import { applyTelegramThrottling, createTelegramRunner } from './runner.js'

describe('telegram runner', () => {
  it('applies throttling middleware to the bot api config', () => {
    const middlewares: unknown[] = []
    applyTelegramThrottling({
      config: {
        use: middleware => {
          middlewares.push(middleware)
          return {} as never
        },
        installedTransformers: () => [],
      },
    })

    expect(middlewares).toHaveLength(1)
  })

  it('starts and stops a runner handle safely', async () => {
    let active = false
    const runner = createTelegramRunner({
      api: {
        config: {
          use: () => ({} as never),
          installedTransformers: () => [],
        },
        getUpdates: async (_args, signal) => {
          await new Promise<void>(resolve => {
            signal?.addEventListener('abort', () => resolve(), { once: true })
            setTimeout(resolve, 25)
          })
          return []
        },
      },
      init: async () => undefined,
      handleUpdate: async () => undefined,
      errorHandler: () => undefined,
    }, {
      fetch: {
        timeout: 1,
      },
    })

    runner.start()
    active = runner.isRunning()
    expect(active).toBe(true)

    await runner.stop()
    expect(runner.isRunning()).toBe(false)
  })
})
