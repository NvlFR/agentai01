import { serializeAuditSafe } from '../security/index.js'

export type ScriptDefinition = {
  id: string
  description: string
  command: string
  args?: readonly string[]
  env?: Record<string, string>
}

export type ScriptRunPlan = {
  command: string
  args: readonly string[]
  env: Record<string, string>
}

export type ScriptRegistry = {
  register(definition: ScriptDefinition): void
  get(id: string): ScriptDefinition | null
  list(): ScriptDefinition[]
  plan(id: string, overrides?: Partial<Pick<ScriptDefinition, 'args' | 'env'>>): ScriptRunPlan | null
}

export function createScriptRegistry(): ScriptRegistry {
  const definitions = new Map<string, ScriptDefinition>()

  return {
    register(definition) {
      definitions.set(definition.id, structuredClone(definition))
    },
    get(id) {
      const definition = definitions.get(id)
      return definition ? structuredClone(definition) : null
    },
    list() {
      return [...definitions.values()].map(definition => structuredClone(definition))
    },
    plan(id, overrides) {
      const definition = definitions.get(id)
      if (!definition) {
        return null
      }

      return {
        command: definition.command,
        args: overrides?.args ?? definition.args ?? [],
        env: { ...(definition.env ?? {}), ...(overrides?.env ?? {}) },
      }
    },
  }
}

export function serializeScriptPlanSafe(plan: ScriptRunPlan): ScriptRunPlan {
  return serializeAuditSafe(plan)
}
