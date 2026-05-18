export type LspDiagnostic = {
  readonly uri: string
  readonly severity: 'error' | 'warning' | 'info'
  readonly message: string
}

export function createLspService() {
  const diagnostics = new Map<string, readonly LspDiagnostic[]>()
  const listeners = new Set<(diagnostic: LspDiagnostic) => void>()

  return {
    publish(uri: string, nextDiagnostics: readonly LspDiagnostic[]) {
      diagnostics.set(uri, [...nextDiagnostics])
      for (const diagnostic of nextDiagnostics) {
        for (const listener of listeners) {
          listener(diagnostic)
        }
      }
    },
    list(uri: string): readonly LspDiagnostic[] {
      return diagnostics.get(uri) ?? []
    },
    onDiagnostic(listener: (diagnostic: LspDiagnostic) => void): () => void {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
