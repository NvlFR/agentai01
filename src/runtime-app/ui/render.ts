import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { RuntimeAppSnapshot } from '../state.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const bundlePath = join(__dirname, 'bundle.js')

export function renderOperatorShell(snapshot: RuntimeAppSnapshot): string {
  const payload = escapeForScript(JSON.stringify(snapshot))
  const bundle = readFileSync(bundlePath, 'utf8')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Agent Runtime Operator</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
    <style>
      body { margin: 0; background: #0b0c10; font-family: "Inter", sans-serif; }
      agent-runtime-shell { display: block; min-height: 100vh; }
    </style>
  </head>
  <body>
    <script>window.__RUNTIME_APP__ = ${payload};</script>
    <agent-runtime-shell></agent-runtime-shell>
    <script>${bundle}</script>
  </body>
</html>`
}

function escapeForScript(value: string): string {
  return value.replace(/</g, '\\u003c')
}
