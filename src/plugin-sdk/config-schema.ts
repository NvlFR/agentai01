import { z } from 'zod'
import type { ZodTypeAny } from 'zod'
import type { JsonObject } from '../tools/index.js'

export type ConfigSchemaIssue = {
  readonly path: (string | number)[]
  readonly message: string
}

export type ConfigSchemaParseResult =
  | { readonly success: true; readonly data: unknown }
  | { readonly success: false; readonly error: { readonly issues: ReadonlyArray<ConfigSchemaIssue> } }

export type PluginConfigValidator = {
  readonly safeParse: (value: unknown) => ConfigSchemaParseResult
  readonly jsonSchema?: JsonObject
}

export type ChannelConfigSchema = {
  readonly schema: JsonObject
  readonly runtime: {
    readonly safeParse: (value: unknown) => ConfigSchemaParseResult
  }
}

/**
 * Helper to build a plugin configuration schema using Zod.
 * Adapted for agentai01 from OpenClaw's config-schema.ts.
 */
export function buildPluginConfigSchema(
  schema: ZodTypeAny,
  options?: {
    readonly jsonSchema?: JsonObject
  },
): PluginConfigValidator {
  return {
    safeParse: (value: unknown): ConfigSchemaParseResult => {
      const result = schema.safeParse(value)
      if (result.success) {
        return { success: true, data: result.data }
      }
      return {
        success: false,
        error: {
          issues: result.error.issues.map(issue => ({
            path: [...issue.path].map(p => (typeof p === 'symbol' ? String(p) : p)),
            message: issue.message,
          })),
        },
      }
    },
    jsonSchema: options?.jsonSchema ?? {
      type: 'object',
      additionalProperties: true,
    },
  }
}

/**
 * Helper to build a channel configuration schema using Zod.
 * Adapted for agentai01 from OpenClaw's channel config-schema.ts.
 */
export function buildChannelConfigSchema(
  schema: ZodTypeAny,
  options?: {
    readonly jsonSchema?: JsonObject
  },
): ChannelConfigSchema {
  return {
    schema: options?.jsonSchema ?? {
      type: 'object',
      additionalProperties: true,
    },
    runtime: {
      safeParse: (value: unknown): ConfigSchemaParseResult => {
        const result = schema.safeParse(value)
        if (result.success) {
          return { success: true, data: result.data }
        }
        return {
          success: false,
          error: {
            issues: result.error.issues.map(issue => ({
              path: [...issue.path].map(p => (typeof p === 'symbol' ? String(p) : p)),
              message: issue.message,
            })),
          },
        }
      },
    },
  }
}

/**
 * Helper for empty configuration schemas.
 */
export function emptyPluginConfigValidator(): PluginConfigValidator {
  const schema = z.object({}).strict()
  return buildPluginConfigSchema(schema, {
    jsonSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  })
}
