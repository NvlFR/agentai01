import type { PersistedWorkerState } from '../storage/fileStore.js'
import type { RuntimeJob } from '../queue/index.js'

export type WorkerHandler = (job: RuntimeJob) => Promise<void>

export class RuntimeWorkerPool {
  private readonly workers: PersistedWorkerState[]

  constructor(workerCount: number) {
    this.workers = Array.from({ length: workerCount }, (_, index) => ({
      workerId: `worker-${index + 1}`,
      status: 'idle',
      heartbeatAt: new Date(0).toISOString(),
    }))
  }

  getStates(): PersistedWorkerState[] {
    return this.workers.map(worker => ({ ...worker }))
  }

  heartbeat(now = new Date().toISOString()): void {
    for (const worker of this.workers) {
      worker.heartbeatAt = now
      if (worker.status === 'offline') {
        worker.status = 'idle'
      }
    }
  }

  async runJob(job: RuntimeJob, handler: WorkerHandler): Promise<void> {
    const worker = this.workers.find(candidate => candidate.status === 'idle') ?? this.workers[0]!
    worker.status = 'busy'
    worker.currentJobId = job.jobId
    worker.heartbeatAt = new Date().toISOString()

    try {
      await handler(job)
      worker.status = 'idle'
      worker.currentJobId = undefined
      worker.heartbeatAt = new Date().toISOString()
    } catch (error) {
      worker.status = 'error'
      worker.heartbeatAt = new Date().toISOString()
      throw error
    }
  }

  recover(states: PersistedWorkerState[]): void {
    for (const incoming of states) {
      const worker = this.workers.find(candidate => candidate.workerId === incoming.workerId)
      if (!worker) {
        continue
      }
      worker.status = incoming.status === 'busy' ? 'recovering' : incoming.status
      worker.currentJobId = incoming.currentJobId
      worker.heartbeatAt = incoming.heartbeatAt
    }
  }
}
