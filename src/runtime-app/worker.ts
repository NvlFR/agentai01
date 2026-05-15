import { createLogger } from '../logging/index.js'
import { createRuntimeAppState } from './server.js'

const state = createRuntimeAppState()
const logger = createLogger({
  env: state.config.env,
  bindings: {
    context: {
      component: 'runtime-worker',
    },
  },
})

logger.info('Runtime worker started.', {
  active_jobs: state
    .getSnapshot()
    .jobs.filter(job => job.status === 'running' || job.status === 'queued').length,
})

const interval = setInterval(() => {
  const snapshot = state.getSnapshot()
  logger.info('Runtime worker heartbeat.', {
    readiness_ready: snapshot.readiness.ready,
    degraded: snapshot.health.status === 'degraded',
    failed_jobs: snapshot.jobs.filter(job => job.status === 'failed').length,
  })
}, 15_000)

process.on('SIGINT', stop)
process.on('SIGTERM', stop)

function stop() {
  clearInterval(interval)
  logger.info('Runtime worker stopped.')
  process.exit(0)
}
