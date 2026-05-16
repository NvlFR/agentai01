// src/runtime-app/diagnostics/prometheus/prometheusBackend.ts
// Prometheus diagnostics backend — collects metrics for /metrics endpoint.

import { type DiagnosticsBackend } from '../diagnosticsCore.js'

type MetricEntry = {
  name: string
  value: number
  labels?: Record<string, string>
  timestamp: number
}

export class PrometheusBackend implements DiagnosticsBackend {
  readonly id = 'diagnostics-prometheus'
  private metrics: MetricEntry[] = []

  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    // In a real implementation, we would use 'prom-client' or similar.
    // For this runtime, we maintain a simple registry.
    this.metrics.push({ name, value, labels, timestamp: Date.now() })
    
    // Simple cap to prevent memory leaks if never scraped.
    if (this.metrics.length > 1000) {
      this.metrics.shift()
    }
  }

  startSpan(name: string, attributes?: Record<string, string>): { end: () => void } {
    const start = Date.now()
    return {
      end: () => {
        const latency = Date.now() - start
        this.recordMetric(`${name}_latency_ms`, latency, attributes)
        this.recordMetric(`${name}_count`, 1, attributes)
      }
    }
  }

  /**
   * Export metrics in Prometheus text format.
   */
  exportMetrics(): string {
    const lines: string[] = []
    const grouped = new Map<string, MetricEntry[]>()

    for (const m of this.metrics) {
      const existing = grouped.get(m.name) ?? []
      existing.push(m)
      grouped.set(m.name, existing)
    }

    for (const [name, entries] of grouped.entries()) {
      lines.push(`# HELP ${name} Metric recorded by runtime`)
      lines.push(`# TYPE ${name} gauge`)
      
      for (const e of entries) {
        const labelsStr = e.labels 
          ? `{${Object.entries(e.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
          : ''
        lines.push(`${name}${labelsStr} ${e.value} ${e.timestamp}`)
      }
    }

    return lines.join('\n')
  }
}
