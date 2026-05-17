import dotenv from 'dotenv'

export type DotenvLoadResult = {
  loadedKeys: string[]
  parsed: Record<string, string>
}

export function loadDotenvIntoEnv(input: {
  content: string
  env?: Record<string, string | undefined>
  override?: boolean
}): DotenvLoadResult {
  const env = input.env ?? process.env
  const parsed = dotenv.parse(input.content)
  const loadedKeys: string[] = []

  for (const [key, value] of Object.entries(parsed)) {
    if (input.override === true || env[key] === undefined) {
      env[key] = value
      loadedKeys.push(key)
    }
  }

  return {
    loadedKeys,
    parsed,
  }
}
