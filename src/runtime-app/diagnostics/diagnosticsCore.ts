// src/runtime-app/diagnostics/diagnosticsCore.ts
// Diagnostics and Observability Core.

export type MetricType = 'counter' | 'gauge' | 'histogram'

export interface DiagnosticsBackend {
  readonly id: string
  recordMetric(name: string, value: number, labels?: Record<string, string>): void
  startSpan(name: string, attributes?: Record<string, string>): { end: () => void }
}

export class DiagnosticsManager {
  private backends: DiagnosticsBackend[] = []

  registerBackend(backend: DiagnosticsBackend) {
    this.backends.push(backend)
  }

  recordMetric(name: string, value: number, labels?: Record<string, string>) {
    for (const b of this.backends) {
      try { b.recordMetric(name, value, labels) } catch { /* best-effort */ }
    }
  }

  startSpan(name: string, attributes?: Record<string, string>) {
    const activeSpans = this.backends.map(b => {
      try { return b.startSpan(name, attributes) } catch { return null }
    }).filter(Boolean)

    return {
      end: () => {
        for (const s of activeSpans) {
          try { s?.end() } catch { /* best-effort */ }
        }
      }
    }
  }
}

export const globalDiagnostics = new DiagnosticsManager()
