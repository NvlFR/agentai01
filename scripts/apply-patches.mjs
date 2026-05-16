#!/usr/bin/env node
// scripts/apply-patches.mjs — applies all patch files in patches/
// Called via postinstall in package.json.
// Format: patches/<package-name>+<version>.patch

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')
const patchesDir = join(repoRoot, 'patches')

if (!existsSync(patchesDir)) {
  // No patches directory — nothing to do.
  process.exit(0)
}

const patchFiles = readdirSync(patchesDir)
  .filter(f => f.endsWith('.patch'))

if (patchFiles.length === 0) {
  // No patches to apply.
  process.exit(0)
}

let failed = 0
for (const patchFile of patchFiles) {
  // Parse package name and expected version from filename.
  const match = patchFile.match(/^(.+)\+(.+)\.patch$/)
  if (!match) {
    console.warn(`⚠  apply-patches: skipping malformed filename: ${patchFile}`)
    continue
  }

  const [, packageName, expectedVersion] = match

  // Check if package is installed and get its actual version.
  const pkgJsonPath = join(repoRoot, 'node_modules', packageName, 'package.json')
  if (!existsSync(pkgJsonPath)) {
    console.error(`✖  apply-patches: package not installed: ${packageName}`)
    console.error(`   Expected version: ${expectedVersion}`)
    console.error(`   Run: npm install`)
    failed++
    continue
  }

  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
  const actualVersion = pkgJson.version ?? 'unknown'

  if (actualVersion !== expectedVersion) {
    console.error(`✖  apply-patches: version mismatch for ${packageName}`)
    console.error(`   Patch expects: ${expectedVersion}`)
    console.error(`   Installed:     ${actualVersion}`)
    console.error(`   Update or remove patches/${patchFile}`)
    failed++
    continue
  }

  const patchPath = join(patchesDir, patchFile)
  try {
    // Apply patch using system `patch` command (idempotent with --forward).
    execSync(`patch --forward --strip=1 --directory="${repoRoot}/node_modules" < "${patchPath}"`, {
      stdio: 'pipe',
    })
    console.log(`✔  apply-patches: applied ${patchFile}`)
  } catch (err) {
    // --forward exits non-zero if already applied — that's OK (idempotent).
    const output = err instanceof Error && 'stdout' in err
      ? String(err.stdout)
      : ''
    if (output.includes('Skipping patch') || output.includes('already applied')) {
      console.log(`–  apply-patches: already applied (skipped): ${patchFile}`)
    } else {
      console.error(`✖  apply-patches: failed to apply ${patchFile}`)
      console.error(`   ${err instanceof Error ? err.message : String(err)}`)
      failed++
    }
  }
}

if (failed > 0) {
  console.error(`\n✖  apply-patches: ${failed} patch(es) failed. See errors above.`)
  process.exit(1)
}
