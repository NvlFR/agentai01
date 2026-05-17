import { createRequire } from 'node:module'
import YAML from 'yaml'
import { z, type ZodType } from 'zod'

type LegacyYamlModule = {
  load: (content: string) => unknown
}

const require = createRequire(import.meta.url)
const legacyYamlModule = require('js-yaml') as LegacyYamlModule

export type ParsedYamlConfig<T> = {
  data: T
  format: 'yaml' | 'legacy-yaml'
}

export function parseYamlConfig<T>(content: string, schema: ZodType<T>): ParsedYamlConfig<T> {
  const document = YAML.parse(content)
  return {
    data: schema.parse(document),
    format: 'yaml',
  }
}

export function parseLegacyYamlConfig<T>(content: string, schema: ZodType<T>): ParsedYamlConfig<T> {
  const loaded = legacyYamlModule.load(content)
  return {
    data: schema.parse(loaded),
    format: 'legacy-yaml',
  }
}

export const runtimeYamlConfigSchema = z.object({
  runtime: z.object({
    host: z.string().min(1),
    port: z.number().int().min(1).max(65535),
  }),
})
