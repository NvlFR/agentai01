import { createLogger } from '../logging/index.js'
import { startRuntimeAppServer } from './server.js'

if (import.meta.main) {
  const logger = createLogger({
    bindings: {
      context: {
        component: 'runtime-app-server',
      },
    },
  })
  const server = startRuntimeAppServer()

  logger.info('Runtime app server listening.', {
    hostname: server.hostname,
    port: server.port,
    url: `http://${server.hostname}:${server.port}`,
  })

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  function shutdown() {
    server.stop(true)
    logger.info('Runtime app server stopped.')
    process.exit(0)
  }
}
