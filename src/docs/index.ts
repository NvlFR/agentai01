import { err, ok, type Result } from '../shared/index.js'

export type DocPage = {
  id: string
  title: string
  body: string
  tags?: readonly string[]
}

export type ApiSymbol = {
  kind: 'type' | 'function' | 'const' | 'class'
  name: string
}

export function validateDocPage(input: DocPage): Result<DocPage, string[]> {
  const errors: string[] = []
  if (!input.id.trim()) {
    errors.push('Doc page id is required.')
  }
  if (!input.title.trim()) {
    errors.push('Doc page title is required.')
  }
  if (!input.body.trim()) {
    errors.push('Doc page body is required.')
  }

  return errors.length > 0 ? err(errors) : ok(input)
}

export function generateMarkdownToc(pages: readonly DocPage[]): string {
  return pages.map(page => `- [${page.title}](#${slugify(page.title)})`).join('\n')
}

export function extractApiSymbols(source: string): ApiSymbol[] {
  const pattern = /^export\s+(type|function|const|class)\s+([A-Za-z_$][\w$]*)/gm
  const symbols: ApiSymbol[] = []
  for (const match of source.matchAll(pattern)) {
    const kind = match[1]
    const name = match[2]
    if (isApiKind(kind) && name) {
      symbols.push({ kind, name })
    }
  }
  return symbols
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function isApiKind(value: string | undefined): value is ApiSymbol['kind'] {
  return value === 'type' || value === 'function' || value === 'const' || value === 'class'
}
