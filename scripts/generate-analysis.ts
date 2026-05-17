import * as fs from 'fs'
import * as path from 'path'
import ts from 'typescript'

const ROOT_DIR = 'restored-src'
const SOURCE_ROOTS = ['restored-src/src', 'restored-src/vendor']
const OUTPUT_FILE = '.kiro/specs/detail-agent/restored-src-analysis-full.md'
const SOURCE_FILE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
])

type FileSummary = {
  path: string
  dir: string
  description: string
}

function walkDir(dir: string, fileList: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkDir(fullPath, fileList)
      continue
    }
    if (!SOURCE_FILE_EXTENSIONS.has(path.extname(entry.name))) {
      continue
    }
    fileList.push(fullPath)
  }
  return fileList
}

function stripCommentDecorators(text: string): string {
  return text
    .replace(/^\s*\/\*\*?/, '')
    .replace(/\*\/\s*$/, '')
    .replace(/^\s*\/\/\s?/gm, '')
    .replace(/^\s*\*\s?/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanSentence(text: string): string {
  const cleaned = stripCommentDecorators(text).replace(/`/g, "'").trim()
  if (!cleaned) return ''
  const sentence = cleaned.endsWith('.') ? cleaned : `${cleaned}.`
  return sentence.length > 260 ? `${sentence.slice(0, 257).trimEnd()}...` : sentence
}

function getNodeDoc(sourceFile: ts.SourceFile, node: ts.Node): string | undefined {
  const ranges = ts.getLeadingCommentRanges(sourceFile.text, node.getFullStart()) ?? []
  for (const range of ranges) {
    const raw = sourceFile.text.slice(range.pos, range.end)
    if (!raw.startsWith('/**') && !raw.startsWith('/*')) continue
    const cleaned = cleanSentence(raw)
    if (
      cleaned &&
      !cleaned.includes('eslint') &&
      !cleaned.includes('@ts-') &&
      !cleaned.includes('istanbul')
    ) {
      return cleaned
    }
  }
  return undefined
}

function isExported(node: ts.Node): boolean {
  const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined
  return Boolean(modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword))
}

function getExportedNames(sourceFile: ts.SourceFile): string[] {
  const names: string[] = []

  function maybeAdd(name?: string): void {
    if (!name) return
    if (!names.includes(name)) names.push(name)
  }

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      const clause = statement.exportClause
      if (clause && ts.isNamedExports(clause)) {
        for (const element of clause.elements) {
          maybeAdd(element.name.text)
        }
      }
      continue
    }

    if (!isExported(statement)) continue

    if (
      ts.isFunctionDeclaration(statement) ||
      ts.isClassDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isEnumDeclaration(statement)
    ) {
      maybeAdd(statement.name?.text)
      continue
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          maybeAdd(declaration.name.text)
        }
      }
    }
  }

  return names
}

function getPrimaryDoc(sourceFile: ts.SourceFile): string | undefined {
  const fileNameStem = path.basename(sourceFile.fileName).replace(/\.[^.]+$/, '')

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) continue
    if (!isExported(statement)) continue

    let exportedName: string | undefined
    if (
      ts.isFunctionDeclaration(statement) ||
      ts.isClassDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isEnumDeclaration(statement)
    ) {
      exportedName = statement.name?.text
    } else if (ts.isVariableStatement(statement)) {
      const firstDecl = statement.declarationList.declarations[0]
      exportedName = ts.isIdentifier(firstDecl?.name) ? firstDecl.name.text : undefined
    }

    if (
      exportedName &&
      exportedName.toLowerCase() === fileNameStem.toLowerCase().replace(/-/g, '')
    ) {
      const doc = getNodeDoc(sourceFile, statement)
      if (doc) return doc
    }
  }

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) continue
    if (!isExported(statement)) continue
    const doc = getNodeDoc(sourceFile, statement)
    if (doc) return doc
  }

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) continue
    const doc = getNodeDoc(sourceFile, statement)
    if (doc) return doc
  }
  return undefined
}

function relativeFromRoot(filePath: string): string {
  return filePath.replaceAll(path.sep, '/')
}

function inferContext(filePath: string): string | undefined {
  const normalized = relativeFromRoot(filePath)
  const base = path.basename(filePath)
  const dir = path.dirname(normalized)

  if (base === 'index.ts' || base === 'index.tsx' || base === 'index.js' || base === 'index.jsx') {
    if (dir.includes('/commands/')) return 'Entry point command/barrel untuk subfitur command di folder ini'
    if (dir.includes('/cli/handlers')) return 'Barrel/registrasi handler CLI untuk area ini'
    return 'Barrel/entry point yang merapikan export modul di folder ini'
  }

  if (dir.includes('/commands/')) {
    if (base.endsWith('.tsx')) return 'Implementasi command interaktif berbasis Ink/React'
    return 'Implementasi command atau utilitas pendukung command'
  }

  if (dir.includes('/components/')) return 'Komponen UI yang dipakai TUI/React layer'
  if (dir.includes('/bridge/')) return 'Bagian dari sistem remote bridge / remote-control session'
  if (dir.includes('/cli/transports/')) return 'Transport CLI untuk streaming event, reconnect, atau upload state'
  if (dir.includes('/cli/handlers/')) return 'Handler subcommand CLI'
  if (dir.includes('/buddy/')) return 'Fitur companion/buddy UI dan perilakunya'
  if (dir.includes('/vendor/')) return 'Wrapper atau sumber vendor yang di-bundle ke project'
  if (dir.includes('/utils/swarm/')) return 'Utilitas mode swarm/teammate dan orkestrasi backend-nya'
  if (dir.includes('/utils/telemetry/')) return 'Utilitas telemetry, tracing, atau exporter observability'
  if (dir.includes('/utils/settings/')) return 'Utilitas pembacaan, validasi, dan sinkronisasi settings'
  if (dir.includes('/utils/shell/')) return 'Utilitas integrasi shell, prefix, dan validasi command'
  if (dir.includes('/vim/')) return 'Primitif mode Vim: motion, operator, atau text object'
  if (dir.includes('/voice/')) return 'Gate atau helper fitur voice mode'
  return undefined
}

function describeExports(exports: string[]): string {
  if (exports.length === 0) return ''
  const display = exports.slice(0, 4).map(name => `\`${name}\``).join(', ')
  return exports.length > 4
    ? `Export utama: ${display}, dan lainnya.`
    : `Export utama: ${display}.`
}

function inferDeclarationKind(sourceFile: ts.SourceFile): string | undefined {
  const hasJSX =
    sourceFile.fileName.endsWith('.tsx') || sourceFile.fileName.endsWith('.jsx')
  let hasClass = false
  let hasFunction = false
  let hasOnlyTypes = true

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      continue
    }
    if (
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isImportEqualsDeclaration(statement)
    ) {
      continue
    }
    hasOnlyTypes = false
    if (ts.isClassDeclaration(statement)) hasClass = true
    if (ts.isFunctionDeclaration(statement) || ts.isVariableStatement(statement)) hasFunction = true
  }

  if (hasOnlyTypes) return 'Berisi definisi type/interface untuk kontrak modul ini.'
  if (hasJSX) return 'Modul React/Ink yang merender UI atau dialog interaktif.'
  if (hasClass) return 'Mengimplementasikan class utama untuk area fitur ini.'
  if (hasFunction) return 'Berisi fungsi utilitas/operasional yang dipakai modul lain.'
  return undefined
}

