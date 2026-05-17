import type { Transformer, TransformableApi } from 'grammy'
import { run, type RunnerHandle } from '@grammyjs/runner'
import { apiThrottler, type APIThrottlerOptions } from '@grammyjs/transformer-throttler'

export type TelegramRunnerHandle = {
  start: () => void
  stop: () => Promise<void>
  isRunning: () => boolean
}

type BotApiLike = {
  config: {
    use: (transformer: Transformer) => TransformableApi
    installedTransformers: () => Transformer[]
  }
  getUpdates: (args: { offset: number; limit: number; timeout: number }, signal?: AbortSignal) => Promise<Array<{ update_id: number }>>
}

type BotLike = {
  api: BotApiLike
  init?: () => Promise<void>
  handleUpdate: (update: { update_id: number }) => Promise<void>
  errorHandler: (error: unknown) => unknown
}

export function applyTelegramThrottling(
  api: Pick<BotApiLike, 'config'>,
  options: APIThrottlerOptions = {},
): void {
  api.config.use(apiThrottler(options))
}

export function createTelegramRunner(
  bot: BotLike,
  options: {
    fetch?: {
      timeout?: number
    }
    throttler?: APIThrottlerOptions
  } = {},
): TelegramRunnerHandle {
  applyTelegramThrottling(bot.api, options.throttler)
  let handle: RunnerHandle | undefined

  return {
    start() {
      if (handle?.isRunning()) {
        return
      }

      handle = run(bot as unknown as Parameters<typeof run<{ update_id: number }, unknown>>[0], {
        runner: {
          fetch: {
            timeout: options.fetch?.timeout ?? 30,
          },
          silent: true,
        },
      })
    },
    async stop() {
      await handle?.stop()
    },
    isRunning() {
      return handle?.isRunning() ?? false
    },
  }
}
