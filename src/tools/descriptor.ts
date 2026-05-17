// Adapted using referensi/openclaw/src/tools/descriptor.ts
import { err, isRecord, ok, type Result } from '../shared/index.js'
import { createToolError } from './result.js'
import type { ToolDescriptor, ToolError } from './types.js'

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
