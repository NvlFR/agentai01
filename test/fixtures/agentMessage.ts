import type { Agent_Message } from '../../src/domain/types.js'

export const sampleAgentMessage: Agent_Message<{
  status: string
  summary: string
}> = {
  from: 'sales_agent',
  to: 'product_agent',
  message_type: 'status_update',
  project_id: 'proj-test-001',
  timestamp: '2026-05-15T10:00:00.000Z',
  payload: {
    status: 'qualified',
    summary: 'Lead qualified and ready for product discovery.',
  },
}
