import { err, ok, type Result } from '../shared/index.js'

export type TextPromptOptions = {
  message: string
  defaultValue?: string
  validate?: InputValidator<string>
}

export type ConfirmPromptOptions = {
  message: string
  defaultValue?: boolean
}

export type MenuOption<T extends string = string> = {
  value: T
  label: string
  disabled?: boolean
}

export type MenuPromptOptions<T extends string = string> = {
  message: string
  options: ReadonlyArray<MenuOption<T>>
}

export type InputValidator<T> = (value: T) => Result<T, string>
export type PromptReader = (message: string) => Promise<string>

export function required(message = 'Value is required.'): InputValidator<string> {
  return value => (value.trim().length > 0 ? ok(value) : err(message))
}

export function oneOf<T extends string>(
  values: readonly T[],
  message = 'Value is not allowed.',
): InputValidator<T> {
  return value => (values.includes(value) ? ok(value) : err(message))
}

export async function promptText(
  options: TextPromptOptions,
  reader: PromptReader,
): Promise<Result<string, string>> {
  const rawValue = await reader(options.message)
  const value = rawValue.length > 0 ? rawValue : options.defaultValue ?? ''
  return options.validate ? options.validate(value) : ok(value)
}

export function parseConfirmation(input: string, defaultValue?: boolean): Result<boolean, string> {
  const normalized = input.trim().toLowerCase()
  if (normalized.length === 0 && defaultValue !== undefined) {
    return ok(defaultValue)
  }

  if (['y', 'yes', 'true', '1'].includes(normalized)) {
    return ok(true)
  }

  if (['n', 'no', 'false', '0'].includes(normalized)) {
    return ok(false)
  }

  return err('Please answer yes or no.')
}

export async function confirm(
  options: ConfirmPromptOptions,
  reader: PromptReader,
): Promise<Result<boolean, string>> {
  return parseConfirmation(await reader(options.message), options.defaultValue)
}

export function parseMenuSelection<T extends string>(
  input: string,
  options: ReadonlyArray<MenuOption<T>>,
): Result<T, string> {
  const normalized = input.trim()
  const byValue = options.find(option => option.value === normalized)
  const index = Number.parseInt(normalized, 10)
  const byIndex = Number.isInteger(index) ? options[index - 1] : undefined
  const selected = byValue ?? byIndex

  if (!selected) {
    return err('Selection is not available.')
  }

  if (selected.disabled === true) {
    return err('Selection is disabled.')
  }

  return ok(selected.value)
}

export async function menu<T extends string>(
  options: MenuPromptOptions<T>,
  reader: PromptReader,
): Promise<Result<T, string>> {
  return parseMenuSelection(await reader(options.message), options.options)
}
