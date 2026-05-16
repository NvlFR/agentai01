import { err, isRecord, ok, type Result } from '../shared/index.js'

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

export type ToolExecutionResult<TOutput = unknown> = Result<
  {
    readonly output: TOutput
    readonly metadata?: Record<string, unknown>
  },
  ToolError
>

export function validateToolDescriptor(descriptor: ToolDescriptor): Result<ToolDescriptor, ToolError> {
  if (!descriptor.name.trim()) {
    return err(createToolError('invalid_input', 'Tool descriptor name is required.', false))
  }

  if (!descriptor.description.trim()) {
    return err(createToolError('invalid_input', 'Tool descriptor description is required.', false))
  }

  if (!isRecord(descriptor.input_schema)) {
    return err(createToolError('invalid_input', 'Tool descriptor input_schema must be an object.', false))
  }

  return ok(descriptor)
}

export function evaluateToolAvailability(
  expression: ToolAvailabilityExpression | undefined,
  context: ToolAvailabilityContext = {},
): readonly ToolAvailabilityDiagnostic[] {
  if (!expression) {
    return []
  }

  if ('allOf' in expression) {
    return expression.allOf.flatMap(entry => evaluateToolAvailability(entry, context))
  }

  if ('anyOf' in expression) {
    const evaluated = expression.anyOf.map(entry => evaluateToolAvailability(entry, context))
    if (evaluated.some(diagnostics => diagnostics.length === 0)) {
      return []
    }

    return evaluated.flat()
  }

  return evaluateSignal(expression, context)
}

export function buildToolPlan(
  descriptors: readonly ToolDescriptor[],
  availability: ToolAvailabilityContext = {},
): ToolPlan {
  const visible: ToolPlanEntry[] = []
  const hidden: HiddenToolPlanEntry[] = []

  for (const descriptor of [...descriptors].sort(compareToolDescriptors)) {
    const validation = validateToolDescriptor(descriptor)
    const diagnostics = validation.ok
      ? evaluateToolAvailability(descriptor.availability, availability)
      : [toolErrorToDiagnostic(validation.error)]

    if (!descriptor.executor) {
      hidden.push({
        descriptor,
        diagnostics: [
          ...diagnostics,
          {
            reason: 'executor-missing',
            message: `Tool "${descriptor.name}" does not declare an executor.`,
          },
        ],
      })
      continue
    }

    if (diagnostics.length > 0) {
      hidden.push({ descriptor, diagnostics })
      continue
    }

    visible.push({ descriptor, executor: descriptor.executor })
  }

  return { visible, hidden }
}

export function normalizeToolResult<TOutput>(
  output: TOutput,
  metadata?: Record<string, unknown>,
): ToolExecutionResult<TOutput> {
  return ok(metadata ? { output, metadata } : { output })
}

export function normalizeToolError(
  error: unknown,
  code: ToolErrorCode = 'execution_failed',
  retryable = false,
): ToolError {
  if (isToolError(error)) {
    return error
  }

  if (error instanceof Error) {
    return createToolError(code, error.message, retryable, { name: error.name })
  }

  return createToolError(code, String(error), retryable)
}

export function createToolError(
  code: ToolErrorCode,
  message: string,
  retryable: boolean,
  details?: Record<string, unknown>,
): ToolError {
  return details ? { code, message, retryable, details } : { code, message, retryable }
}

function evaluateSignal(
  signal: ToolAvailabilitySignal,
  context: ToolAvailabilityContext,
): readonly ToolAvailabilityDiagnostic[] {
  if (signal.kind === 'always') {
    return []
  }

  if (signal.kind === 'auth') {
    return context.auth_provider_ids?.has(signal.provider_id)
      ? []
      : [diagnostic('auth-missing', `Auth provider "${signal.provider_id}" is not available.`, signal)]
  }

  if (signal.kind === 'env') {
    return context.env?.[signal.name]
      ? []
      : [diagnostic('env-missing', `Environment variable "${signal.name}" is not available.`, signal)]
  }

  if (signal.kind === 'plugin-enabled') {
    return context.enabled_plugin_ids?.has(signal.plugin_id)
      ? []
      : [diagnostic('plugin-disabled', `Plugin "${signal.plugin_id}" is not enabled.`, signal)]
  }

  if (signal.kind === 'context') {
    const value = context.values?.[signal.key]
    const matches = signal.equals === undefined ? value !== undefined : value === signal.equals
    return matches
      ? []
      : [diagnostic('context-mismatch', `Context value "${signal.key}" did not match.`, signal)]
  }

  if (signal.kind === 'config') {
    const value = readJsonPath(context.config, signal.path)
    const available = value === undefined
      ? false
      : context.is_config_value_available?.({ value, path: signal.path, signal }) ?? isConfigValueAvailable(value, signal.check)
    return available
      ? []
      : [diagnostic('config-missing', `Config path "${signal.path.join('.')}" is not available.`, signal)]
  }

  return [diagnostic('unsupported-signal', 'Unsupported availability signal.', signal)]
}

function readJsonPath(value: JsonValue | undefined, path: readonly string[]): JsonValue | undefined {
  let current: JsonValue | undefined = value
  for (const segment of path) {
    if (!isRecord(current)) {
      return undefined
    }
    current = current[segment] as JsonValue | undefined
  }

  return current
}

function isConfigValueAvailable(
  value: JsonValue,
  check: Extract<ToolAvailabilitySignal, { readonly kind: 'config' }>['check'] = 'exists',
): boolean {
  if (check === 'exists') {
    return true
  }

  if (check === 'non-empty') {
    return typeof value === 'string' ? value.trim().length > 0 : value !== null
  }

  return Boolean(value)
}

function diagnostic(
  reason: ToolUnavailableReason,
  message: string,
  signal: ToolAvailabilitySignal,
): ToolAvailabilityDiagnostic {
  return { reason, message, signal }
}

function compareToolDescriptors(left: ToolDescriptor, right: ToolDescriptor): number {
  return (left.sort_key ?? left.name).localeCompare(right.sort_key ?? right.name)
}

function isToolError(value: unknown): value is ToolError {
  return (
    isRecord(value) &&
    typeof value['code'] === 'string' &&
    typeof value['message'] === 'string' &&
    typeof value['retryable'] === 'boolean'
  )
}

function toolErrorToDiagnostic(error: ToolError): ToolAvailabilityDiagnostic {
  return {
    reason: error.code === 'invalid_input' ? 'invalid-descriptor' : 'unsupported-signal',
    message: error.message,
  }
}
