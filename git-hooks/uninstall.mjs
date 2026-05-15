#!/usr/bin/env node
// git-hooks/uninstall.mjs — removes installed hook scripts from .git/hooks/

import { unlinkSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')
const hooksDir = join(repoRoot, '.git', 'hooks')

const hooks = ['pre-commit', 'commit-msg', 'pre-push']

if (!existsSync(hooksDir)) {
  console.warn('⚠  git-hooks/uninstall: .git/hooks directory not found. Nothing to uninstall.')
  process.exit(0)
}

let removed = 0
for (const hook of hooks) {
  const dest = join(hooksDir, hook)
  if (existsSync(dest)) {
    unlinkSync(dest)
    console.log(`✔  removed: .git/hooks/${hook}`)
    removed++
  } else {
    console.log(`–  not found (skipped): .git/hooks/${hook}`)
  }
}

console.log(`\n✔  git-hooks/uninstall: ${removed} hook(s) removed.`)
