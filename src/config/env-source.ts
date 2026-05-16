export function envSource(
  env: Record<string, string | undefined>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => entry[1] !== undefined),
  )
}
