#!/usr/bin/env node
// changelog/compile.mjs — compiles changelog fragments into CHANGELOG.md
//
// Usage:
//   node changelog/compile.mjs              # compile unreleased fragments
//   node changelog/compile.mjs --version 1.2.3  # tag as a specific release
//
// Fragment format: changelog/fragments/<id>-<type>.md
// Valid types: feat, fix, breaking, chore
//
// After compilation, fragments are moved to changelog/fragments/released/

import { readdirSync, readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')

const FRAGMENTS_DIR = join(__dirname, 'fragments')
const RELEASED_DIR = join(FRAGMENTS_DIR, 'released')
const CHANGELOG_PATH = join(repoRoot, 'CHANGELOG.md')
const VALID_TYPES = /** @type {const} */ (['feat', 'fix', 'breaking', 'chore'])

// --- CLI args ---
const args = process.argv.slice(2)
const versionFlagIdx = args.indexOf('--version')
const version = versionFlagIdx !== -1 ? args[versionFlagIdx + 1] : null

if (versionFlagIdx !== -1 && !version) {
  console.error('✖  changelog/compile: --version requires a semver value, e.g. --version 1.0.0')
  process.exit(1)
}

// --- Load fragments ---
if (!existsSync(FRAGMENTS_DIR)) {
  console.error('✖  changelog/compile: changelog/fragments/ directory not found.')
  process.exit(1)
}

mkdirSync(RELEASED_DIR, { recursive: true })

const fragmentFiles = readdirSync(FRAGMENTS_DIR)
  .filter(f => f.endsWith('.md') && f !== 'released')
  .sort() // chronological by id prefix

if (fragmentFiles.length === 0) {
  console.log('–  changelog/compile: no unreleased fragments found. Nothing to compile.')
  process.exit(0)
}

// --- Parse fragments ---
/** @typedef {{ id: string; type: string; body: string; filename: string }} Fragment */

/** @type {Fragment[]} */
const fragments = []
const invalidFragments = []

for (const filename of fragmentFiles) {
  const match = filename.match(/^(.+)-(feat|fix|breaking|chore)\.md$/)
  if (!match) {
    console.warn(`⚠  changelog/compile: skipping malformed filename: ${filename}`)
    console.warn(`   Expected format: <id>-<type>.md where type is: ${VALID_TYPES.join(', ')}`)
    invalidFragments.push(filename)
    continue
  }

  const [, id, type] = match
  const body = readFileSync(join(FRAGMENTS_DIR, filename), 'utf-8').trim()

  fragments.push({ id, type, body, filename })
}

if (fragments.length === 0) {
  console.error('✖  changelog/compile: no valid fragments to compile.')
  process.exit(1)
}

// --- Group by type ---
/** @type {Record<string, Fragment[]>} */
const groups = { breaking: [], feat: [], fix: [], chore: [] }
for (const fragment of fragments) {
  groups[fragment.type]?.push(fragment)
}

// --- Render section ---
/**
 * @param {string} heading
 * @param {Fragment[]} items
 */
function renderSection(heading, items) {
  if (items.length === 0) return ''
  const lines = items.map(f => {
    // Strip HTML comment headers from fragment body if present.
    const body = f.body
      .split('\n')
      .filter(line => !line.startsWith('<!--'))
      .join('\n')
      .trim()
    return `- ${body}`
  })
  return `### ${heading}\n\n${lines.join('\n')}\n`
}

// --- Compile output ---
const date = new Date().toISOString().slice(0, 10)
const versionLabel = version ? `[${version}] — ${date}` : `[Unreleased] — ${date}`

const sections = [
  renderSection('Breaking Changes', groups['breaking']),
  renderSection('Features', groups['feat']),
  renderSection('Bug Fixes', groups['fix']),
  renderSection('Chores', groups['chore']),
].filter(Boolean).join('\n')

const newEntry = `## ${versionLabel}\n\n${sections}`

// Prepend to existing CHANGELOG.md or create new.
let existingContent = ''
if (existsSync(CHANGELOG_PATH)) {
  existingContent = readFileSync(CHANGELOG_PATH, 'utf-8')
}

const separator = existingContent.includes('## ') ? '\n---\n\n' : ''
const output = `# Changelog\n\n${newEntry}${separator}${existingContent.replace(/^# Changelog\n+/, '')}`

writeFileSync(CHANGELOG_PATH, output, 'utf-8')
console.log(`✔  changelog/compile: CHANGELOG.md updated.`)
if (version) {
  console.log(`   Version: ${version}`)
}

// --- Move fragments to released/ ---
for (const fragment of fragments) {
  const src = join(FRAGMENTS_DIR, fragment.filename)
  const dest = join(RELEASED_DIR, fragment.filename)
  renameSync(src, dest)
}

console.log(`✔  changelog/compile: ${fragments.length} fragment(s) moved to changelog/fragments/released/`)

if (invalidFragments.length > 0) {
  console.warn(`⚠  changelog/compile: ${invalidFragments.length} fragment(s) skipped (malformed filenames).`)
}

console.log('\n✔  changelog/compile: done.')
