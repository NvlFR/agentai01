// Adapted using referensi/openclaw/src/tools/plan.ts
import { evaluateToolAvailability } from './availability.js'
import { validateToolDescriptor } from './descriptor.js'
import type {
  HiddenToolPlanEntry,
  ToolAvailabilityContext,
  ToolAvailabilityDiagnostic,
  ToolDescriptor,
  ToolError,
  ToolPlan,
  ToolPlanEntry,
} from './types.js'

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

function compareToolDescriptors(left: ToolDescriptor, right: ToolDescriptor): number {
  return (left.sort_key ?? left.name).localeCompare(right.sort_key ?? right.name)
}

function toolErrorToDiagnostic(error: ToolError): ToolAvailabilityDiagnostic {
  return {
    reason: error.code === 'invalid_input' ? 'invalid-descriptor' : 'unsupported-signal',
    message: error.message,
  }
}
