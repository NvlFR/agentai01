#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const rulesDir = path.join(repoRoot, 'security', 'opengrep', 'rules')
const outputPath = path.join(repoRoot, 'security', 'opengrep', 'precise.yml')

const ruleFiles = fs
  .readdirSync(rulesDir, { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('.yml'))
  .map(entry => path.join(rulesDir, entry.name))
  .sort()

if (ruleFiles.length === 0) {
  process.stderr.write('No source rule files found in security/opengrep/rules.\n')
  process.exit(1)
}

const compiledRules = []

for (const ruleFile of ruleFiles) {
  const source = fs.readFileSync(ruleFile, 'utf8').trim()
  const metadata = readRuleMetadata(source)
  const errors = []

  if (!metadata.id) {
    errors.push('id')
  }
  if (!metadata.message) {
    errors.push('message')
  }
  if (!metadata.severity) {
    errors.push('severity')
  }
  if (!metadata.languages) {
    errors.push('languages')
  }

  if (errors.length > 0) {
    const relativePath = path.relative(repoRoot, ruleFile).split(path.sep).join('/')
    process.stderr.write(
      `${relativePath} is missing required metadata fields: ${errors.join(', ')}.\n`,
    )
    process.exit(1)
  }

  compiledRules.push(indentRule(source))
}

const output = [
  '# Compiled by node security/opengrep/compile-rules.mjs',
  'rules:',
  ...compiledRules,
  '',
].join('\n')

fs.writeFileSync(outputPath, output, 'utf8')
process.stdout.write(
  `Compiled ${compiledRules.length} opengrep rules to security/opengrep/precise.yml.\n`,
)

function readRuleMetadata(source) {
  return {
    id: readScalar(source, /^-\s*id:\s*(.+)$/m),
    message: readScalar(source, /^\s*message:\s*(.+)$/m),
    severity: readScalar(source, /^\s*severity:\s*(.+)$/m),
    languages: readScalar(source, /^\s*languages:\s*\[(.+)\]\s*$/m),
  }
}

function readScalar(source, pattern) {
  const match = source.match(pattern)
  return match?.[1]?.trim() ?? ''
}

function indentRule(source) {
  return source
    .split('\n')
    .map(line => `  ${line}`)
    .join('\n')
}
