// src/runtime-app/diagnostics/health.ts
// Health check state management.

export type HealthStatus = {
  ready: boolean
  reason?: string
}

export interface HealthState {
  setReady(ready: boolean, reason?: string): void
  isReady(): boolean
  getStatus(): HealthStatus
}

export function createHealthState(): HealthState {
  let status: HealthStatus = { ready: false, reason: 'not initialized' }

  return {
    setReady(ready, reason) {
      status = ready ? { ready: true } : { ready: false, reason: reason ?? 'not ready' }
    },
    isReady() {
      return status.ready
    },
    getStatus() {
      return { ...status }
    },
  }
}
