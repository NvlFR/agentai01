import { describe, expect, it } from 'bun:test'
import { z } from 'zod'
import { buildPluginConfigSchema, buildChannelConfigSchema, emptyPluginConfigValidator } from './config-schema.js'

describe('config-schema', () => {
  describe('buildPluginConfigSchema', () => {
    it('should validate a simple schema', () => {
      const schema = z.object({
        enabled: z.boolean(),
        apiKey: z.string(),
      })
      const validator = buildPluginConfigSchema(schema)
      
      const validResult = validator.safeParse({ enabled: true, apiKey: 'secret' })
      expect(validResult.success).toBe(true)
      if (validResult.success) {
        expect(validResult.data).toEqual({ enabled: true, apiKey: 'secret' })
      }

      const invalidResult = validator.safeParse({ enabled: 'yes' })
      expect(invalidResult.success).toBe(false)
      if (!invalidResult.success) {
        expect(invalidResult.error.issues.length).toBeGreaterThan(0)
      }
    })
  })

  describe('buildChannelConfigSchema', () => {
    it('should validate and provide jsonSchema', () => {
      const schema = z.object({
        interval: z.number().default(60),
      })
      const channelSchema = buildChannelConfigSchema(schema, {
        jsonSchema: { type: 'object', properties: { interval: { type: 'number' } } }
      })

      expect(channelSchema.schema.type).toBe('object')
      const result = channelSchema.runtime.safeParse({ interval: 30 })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ interval: 30 })
      }
    })
  })

  describe('emptyPluginConfigValidator', () => {
    it('should only accept empty objects or undefined', () => {
      const validator = emptyPluginConfigValidator()
      
      expect(validator.safeParse({}).success).toBe(true)
      // Zod's .strict() on {} should fail if there are keys
      expect(validator.safeParse({ key: 'val' }).success).toBe(false)
    })
  })
})
