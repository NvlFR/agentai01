import { createLogger } from '../logging/index.js'
import { createRuntimeAppState } from './server.js'

const state = createRuntimeAppState()
const logger = createLogger({
  bindings: {
    context: {
      component: 'runtime-scheduler',
    },
  },
})

logger.info('Runtime scheduler started.', {
  loop: 'in-memory',
})

const interval = setInterval(() => {
  const snapshot = state.getSnapshot()
  const queued = snapshot.jobs.filter(job => job.status === 'queued').length
  const approvals = snapshot.approvals.length
  logger.info('Runtime scheduler heartbeat.', {
    queued_jobs: queued,
    pending_approvals: approvals,
    checklist_items: snapshot.readiness.checklist.length,
  })
}, 30_000)

process.on('SIGINT', stop)
process.on('SIGTERM', stop)

function stop() {
  clearInterval(interval)
  logger.info('Runtime scheduler stopped.')
  process.exit(0)
}
