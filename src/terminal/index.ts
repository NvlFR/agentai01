export type AnsiStyle =
  | 'bold'
  | 'dim'
  | 'italic'
  | 'underline'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'gray'

export type ProgressBarOptions = {
  current: number
  total: number
  width?: number
  label?: string
  complete?: string
  incomplete?: string
}

const ANSI_CSI_REGEX = new RegExp('\\x1b\\[[\\x20-\\x3f]*[\\x40-\\x7e]', 'g')
const ANSI_OSC_REGEX = new RegExp('\\x1b\\][^\\x07\\x1b]*(?:\\x1b\\\\|\\x07)', 'g')
const CONTROL_REGEX = new RegExp(
  `[${String.fromCharCode(0x00)}-${String.fromCharCode(0x1f)}${String.fromCharCode(0x7f)}]`,
  'g',
)

const ANSI_CODES: Record<AnsiStyle, [open: number, close: number]> = {
  bold: [1, 22],
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  gray: [90, 39],
}

export function ansi(style: AnsiStyle, value: string, enabled = true): string {
  if (!enabled) {
    return value
  }

  const [open, close] = ANSI_CODES[style]
  return `\u001b[${open}m${value}\u001b[${close}m`
}

export function stripAnsi(value: string): string {
  return value.replace(ANSI_OSC_REGEX, '').replace(ANSI_CSI_REGEX, '')
}

export function sanitizeTerminalText(value: string): string {
  return stripAnsi(value).replace(CONTROL_REGEX, '')
}

export function visibleWidth(value: string): number {
  let width = 0
  for (const char of Array.from(stripAnsi(value))) {
    const codePoint = char.codePointAt(0)
    if (codePoint === undefined || isZeroWidthCodePoint(codePoint)) {
      continue
    }
    width += isFullWidthCodePoint(codePoint) || isEmojiLike(char) ? 2 : 1
  }
  return width
}

export function terminalWidth(fallback = 80, columns = process.stdout.columns): number {
  return Number.isInteger(columns) && columns > 0 ? columns : fallback
}

export function padVisibleEnd(value: string, width: number, fill = ' '): string {
  const missing = Math.max(0, width - visibleWidth(value))
  return `${value}${fill.repeat(missing)}`
}

export function truncateVisible(value: string, width: number, ellipsis = '...'): string {
  if (visibleWidth(value) <= width) {
    return value
  }

  if (width <= visibleWidth(ellipsis)) {
    return ellipsis.slice(0, Math.max(0, width))
  }

  let output = ''
  for (const char of Array.from(stripAnsi(value))) {
    if (visibleWidth(`${output}${char}${ellipsis}`) > width) {
      break
    }
    output += char
  }
  return `${output}${ellipsis}`
}

export function renderProgressBar(options: ProgressBarOptions): string {
  const total = Math.max(1, options.total)
  const current = Math.min(Math.max(0, options.current), total)
  const width = Math.max(1, Math.trunc(options.width ?? 20))
  const filled = Math.round((current / total) * width)
  const complete = options.complete ?? '#'
  const incomplete = options.incomplete ?? '-'
  const percent = Math.round((current / total) * 100)
  const label = options.label ? `${options.label} ` : ''

  return `${label}[${complete.repeat(filled)}${incomplete.repeat(width - filled)}] ${percent}%`
}

function isZeroWidthCodePoint(codePoint: number): boolean {
  return (
    (codePoint >= 0x0300 && codePoint <= 0x036f) ||
    (codePoint >= 0xfe00 && codePoint <= 0xfe0f) ||
    codePoint === 0x200d
  )
}

function isFullWidthCodePoint(codePoint: number): boolean {
  return (
    codePoint >= 0x1100 &&
    (codePoint <= 0x115f ||
      codePoint === 0x2329 ||
      codePoint === 0x232a ||
      (codePoint >= 0x2e80 && codePoint <= 0xa4cf) ||
      (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
      (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
      (codePoint >= 0xfe10 && codePoint <= 0xfe6b) ||
      (codePoint >= 0xff01 && codePoint <= 0xffe6))
  )
}

function isEmojiLike(value: string): boolean {
  return /\p{Extended_Pictographic}/u.test(value)
}
