import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { mockSnapshot } from './src/types/snapshot.mock.js'

const runtimeApiTarget = resolveRuntimeApiTarget()

function agentaiDevStub(): Plugin {
  return {
    name: 'agentai-dev-stub',
    configureServer(server) {
      server.middlewares.use('/__agentai/snapshot', (_req, res) => {
        res.statusCode = 200
        res.setHeader('content-type', 'application/json; charset=utf-8')
        res.end(JSON.stringify(mockSnapshot))
      })
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [agentaiDevStub()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': runtimeApiTarget,
    },
  },
})

function resolveRuntimeApiTarget(): string {
  const explicitTarget = process.env['RUNTIME_API_TARGET'] ?? process.env['VITE_RUNTIME_API_TARGET']
  if (explicitTarget) return explicitTarget

  const explicitPort = process.env['APP_PORT']
  if (explicitPort) return `http://127.0.0.1:${explicitPort}`

  const envPort = readRootEnvValue('APP_PORT')
  return `http://127.0.0.1:${envPort ?? '3000'}`
}

function readRootEnvValue(key: string): string | undefined {
  try {
    const envPath = resolve(process.cwd(), '../../..', '.env')
    const lines = readFileSync(envPath, 'utf8').split(/\r?\n/)
    const prefix = `${key}=`
    const match = lines.find(line => line.startsWith(prefix))
    return match?.slice(prefix.length).trim().replace(/^['"]|['"]$/g, '')
  } catch {
    return undefined
  }
}
