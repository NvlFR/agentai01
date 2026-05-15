import { createRuntimeAppState } from './server.js'

const state = createRuntimeAppState()

console.log('[runtime-scheduler] started with in-memory schedule loop')

const interval = setInterval(() => {
  const snapshot = state.getSnapshot()
  const queued = snapshot.jobs.filter(job => job.status === 'queued').length
  const approvals = snapshot.approvals.length
  console.log(
    `[runtime-scheduler] ${new Date().toISOString()} queued_jobs=${queued} pending_approvals=${approvals} checklist_items=${snapshot.readiness.checklist.length}`,
  )
}, 30_000)

process.on('SIGINT', stop)
process.on('SIGTERM', stop)

function stop() {
  clearInterval(interval)
  console.log('[runtime-scheduler] stopped')
  process.exit(0)
}
