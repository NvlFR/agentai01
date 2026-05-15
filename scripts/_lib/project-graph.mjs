import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

export const REPO_ROOT = process.cwd()
export const SRC_ROOT = path.join(REPO_ROOT, 'src')

export function toRepoPath(filePath) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join('/')
}

export function fromRepoPath(repoPath) {
  return path.join(REPO_ROOT, ...repoPath.split('/'))
}

export function isTestFile(filePath) {
  return filePath.endsWith('.test.ts')
}

export function isTypeDeclarationFile(filePath) {
  return filePath.endsWith('.d.ts')
}

export function listTypeScriptFiles(rootRelative = 'src', options = {}) {
  const {
    includeTests = true,
    includeDeclarations = false,
  } = options
  const rootPath = path.join(REPO_ROOT, rootRelative)
  const files = []

  walk(rootPath)
  return files.sort()

  function walk(currentPath) {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const absolutePath = path.join(currentPath, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'referensi') {
          continue
        }
        walk(absolutePath)
        continue
      }

      if (!absolutePath.endsWith('.ts')) {
        continue
      }
      if (!includeDeclarations && isTypeDeclarationFile(absolutePath)) {
        continue
      }
      if (!includeTests && isTestFile(absolutePath)) {
        continue
      }

      files.push(toRepoPath(absolutePath))
    }
  }
}

export function buildProjectGraph(options = {}) {
  const files = listTypeScriptFiles('src', {
    includeTests: options.includeTests ?? true,
    includeDeclarations: false,
  })
  const infos = new Map()

  for (const file of files) {
    infos.set(file, analyzeSourceFile(file))
  }

  return {
    files,
    infos,
  }
}

export function analyzeSourceFile(repoFilePath) {
  const absolutePath = fromRepoPath(repoFilePath)
  const sourceText = fs.readFileSync(absolutePath, 'utf8')
  const sourceFile = ts.createSourceFile(
    absolutePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )

  const imports = []
  const exports = []

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      imports.push({
        kind: 'import',
        specifier: statement.moduleSpecifier.text,
        resolved: resolveInternalModule(repoFilePath, statement.moduleSpecifier.text),
        line: lineNumberOf(sourceFile, statement.moduleSpecifier.getStart(sourceFile)),
        importedNames: readImportNames(statement.importClause),
        wildcard: isWildcardImport(statement.importClause),
        typeOnly: Boolean(statement.importClause?.isTypeOnly),
      })
      continue
    }

    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      imports.push({
        kind: 'reexport',
        specifier: statement.moduleSpecifier.text,
        resolved: resolveInternalModule(repoFilePath, statement.moduleSpecifier.text),
        line: lineNumberOf(sourceFile, statement.moduleSpecifier.getStart(sourceFile)),
        importedNames: readExportImportNames(statement.exportClause),
        wildcard: isWildcardReexport(statement.exportClause),
        typeOnly: Boolean(statement.isTypeOnly),
      })
    }

    exports.push(...readStatementExports(statement))
  }

  ts.forEachChild(sourceFile, node => {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      const specifier = node.arguments[0].text
      imports.push({
        kind: 'dynamic-import',
        specifier,
        resolved: resolveInternalModule(repoFilePath, specifier),
        line: lineNumberOf(sourceFile, node.arguments[0].getStart(sourceFile)),
        importedNames: ['*'],
        wildcard: true,
        typeOnly: false,
      })
    }
    ts.forEachChild(node, child => ts.forEachChild(child, () => undefined))
  })

  return {
    imports,
    exports: dedupeStrings(exports),
  }
}

export function lineNumberOf(sourceFile, position) {
  return ts.getLineAndCharacterOfPosition(sourceFile, position).line + 1
}

