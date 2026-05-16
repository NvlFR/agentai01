export type LocaleMessages = Record<string, string>

export type I18nCatalog = {
  defaultLocale: string
  locales: Record<string, LocaleMessages>
}

export function detectLocale(input: readonly string[], supported: readonly string[], fallback: string): string {
  for (const locale of input) {
    const normalized = locale.toLowerCase()
    const exact = supported.find(candidate => candidate.toLowerCase() === normalized)
    if (exact) {
      return exact
    }

    const language = normalized.split('-')[0]
    const languageMatch = supported.find(candidate => candidate.toLowerCase().split('-')[0] === language)
    if (languageMatch) {
      return languageMatch
    }
  }

  return fallback
}

export function translate(catalog: I18nCatalog, locale: string, key: string, params: Record<string, string> = {}): string {
  const template = catalog.locales[locale]?.[key] ?? catalog.locales[catalog.defaultLocale]?.[key] ?? key
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (_match, param: string) => params[param] ?? '')
}

export function mergeMessages(base: LocaleMessages, override: LocaleMessages): LocaleMessages {
  return { ...base, ...override }
}
