import { startRuntimeAppServer } from './server.js'

if (import.meta.main) {
  const server = startRuntimeAppServer()

  console.log(
    `[runtime-app] listening on http://${server.hostname}:${server.port} (${new Date().toISOString()})`,
  )

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  function shutdown() {
    server.stop(true)
    console.log('[runtime-app] stopped')
    process.exit(0)
  }
}
