#!/usr/bin/env node
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const srcDir = path.join(rootDir, 'src')

const bannedImportPatterns = [
  /\bfrom\s+['"](?:@openclaw|openclaw|@earendil)(?:\/|['"])/,
  /\brequire\(\s*['"](?:@openclaw|openclaw|@earendil)(?:\/|['"])/,
  /\bimport\(\s*['"](?:@openclaw|openclaw|@earendil)(?:\/|['"])/,
]

const bannedStubPatterns = [
  /throw new Error\((['"])not implemented\1\)/,
  /TODO:\s*implement/,
  /placeholderEmbedding/,
]

const violations = []

walk(srcDir)

if (violations.length > 0) {
  for (const violation of violations) {
    process.stderr.write(`${violation}\n`)
  }
  process.exit(1)
}

process.stdout.write('Final adaptation gate passed.\n')

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'referensi') {
      continue
    }

    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath)
      continue
    }

    if (!fullPath.endsWith('.ts') || fullPath.endsWith('.d.ts')) {
      continue
    }

    const relativePath = path.relative(rootDir, fullPath)
    const source = readFileSync(fullPath, 'utf8')
    const lines = source.split('\n')

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? ''
      if (bannedImportPatterns.some(pattern => pattern.test(line))) {
        violations.push(`${relativePath}:${index + 1} banned import reference`)
      }
    }

    if (!fullPath.endsWith('.test.ts')) {
      for (const pattern of bannedStubPatterns) {
        const match = pattern.exec(source)
        if (match) {
          const line = source.slice(0, match.index).split('\n').length
          violations.push(`${relativePath}:${line} banned stub marker "${match[0]}"`)
        }
      }
    }

    if (fullPath.endsWith('.test.ts') || !source.includes('referensi/openclaw')) {
      continue
    }

    if (path.basename(fullPath) === 'index.ts') {
      continue
    }

    const siblingTestPath = fullPath.replace(/\.ts$/, '.test.ts')
    if (!existsSync(siblingTestPath)) {
      violations.push(`${relativePath} missing colocated test file`)
    }
  }
}
