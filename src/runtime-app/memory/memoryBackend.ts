// src/runtime-app/memory/memoryBackend.ts
// MemoryBackend interface — contract yang harus diimplementasikan semua backend.
// Backend opsional harus fallback ke memory-core jika tidak tersedia.

export type MemoryBackend = {
  readonly id: string
  store(key: string, value: unknown): Promise<void>
  retrieve(key: string): Promise<unknown | null>
  search(query: string): Promise<unknown[]>
  delete(key: string): Promise<void>
}

export type MemoryBackendFactory = {
  id: string
  isAvailable(): boolean
  create(): MemoryBackend
}

/**
 * Load a memory backend by priority order.
 * Falls back to the fallback backend if preferred backend is unavailable.
 */
export function resolveMemoryBackend(
  preferred: MemoryBackendFactory,
  fallback: MemoryBackendFactory,
  logger?: (entry: { event: string; backendId: string; reason?: string }) => void,
): MemoryBackend {
  if (preferred.isAvailable()) {
    return preferred.create()
  }

  logger?.({
    event: 'memory_backend_fallback',
    backendId: preferred.id,
    reason: `${preferred.id} not available — falling back to ${fallback.id}`,
  })
  return fallback.create()
}