export function resolveInternalModule(fromRepoPath, specifier) {
  if (!specifier.startsWith('.') && !specifier.startsWith('src/')) {
    return null
  }

  const fromAbsolute = fromRepoPathToAbsolute(fromRepoPath)
  const baseAbsolute = specifier.startsWith('src/')
    ? path.join(REPO_ROOT, specifier)
    : path.resolve(path.dirname(fromAbsolute), specifier)

  for (const candidate of candidateModulePaths(baseAbsolute)) {
    if (!fs.existsSync(candidate)) {
      continue
    }
    const repoPath = toRepoPath(candidate)
    if (!repoPath.startsWith('src/')) {
      continue
    }
    if (isTypeDeclarationFile(candidate)) {
      continue
    }
    return repoPath
  }

  return null
}

export function buildAdjacency(graph, predicate = () => true) {
  const adjacency = new Map()
  for (const file of graph.files) {
    const info = graph.infos.get(file)
    const neighbors = info.imports
      .filter(entry => entry.resolved && predicate(file, entry.resolved, entry))
      .map(entry => entry.resolved)
    adjacency.set(file, dedupeStrings(neighbors))
  }
  return adjacency
}

function fromRepoPathToAbsolute(repoFilePath) {
  return path.join(REPO_ROOT, ...repoFilePath.split('/'))
}

function candidateModulePaths(baseAbsolute) {
  const extensionless = stripModuleExtension(baseAbsolute)
  return dedupeStrings([
    `${extensionless}.ts`,
    `${extensionless}.tsx`,
    path.join(extensionless, 'index.ts'),
    path.join(extensionless, 'index.tsx'),
  ]).map(candidate => candidate.split('/').join(path.sep))
}

function stripModuleExtension(value) {
  return value.replace(/\.(js|mjs|cjs|ts|tsx)$/, '')
}

function readImportNames(importClause) {
  if (!importClause) {
    return []
  }

  const names = []
  if (importClause.name) {
    names.push('default')
  }

  if (!importClause.namedBindings) {
    return names
  }

  if (ts.isNamespaceImport(importClause.namedBindings)) {
    names.push('*')
    return names
  }

  for (const element of importClause.namedBindings.elements) {
    names.push((element.propertyName ?? element.name).text)
  }

  return names
}

function isWildcardImport(importClause) {
  return Boolean(
    importClause?.namedBindings && ts.isNamespaceImport(importClause.namedBindings),
  )
}

function readExportImportNames(exportClause) {
  if (!exportClause) {
    return ['*']
  }

  if (ts.isNamespaceExport(exportClause)) {
    return ['*']
  }

  return exportClause.elements.map(element => (element.propertyName ?? element.name).text)
}

function isWildcardReexport(exportClause) {
  return !exportClause || ts.isNamespaceExport(exportClause)
}

function readStatementExports(statement) {
  const names = []

  if (ts.isExportAssignment(statement)) {
    names.push('default')
    return names
  }

  if (ts.isExportDeclaration(statement) && !statement.moduleSpecifier && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
    for (const element of statement.exportClause.elements) {
      names.push(element.name.text)
    }
    return names
  }

  if (!hasExportModifier(statement)) {
    return names
  }

  if (
    ts.isFunctionDeclaration(statement) ||
    ts.isClassDeclaration(statement) ||
    ts.isInterfaceDeclaration(statement) ||
    ts.isTypeAliasDeclaration(statement) ||
    ts.isEnumDeclaration(statement)
  ) {
    if (statement.name) {
      names.push(statement.name.text)
    }
    return names
  }

  if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      collectBindingNames(declaration.name, names)
    }
  }

  return names
}

function hasExportModifier(node) {
  return Boolean(node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword))
}

function collectBindingNames(name, names) {
  if (ts.isIdentifier(name)) {
    names.push(name.text)
    return
  }

  if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
    for (const element of name.elements) {
      if (ts.isBindingElement(element)) {
        collectBindingNames(element.name, names)
      }
    }
  }
}

function dedupeStrings(values) {
  return [...new Set(values)]
}
