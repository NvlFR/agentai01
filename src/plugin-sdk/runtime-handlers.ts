// Adapted from referensi/openclaw/src/plugin-sdk/runtime.ts and referensi/openclaw/src/infra/unhandled-rejections.ts
type RuntimeEventMap = {
  uncaughtException: (error: unknown) => void
  unhandledRejection: (reason: unknown) => void
}

export type RuntimeProcessLike = {
  env: Readonly<Record<string, string | undefined>>
  stderr: { write(message: string): unknown }
  on<K extends keyof RuntimeEventMap>(event: K, handler: RuntimeEventMap[K]): unknown
  off<K extends keyof RuntimeEventMap>(event: K, handler: RuntimeEventMap[K]): unknown
  exit(code: number): unknown
}

export type NonExitingRuntime = RuntimeProcessLike & {
  readonly exitCodes: number[]
  readonly stderrMessages: string[]
  emit<K extends keyof RuntimeEventMap>(
    event: K,
    ...args: Parameters<RuntimeEventMap[K]>
  ): void
}

export const defaultRuntime: RuntimeProcessLike = {
  env: process.env,
  stderr: process.stderr,
  on(event, handler) {
    process.on(event, handler as (...args: unknown[]) => void)
  },
  off(event, handler) {
    process.off(event, handler as (...args: unknown[]) => void)
  },
  exit(code) {
    process.exit(code)
  },
}

export function createNonExitingRuntime(
  env: Readonly<Record<string, string | undefined>> = {},
): NonExitingRuntime {
  const exitCodes: number[] = []
  const stderrMessages: string[] = []
  const listeners: {
    [K in keyof RuntimeEventMap]: Set<RuntimeEventMap[K]>
  } = {
    uncaughtException: new Set(),
    unhandledRejection: new Set(),
  }

  return {
    env,
    exitCodes,
    stderrMessages,
    stderr: {
      write(message: string) {
        stderrMessages.push(message)
      },
    },
    on(event, handler) {
      listeners[event].add(handler)
    },
    off(event, handler) {
      listeners[event].delete(handler)
    },
    exit(code) {
      exitCodes.push(code)
    },
    emit(event, ...args) {
      if (event === 'uncaughtException') {
        for (const listener of listeners.uncaughtException) {
          listener(args[0])
        }
        return
      }

      for (const listener of listeners.unhandledRejection) {
        listener(args[0])
      }
    },
  }
}

export function registerUnhandledRejectionHandler(params: {
  runtime?: RuntimeProcessLike
  onUnhandledRejection?: (reason: unknown) => boolean
} = {}): () => void {
  const runtime = params.runtime ?? defaultRuntime
  const handler = (reason: unknown) => {
    if (params.onUnhandledRejection?.(reason)) {
      return
    }

    runtime.stderr.write(`Unhandled rejection: ${formatUnknown(reason)}\n`)
    runtime.exit(1)
  }

  runtime.on('unhandledRejection', handler)
  return () => runtime.off('unhandledRejection', handler)
}

export function registerUncaughtExceptionHandler(params: {
  runtime?: RuntimeProcessLike
  onUncaughtException?: (error: unknown) => boolean
} = {}): () => void {
  const runtime = params.runtime ?? defaultRuntime
  const handler = (error: unknown) => {
    if (params.onUncaughtException?.(error)) {
      return
    }

    runtime.stderr.write(`Uncaught exception: ${formatUnknown(error)}\n`)
    runtime.exit(1)
  }

  runtime.on('uncaughtException', handler)
  return () => runtime.off('uncaughtException', handler)
}

export function resolveRuntimeEnv(params: {
  runtime?: Pick<RuntimeProcessLike, 'env'>
  key: string
  fallback?: string
}): string | undefined {
  const runtime = params.runtime ?? defaultRuntime
  const raw = runtime.env[params.key]?.trim()
  return raw && raw.length > 0 ? raw : params.fallback
}

export function resolveRuntimeEnvWithUnavailableExit(params: {
  runtime?: RuntimeProcessLike
  key: string
  label?: string
  fallback?: string
}): string | undefined {
  const runtime = params.runtime ?? defaultRuntime
  const resolved = resolveRuntimeEnv({
    runtime,
    key: params.key,
    fallback: params.fallback,
  })
  if (resolved !== undefined) {
    return resolved
  }

  runtime.stderr.write(`${params.label ?? params.key} is unavailable.\n`)
  runtime.exit(1)
  return undefined
}

function formatUnknown(value: unknown): string {
  if (value instanceof Error) {
    return value.message
  }

  return String(value)
}
