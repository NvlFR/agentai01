import { padVisibleEnd, truncateVisible, visibleWidth } from '../terminal/index.js'

export type Rect = {
  x: number
  y: number
  width: number
  height: number
}

export type LayoutDirection = 'row' | 'column'

export type LayoutChild = {
  id: string
  size?: number
  minSize?: number
}

export type TextComponent = {
  kind: 'text'
  text: string
}

export type ListComponent = {
  kind: 'list'
  items: readonly string[]
  selectedIndex?: number
}

export type BoxComponent = {
  kind: 'box'
  title?: string
  child: TuiComponent
}

export type TuiComponent = TextComponent | ListComponent | BoxComponent

export type TextInputState = {
  value: string
  cursor: number
}

export type KeyInput =
  | { key: 'character'; value: string }
  | { key: 'backspace' }
  | { key: 'delete' }
  | { key: 'left' }
  | { key: 'right' }
  | { key: 'home' }
  | { key: 'end' }

export function splitLayout(rect: Rect, direction: LayoutDirection, children: readonly LayoutChild[]): Record<string, Rect> {
  const output: Record<string, Rect> = {}
  const available = direction === 'row' ? rect.width : rect.height
  const fixed = children.reduce((sum, child) => sum + (child.size ?? 0), 0)
  const flexible = children.filter(child => child.size === undefined)
  const flexibleSize = flexible.length > 0 ? Math.max(0, Math.floor((available - fixed) / flexible.length)) : 0
  let offset = 0

  for (const child of children) {
    const rawSize = child.size ?? flexibleSize
    const size = Math.max(child.minSize ?? 0, rawSize)
    output[child.id] =
      direction === 'row'
        ? { x: rect.x + offset, y: rect.y, width: size, height: rect.height }
        : { x: rect.x, y: rect.y + offset, width: rect.width, height: size }
    offset += size
  }

  return output
}

export function renderComponent(component: TuiComponent, width: number): string {
  if (component.kind === 'text') {
    return wrapLines(component.text, width).join('\n')
  }

  if (component.kind === 'list') {
    return component.items
      .map((item, index) => {
        const marker = index === component.selectedIndex ? '>' : ' '
        return truncateVisible(`${marker} ${item}`, width)
      })
      .join('\n')
  }

  return renderBox(renderComponent(component.child, Math.max(1, width - 4)), {
    width,
    title: component.title,
  })
}

export function renderBox(content: string, options: { width: number; title?: string }): string {
  const width = Math.max(4, options.width)
  const title = options.title ? ` ${truncateVisible(options.title, width - 4)} ` : ''
  const top = `+${padVisibleEnd(title, width - 2, '-')}+`
  const lines = content.length > 0 ? content.split('\n') : ['']
  const body = lines
    .map(line => `| ${padVisibleEnd(truncateVisible(line, width - 4), width - 4)} |`)
    .join('\n')
  const bottom = `+${'-'.repeat(width - 2)}+`

  return `${top}\n${body}\n${bottom}`
}

export function handleTextInput(state: TextInputState, input: KeyInput): TextInputState {
  if (input.key === 'character') {
    const nextValue = `${state.value.slice(0, state.cursor)}${input.value}${state.value.slice(state.cursor)}`
    return { value: nextValue, cursor: state.cursor + input.value.length }
  }

  if (input.key === 'backspace' && state.cursor > 0) {
    return {
      value: `${state.value.slice(0, state.cursor - 1)}${state.value.slice(state.cursor)}`,
      cursor: state.cursor - 1,
    }
  }

  if (input.key === 'delete') {
    return {
      value: `${state.value.slice(0, state.cursor)}${state.value.slice(state.cursor + 1)}`,
      cursor: state.cursor,
    }
  }

  if (input.key === 'left') {
    return { ...state, cursor: Math.max(0, state.cursor - 1) }
  }

  if (input.key === 'right') {
    return { ...state, cursor: Math.min(state.value.length, state.cursor + 1) }
  }

  if (input.key === 'home') {
    return { ...state, cursor: 0 }
  }

  if (input.key === 'end') {
    return { ...state, cursor: state.value.length }
  }

  return state
}

function wrapLines(value: string, width: number): string[] {
  const targetWidth = Math.max(1, width)
  const lines: string[] = []
  for (const line of value.split('\n')) {
    let current = ''
    for (const word of line.split(/\s+/)) {
      const next = current.length === 0 ? word : `${current} ${word}`
      if (visibleWidth(next) > targetWidth && current.length > 0) {
        lines.push(current)
        current = word
      } else {
        current = next
      }
    }
    lines.push(truncateVisible(current, targetWidth))
  }
  return lines
}
