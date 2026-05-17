#!/usr/bin/env node
// git-hooks/install.mjs — copies hook scripts to .git/hooks/

import { copyFileSync, chmodSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')
const hooksDir = join(repoRoot, '.git', 'hooks')

const hooks = ['pre-commit', 'commit-msg', 'pre-push']

if (!existsSync(hooksDir)) {
  console.error('✖  git-hooks/install: .git/hooks directory not found. Are you in a git repo?')
  process.exit(1)
}

let installed = 0
for (const hook of hooks) {
  const src = join(__dirname, hook)
  const dest = join(hooksDir, hook)

  if (!existsSync(src)) {
    console.warn(`⚠  git-hooks/install: source not found, skipping: git-hooks/${hook}`)
    continue
  }

  copyFileSync(src, dest)
  chmodSync(dest, 0o755)
  console.log(`✔  installed: .git/hooks/${hook}`)
  installed++
}

if (installed === 0) {
  console.error('✖  git-hooks/install: no hooks were installed.')
  process.exit(1)
}

console.log(`\n✔  git-hooks/install: ${installed} hook(s) installed.`)
console.log('   Bypass any hook with --no-verify (emergency only). See git-hooks/ for hook scripts.')
