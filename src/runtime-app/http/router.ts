export type RouteMatch = {
  params: Record<string, string>
}

export function matchRoute(
  pathname: string,
  pattern: string,
): RouteMatch | undefined {
  const actual = tokenize(pathname)
  const expected = tokenize(pattern)

  if (actual.length !== expected.length) {
    return undefined
  }

  const params: Record<string, string> = {}

  for (let index = 0; index < expected.length; index += 1) {
    const expectedPart = expected[index]!
    const actualPart = actual[index]!

    if (expectedPart.startsWith(':')) {
      params[expectedPart.slice(1)] = decodeURIComponent(actualPart)
      continue
    }

    if (expectedPart !== actualPart) {
      return undefined
    }
  }

  return { params }
}

function tokenize(value: string): string[] {
  return value.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
}
