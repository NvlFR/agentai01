import { describe, expect, it } from 'bun:test'

import {
  createNonExitingRuntime,
  registerUncaughtExceptionHandler,
  registerUnhandledRejectionHandler,
  resolveRuntimeEnv,
  resolveRuntimeEnvWithUnavailableExit,
} from './runtime-handlers.js'

describe('runtime-handlers', () => {
  it('registers non-exiting runtime handlers without exiting process', () => {
    const runtime = createNonExitingRuntime()
    const dispose = registerUnhandledRejectionHandler({ runtime })

    runtime.emit('unhandledRejection', new Error('boom'))
    dispose()

    expect(runtime.exitCodes).toEqual([1])
    expect(runtime.stderrMessages[0]).toContain('Unhandled rejection: boom')
  })

  it('supports uncaught exception handlers with ignore override', () => {
    const runtime = createNonExitingRuntime()
    const dispose = registerUncaughtExceptionHandler({
      runtime,
      onUncaughtException: error => error instanceof Error && error.message === 'ignore',
    })

    runtime.emit('uncaughtException', new Error('ignore'))
    runtime.emit('uncaughtException', new Error('fatal'))
    dispose()

    expect(runtime.exitCodes).toEqual([1])
    expect(runtime.stderrMessages[0]).toContain('Uncaught exception: fatal')
  })

  it('resolves runtime env values and marks unavailable values via exit path', () => {
    const runtime = createNonExitingRuntime({
      APP_HOST: '127.0.0.1',
    })

    expect(resolveRuntimeEnv({ runtime, key: 'APP_HOST' })).toBe('127.0.0.1')
    expect(
      resolveRuntimeEnvWithUnavailableExit({
        runtime,
        key: 'AI_API_KEY',
        label: 'AI API key',
      }),
    ).toBeUndefined()
    expect(runtime.exitCodes).toEqual([1])
    expect(runtime.stderrMessages[0]).toContain('AI API key is unavailable.')
  })
})