function buildSummary(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf8')
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') || filePath.endsWith('.jsx')
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS,
  )

  const primaryDoc = getPrimaryDoc(sourceFile)
  const exports = getExportedNames(sourceFile)
  const context = inferContext(filePath)
  const declKind = inferDeclarationKind(sourceFile)
  const exportSentence = describeExports(exports)

  const parts = [primaryDoc, context && `${context}.`, declKind, exportSentence].filter(
    Boolean,
  ) as string[]

  const uniqueParts: string[] = []
  for (const part of parts) {
    if (!uniqueParts.includes(part)) uniqueParts.push(part)
  }

  const sentence = uniqueParts.join(' ')
  return sentence || 'Berisi logika internal tanpa deklarasi publik yang menonjol.'
}

function generateMarkdown(): string {
  const allFiles = SOURCE_ROOTS.flatMap(root => walkDir(root)).sort()
  const grouped = new Map<string, FileSummary[]>()

  for (const filePath of allFiles) {
    const relativePath = relativeFromRoot(filePath)
    const dir = relativeFromRoot(path.dirname(filePath))
    const summary: FileSummary = {
      path: relativePath,
      dir,
      description: buildSummary(filePath),
    }
    const group = grouped.get(dir) ?? []
    group.push(summary)
    grouped.set(dir, group)
  }

  const lines: string[] = []
  lines.push('# Analisis Detail File-per-File (`restored-src`)')
  lines.push('')
  lines.push(
    `Dokumen ini dibuat ulang langsung dari source di \`${ROOT_DIR}/\` dengan parser TypeScript, lalu diringkas file per file supaya penjelasan lebih akurat daripada ekstraksi komentar mentah.`,
  )
  lines.push('')
  lines.push(`Total file source yang dipetakan: **${allFiles.length}**.`)
  lines.push('')

  for (const [dir, files] of grouped.entries()) {
    lines.push(`## Direktori: \`${dir}\``)
    lines.push('')
    for (const file of files) {
      const base = path.basename(file.path)
      lines.push(`- **\`${base}\`** (\`${file.path}\`): ${file.description}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

const markdown = generateMarkdown()
fs.writeFileSync(OUTPUT_FILE, markdown, 'utf8')
console.log(`Generated ${OUTPUT_FILE}`)
