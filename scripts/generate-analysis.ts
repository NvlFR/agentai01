import * as fs from 'fs'
import * as path from 'path'

const SRC_DIR = 'restored-src/src'
const OUTPUT_FILE = '.kiro/specs/detail-agent/restored-src-analysis-full.md'

function walkDir(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath, fileList)
    } else {
      fileList.push(filePath)
    }
  }
  return fileList
}

function extractFileMeaning(filePath: string): string {
  const name = path.basename(filePath).toLowerCase()
  if (name.includes('test.')) return 'File pengujian (unit/integration test).'
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    
    // Cari JSDoc atau komentar di 20 baris pertama
    let docblock = ''
    let inDoc = false
    for (let i = 0; i < Math.min(lines.length, 30); i++) {
      const line = lines[i].trim()
      if (line.startsWith('/**') || line.startsWith('/*')) inDoc = true
      if (inDoc && !line.includes('eslint') && !line.includes('@ts-')) {
        docblock += line.replace(/\/\*\*|\*\/|\*|\/\//g, '').trim() + ' '
      }
      if (line.endsWith('*/')) {
        inDoc = false
        break
      }
    }
    
    if (docblock.trim().length > 10) {
      return docblock.trim().slice(0, 150) + (docblock.length > 150 ? '...' : '')
    }

    // Jika tidak ada docblock, cari export utama
    const exports: string[] = []
    for (const line of lines) {
      const match = line.match(/export\s+(const|class|function|type|interface)\s+([a-zA-Z0-9_]+)/)
      if (match) {
        exports.push(match[2])
      }
      if (exports.length >= 3) break
    }

    if (exports.length > 0) {
      return `Mengekspor: ${exports.join(', ')}.`
    }

    return 'Berisi logika internal atau utilitas tanpa export utama yang eksplisit.'
  } catch (e) {
    return 'Gagal membaca file.'
  }
}

function generateMarkdown() {
  const allFiles = walkDir(SRC_DIR).sort()
  
  const grouped: Record<string, string[]> = {}
  for (const f of allFiles) {
    const dir = path.dirname(f)
    if (!grouped[dir]) grouped[dir] = []
    grouped[dir].push(f)
  }

  let md = `# Analisis Detail File-per-File (restored-src/src)\n\n`
  md += `Dokumen ini mengurai 1.902 file dengan membaca isi kodenya (mengekstrak JSDoc atau deklarasi export) agar penjelasannya relevan dengan fungsi aslinya.\n\n`
  
  for (const [dir, files] of Object.entries(grouped)) {
    md += `## Direktori: \`${dir}\`\n\n`
    for (const file of files) {
      const basename = path.basename(file)
      const desc = extractFileMeaning(file)
      md += `- **\`${basename}\`**: ${desc}\n`
    }
    md += `\n`
  }

  fs.writeFileSync(OUTPUT_FILE, md, 'utf-8')
  console.log(`Generated ${OUTPUT_FILE} with code-aware descriptions.`)
}

generateMarkdown()
