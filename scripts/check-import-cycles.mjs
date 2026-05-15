#!/usr/bin/env node
import { buildAdjacency, buildProjectGraph } from './_lib/project-graph.mjs'

const graph = buildProjectGraph({ includeTests: false })
const adjacency = buildAdjacency(graph)
const cycles = findCycles(graph.files, adjacency)

if (cycles.length > 0) {
  for (const cycle of cycles) {
    process.stderr.write(`${cycle.join(' -> ')} -> ${cycle[0]}\n`)
  }
  process.exit(1)
}

process.stdout.write('Import cycle check passed.\n')

function findCycles(files, adjacency) {
  const visited = new Set()
  const stack = []
  const onStack = new Set()
  const seenCycles = new Set()
  const cycles = []

  for (const file of files) {
    if (!visited.has(file)) {
      dfs(file)
    }
  }

  return cycles

  function dfs(file) {
    visited.add(file)
    stack.push(file)
    onStack.add(file)

    for (const neighbor of adjacency.get(file) ?? []) {
      if (!visited.has(neighbor)) {
        dfs(neighbor)
        continue
      }

      if (!onStack.has(neighbor)) {
        continue
      }

      const startIndex = stack.indexOf(neighbor)
      const cycle = stack.slice(startIndex)
      const key = canonicalCycleKey(cycle)
      if (!seenCycles.has(key)) {
        seenCycles.add(key)
        cycles.push(cycle)
      }
    }

    stack.pop()
    onStack.delete(file)
  }
}

function canonicalCycleKey(cycle) {
  const rotations = cycle.map((_, index) => [
    ...cycle.slice(index),
    ...cycle.slice(0, index),
  ])
  return rotations
    .map(rotation => rotation.join(' -> '))
    .sort()[0]
}
