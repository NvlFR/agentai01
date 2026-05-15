#!/usr/bin/env node
import {
  buildProjectGraph,
} from './_lib/project-graph.mjs'
import {
  entryFilePatterns,
  ignoredFiles,
  ignoredExports,
  ignoredFilePatterns,
} from './deadcode-unused-files.allowlist.mjs'

const productionGraph = buildProjectGraph({ includeTests: false })
const fullGraph = buildProjectGraph({ includeTests: true })
const entryFiles = productionGraph.files.filter(isEntryFile)
const reachableFiles = collectReachableFiles(entryFiles, productionGraph)

const fileViolations = productionGraph.files
  .filter(file => !isIgnoredFile(file))
  .filter(file => !reachableFiles.has(file))
  .map(file => ({
    file,
    symbol: '(file)',
  }))

const exportViolations = collectUnusedExports(fullGraph, reachableFiles)
const violations = [...fileViolations, ...exportViolations]

if (violations.length > 0) {
  for (const violation of violations) {
    process.stderr.write(`${violation.file} :: ${violation.symbol}\n`)
  }
  process.exit(1)
}

process.stdout.write('Dead code check passed.\n')

function collectReachableFiles(entryFilesInput, graph) {
  const reachable = new Set()
  const queue = [...entryFilesInput]

  while (queue.length > 0) {
    const file = queue.shift()
    if (!file || reachable.has(file)) {
      continue
    }
    reachable.add(file)

    const info = graph.infos.get(file)
    for (const entry of info.imports) {
      if (entry.resolved && !reachable.has(entry.resolved)) {
        queue.push(entry.resolved)
      }
    }
  }

  return reachable
}

function collectUnusedExports(graph, reachableFiles) {
  const consumed = new Map()
  const wildcardConsumed = new Set()

  for (const file of graph.files) {
    const info = graph.infos.get(file)
    for (const entry of info.imports) {
      if (!entry.resolved) {
        continue
      }

      if (entry.wildcard || entry.importedNames.includes('*')) {
        wildcardConsumed.add(entry.resolved)
        continue
      }

      const set = consumed.get(entry.resolved) ?? new Set()
      for (const name of entry.importedNames) {
        set.add(name)
      }
      consumed.set(entry.resolved, set)
    }
  }

  const violations = []
  for (const file of graph.files) {
    if (!reachableFiles.has(file)) {
      continue
    }
    if (isIgnoredFile(file) || isEntryFile(file) || wildcardConsumed.has(file)) {
      continue
    }

    const exportedNames = graph.infos.get(file).exports
    if (exportedNames.length === 0) {
      continue
    }

    const ignored = new Set(ignoredExports[file] ?? [])
    const used = consumed.get(file) ?? new Set()

    for (const name of exportedNames) {
      if (ignored.has('*') || ignored.has(name)) {
        continue
      }
      if (!used.has(name)) {
        violations.push({
          file,
          symbol: name,
        })
      }
    }
  }

  return violations
}

function isEntryFile(file) {
  return entryFilePatterns.some(pattern => pattern.test(file))
}

function isIgnoredFile(file) {
  if (ignoredFiles.includes(file)) {
    return true
  }
  return ignoredFilePatterns.some(pattern => pattern.test(file))
}
