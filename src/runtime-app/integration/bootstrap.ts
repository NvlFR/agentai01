import type { AgentRegistryEntry, AgentType } from '../../domain/types.js'
import type {
  OrchestratorShell,
  RuntimeWorkerDescriptor,
} from '../../runtime/index.js'
import { bootOrchestratorShell } from '../../runtime/index.js'

export type RuntimeAppBootstrapRequest = {
  shell_id: string
  runtime_id: string
  started_at?: string
  mode?: 'local' | 'worker' | 'dry-run'
  workers: RuntimeWorkerDescriptor[]
}

export function bootRuntimeShell(
  request: RuntimeAppBootstrapRequest,
): OrchestratorShell {
  return bootOrchestratorShell({
    shell_id: request.shell_id,
    runtime: {
      runtime_id: request.runtime_id,
      mode: request.mode ?? 'worker',
      started_at: request.started_at,
      workers: request.workers,
      tags: ['runtime-app-operational'],
    },
  })
}

export function workerToRegistryEntry(
  worker: RuntimeWorkerDescriptor,
  timestamp: string,
): AgentRegistryEntry {
  return {
    agent_id: worker.agent_id,
    agent_type: worker.agent_type,
    status: worker.status === 'offline' ? 'offline' : 'idle',
    current_project_id: worker.project_id,
    last_activity_timestamp: timestamp,
  }
}

export function createDefaultWorkers(): RuntimeWorkerDescriptor[] {
  return [
    createWorker('ceo-1', 'ceo_agent'),
    createWorker('marketing-1', 'marketing_agent'),
    createWorker('sales-1', 'sales_agent'),
    createWorker('product-1', 'product_agent'),
    createWorker('engineering-1', 'engineering_agent'),
    createWorker('pm-1', 'project_manager_agent'),
    createWorker('support-1', 'support_agent'),
  ]
}

function createWorker(agentId: string, agentType: AgentType): RuntimeWorkerDescriptor {
  return {
    worker_id: `worker-${agentId}`,
    agent_id: agentId,
    agent_type: agentType,
    status: 'ready',
  }
}
