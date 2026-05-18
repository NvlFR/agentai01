import { z } from 'zod'

const ManagedSettingsSchema = z.record(z.string(), z.unknown())

export function createRemoteManagedSettingsService(input: {
  readonly enabled?: boolean
  readonly fetchRemote: () => Promise<unknown>
}) {
  let cached: Record<string, unknown> | null = null

  return {
    async load(): Promise<{ readonly available: boolean; readonly settings: Record<string, unknown> }> {
      if (input.enabled === false) {
        return { available: false, settings: cached ?? {} }
      }

      try {
        const parsed = ManagedSettingsSchema.parse(await input.fetchRemote())
        cached = parsed
        return { available: true, settings: parsed }
      } catch {
        return { available: false, settings: cached ?? {} }
      }
    },
  }
}
