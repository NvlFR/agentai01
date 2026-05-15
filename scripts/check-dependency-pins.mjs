#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const packageFiles = findPackageFiles(repoRoot)
const violations = []

for (const packageFile of packageFiles) {
  const packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf8'))
  for (const section of ['dependencies', 'devDependencies']) {
    const entries = Object.entries(packageJson[section] ?? {})
    for (const [name, specifier] of entries) {
      if (!isPinnedVersion(specifier)) {
        violations.push({
          packageFile: path.relative(repoRoot, packageFile).split(path.sep).join('/'),
          name,
          specifier,
        })
      }
    }
  }
}

if (violations.length > 0) {
  for (const violation of violations) {
    process.stderr.write(
      `${violation.packageFile} :: ${violation.name} -> ${violation.specifier}\n`,
    )
  }
  process.exit(1)
}

process.stdout.write('Dependency pin check passed.\n')

function findPackageFiles(rootDir) {
  const rootPackage = path.join(rootDir, 'package.json')
  const packageFiles = [rootPackage]
  const rootJson = JSON.parse(fs.readFileSync(rootPackage, 'utf8'))
  const workspaces = Array.isArray(rootJson.workspaces)
    ? rootJson.workspaces
    : Array.isArray(rootJson.workspaces?.packages)
      ? rootJson.workspaces.packages
      : []

  for (const workspace of workspaces) {
    if (!workspace.endsWith('/*')) {
      const packageFile = path.join(rootDir, workspace, 'package.json')
      if (fs.existsSync(packageFile)) {
        packageFiles.push(packageFile)
      }
      continue
    }

    const workspaceDir = path.join(rootDir, workspace.slice(0, -2))
    if (!fs.existsSync(workspaceDir)) {
      continue
    }
    for (const entry of fs.readdirSync(workspaceDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue
      }
      const packageFile = path.join(workspaceDir, entry.name, 'package.json')
      if (fs.existsSync(packageFile)) {
        packageFiles.push(packageFile)
      }
    }
  }

  return [...new Set(packageFiles)]
}

function isPinnedVersion(specifier) {
  return /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(specifier)
}
