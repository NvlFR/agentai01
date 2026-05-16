// Adapted from referensi/openclaw/src/tools/availability.ts
import { isRecord } from '../shared/index.js'
import type {
  JsonValue,
  ToolAvailabilityContext,
  ToolAvailabilityDiagnostic,
  ToolAvailabilityExpression,
  ToolAvailabilitySignal,
  ToolUnavailableReason,
} from './types.js'

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
