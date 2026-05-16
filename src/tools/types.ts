// Adapted from referensi/openclaw/src/tools/types.ts

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue }
export type JsonObject = { readonly [key: string]: JsonValue }

export type ToolOwnerRef =
  | { readonly kind: 'core' }
  | { readonly kind: 'plugin'; readonly plugin_id: string }
  | { readonly kind: 'channel'; readonly channel_id: string; readonly plugin_id?: string }
  | { readonly kind: 'mcp'; readonly server_id: string }

export type ToolExecutorRef =
  | { readonly kind: 'core'; readonly executor_id: string }
  | { readonly kind: 'plugin'; readonly plugin_id: string; readonly tool_name: string }
  | { readonly kind: 'channel'; readonly channel_id: string; readonly action_id: string }
  | { readonly kind: 'mcp'; readonly server_id: string; readonly tool_name: string }

export type ToolAvailabilitySignal =
  | { readonly kind: 'always' }
  | { readonly kind: 'auth'; readonly provider_id: string }
  | { readonly kind: 'env'; readonly name: string }
  | { readonly kind: 'plugin-enabled'; readonly plugin_id: string }
  | { readonly kind: 'context'; readonly key: string; readonly equals?: JsonPrimitive }
  | {
      readonly kind: 'config'
      readonly path: readonly string[]
      readonly check?: 'exists' | 'non-empty' | 'available'
    }

export type ToolAvailabilityExpression =
  | ToolAvailabilitySignal
  | { readonly allOf: readonly ToolAvailabilityExpression[] }
  | { readonly anyOf: readonly ToolAvailabilityExpression[] }

export type ToolDescriptor = {
  readonly name: string
  readonly title?: string
  readonly description: string
  readonly input_schema: JsonObject
  readonly output_schema?: JsonObject
  readonly owner: ToolOwnerRef
  readonly executor?: ToolExecutorRef
  readonly availability?: ToolAvailabilityExpression
  readonly annotations?: JsonObject
  readonly sort_key?: string
}

export type ToolAvailabilityContext = {
  readonly auth_provider_ids?: ReadonlySet<string>
  readonly config?: JsonObject
  readonly env?: Readonly<Record<string, string | undefined>>
  readonly enabled_plugin_ids?: ReadonlySet<string>
  readonly values?: Readonly<Record<string, JsonPrimitive | undefined>>
  readonly is_config_value_available?: (params: {
    readonly value: JsonValue
    readonly path: readonly string[]
    readonly signal: Extract<ToolAvailabilitySignal, { readonly kind: 'config' }>
  }) => boolean
}

export type ToolUnavailableReason =
  | 'auth-missing'
  | 'config-missing'
  | 'context-mismatch'
  | 'env-missing'
  | 'executor-missing'
  | 'invalid-descriptor'
  | 'plugin-disabled'
  | 'unsupported-signal'

export type ToolAvailabilityDiagnostic = {
  readonly reason: ToolUnavailableReason
  readonly message: string
  readonly signal?: ToolAvailabilitySignal
}

export type ToolPlanEntry = {
  readonly descriptor: ToolDescriptor
  readonly executor: ToolExecutorRef
}

export type HiddenToolPlanEntry = {
  readonly descriptor: ToolDescriptor
  readonly diagnostics: readonly ToolAvailabilityDiagnostic[]
}

export type ToolPlan = {
  readonly visible: readonly ToolPlanEntry[]
  readonly hidden: readonly HiddenToolPlanEntry[]
}

export type ToolErrorCode =
  | 'availability_failed'
  | 'execution_failed'
  | 'invalid_input'
  | 'not_found'
  | 'timeout'

export type ToolError = {
  readonly code: ToolErrorCode
  readonly message: string
  readonly retryable: boolean
  readonly details?: Record<string, unknown>
}
