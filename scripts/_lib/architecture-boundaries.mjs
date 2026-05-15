import { buildProjectGraph } from './project-graph.mjs'

export function collectArchitectureViolations(options = {}) {
  const violations = []
  const graph = buildProjectGraph({
    includeTests: options.includeTests ?? false,
  })

  for (const file of graph.files) {
    const info = graph.infos.get(file)
    for (const entry of info.imports) {
      if (!entry.resolved) {
        continue
      }

      const violation = classifyArchitectureViolation(file, entry)
      if (violation) {
        violations.push(violation)
      }
    }
  }

  return violations
}

export function classifyArchitectureViolation(file, entry) {
  return (
    checkAgentIsolation(file, entry) ??
    checkProviderIsolation(file, entry) ??
    checkFoundationIsolation(file, entry)
  )
}

export function formatArchitectureViolation(violation) {
  return `${violation.file}:${violation.line} ${violation.rule} -> ${violation.importPath}`
}

function checkAgentIsolation(file, entry) {
  const importer = matchAgent(file)
  const imported = matchAgent(entry.resolved)
  if (!importer || !imported || importer === imported) {
    return null
  }

  return {
    file,
    line: entry.line,
    rule: 'agent-cross-import',
    importPath: entry.specifier,
    importer,
    imported,
  }
}

function checkProviderIsolation(file, entry) {
  if (!file.startsWith('src/runtime-app/providers/')) {
    return null
  }
  if (!entry.resolved.startsWith('src/agents/')) {
    return null
  }

  return {
    file,
    line: entry.line,
    rule: 'provider-imports-agent-internal',
    importPath: entry.specifier,
  }
}

function checkFoundationIsolation(file, entry) {
  if (
    !file.startsWith('src/security/') &&
    !file.startsWith('src/shared/') &&
    !file.startsWith('src/secrets/')
  ) {
    return null
  }

  if (
    entry.resolved.startsWith('src/agents/') ||
    entry.resolved.startsWith('src/runtime-app/')
  ) {
    return {
      file,
      line: entry.line,
      rule: 'foundation-imports-business-logic',
      importPath: entry.specifier,
    }
  }

  return null
}

function matchAgent(file) {
  const match = file.match(/^src\/agents\/([^/]+)\//)
  return match?.[1] ?? null
}
