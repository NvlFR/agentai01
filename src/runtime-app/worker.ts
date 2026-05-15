import { createRuntimeAppState } from './server.js'

const state = createRuntimeAppState()

console.log(
  `[runtime-worker] active jobs=${state.getSnapshot().jobs.filter(job => job.status === 'running' || job.status === 'queued').length}`,
)

const interval = setInterval(() => {
  const snapshot = state.getSnapshot()
  console.log(
    `[runtime-worker] ${new Date().toISOString()} readiness=${snapshot.readiness.ready} degraded=${snapshot.health.status === 'degraded'} failed_jobs=${snapshot.jobs.filter(job => job.status === 'failed').length}`,
  )
}, 15_000)

process.on('SIGINT', stop)
process.on('SIGTERM', stop)

function stop() {
  clearInterval(interval)
  console.log('[runtime-worker] stopped')
  process.exit(0)
}
