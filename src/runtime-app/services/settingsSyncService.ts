export function createSettingsSyncService<T extends Record<string, unknown>>(input: {
  readonly readLocal: () => T
  readonly readRemote: () => Promise<Partial<T>>
  readonly writeLocal: (next: T) => Promise<void>
}) {
  return {
    async sync(): Promise<T> {
      const local = input.readLocal()
      const remote = await input.readRemote()
      const merged = { ...local, ...remote }
      await input.writeLocal(merged)
      return merged
    },
  }
}
