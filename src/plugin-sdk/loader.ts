// Adapted using referensi/openclaw/src/plugin-sdk/loader.ts
import { z } from 'zod'
import { join } from 'node:path'
import { readFileSafe } from '../infra/fs.js'
import type { Result } from '../shared/index.js'
import type { PluginManifest } from './types.js'

export const PluginManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().min(1),
  author: z.string().optional(),
  tools: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
})

export type PluginLoaderOptions = {
  readonly pluginDir: string
  readonly readFile?: (path: string) => Promise<Result<string, string>>
}

export type PluginLoader = {
  loadManifest(pluginPath: string): Promise<PluginManifest>
}

export function createPluginLoader(options: PluginLoaderOptions): PluginLoader {
  const readFile = options.readFile ?? readFileSafe

  return {
    async loadManifest(pluginPath: string): Promise<PluginManifest> {
      const manifestPath = join(options.pluginDir, pluginPath, 'manifest.json')
      const result = await readFile(manifestPath)
      
      if (!result.ok) {
        throw new Error(`Failed to load manifest at ${manifestPath}: ${result.error}`)
      }

      try {
        const raw = JSON.parse(result.value)
        const manifest = PluginManifestSchema.parse(raw)
        return manifest as PluginManifest
      } catch (error) {
        if (error instanceof z.ZodError) {
          const diagnostics = error.issues
            .map(issue => `${issue.path.join('.')}: ${issue.message}`)
            .join(', ')
          throw new Error(`Invalid manifest at ${manifestPath}: ${diagnostics}`)
        }
        throw new Error(`Failed to parse manifest at ${manifestPath}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }
}
