import { createLogger } from '../logging/index.js'
import { createBootstrapRegistry } from '../bootstrap/index.js'
import { createProcessLifecycle } from '../process/index.js'
import { createStatusRegistry } from '../status/index.js'
import { createRuntimeAppState, startRuntimeAppServer } from './server.js'

if (import.meta.main) {
  const state = createRuntimeAppState()
  const logger = createLogger({
    env: state.config.env,
    bindings: {
      context: {
        component: 'runtime-app-server',
      },
    },
  })

  // --- Process lifecycle (graceful shutdown via src/process/) ---
  const lifecycle = createProcessLifecycle()

  // --- Status registry (cross-service status aggregation via src/status/) ---
  const statusRegistry = createStatusRegistry()

  // --- Bootstrap registry (service wiring via src/bootstrap/) ---
  const bootstrap = createBootstrapRegistry()

  bootstrap.register({
    id: 'runtime-app-server',
    start: () => {
      const server = startRuntimeAppServer(state)
      logger.info('Runtime app server listening.', {
        hostname: server.hostname,
        port: server.port,
        url: `http://${server.hostname}:${server.port}`,
      })
      statusRegistry.update({
        source: 'runtime-app-server',
        level: 'healthy',
        message: `Listening on port ${server.port}`,
      })
      return server
    },
    stop: async server => {
      server.stop(true)
      logger.info('Runtime app server stopped.')
      statusRegistry.update({
        source: 'runtime-app-server',
        level: 'unhealthy',
        message: 'Server stopped.',
      })
    },
    health: server => {
      const port = server.port ?? 0
      return {
        serviceId: 'runtime-app-server',
        status: port > 0 ? 'healthy' : 'unhealthy',
        message: port > 0 ? `Listening on port ${port}` : 'Server not listening',
      }
    },
  })

  // Register shutdown hook that delegates to bootstrap shutdown
  lifecycle.registerShutdownHook({
    name: 'bootstrap-shutdown',
    run: async () => {
      await bootstrap.shutdown()
    },
  })

  // Attach OS signal handlers to the process lifecycle
  lifecycle.attachSignalHandlers()

  // Boot all registered services
  try {
    await bootstrap.boot()
  } catch (error) {
    logger.error('Bootstrap failed.', {
      error: error instanceof Error ? error.message : String(error),
    })
    statusRegistry.update({
      source: 'runtime-app-server',
      level: 'unhealthy',
      message: 'Bootstrap failed.',
    })
    process.exit(1)
  }
}
