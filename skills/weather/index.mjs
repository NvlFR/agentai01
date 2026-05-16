const FORMAT_QUERY = {
  brief: 'format=%l:+%c+%t+(feels+like+%f),+%w+wind,+%h+humidity,+%p+precipitation',
  current: '0',
  forecast: '',
  json: 'format=j1',
}

const UNIT_QUERY = {
  metric: 'm',
  us: 'u',
}

export async function execute(input, context = {}) {
  const location = input.location.trim()
  const format = input.format ?? 'brief'
  const unitSystem = input.unitSystem ?? 'metric'
  const timeoutMs = input.timeoutMs ?? 10000
  const sourceUrl = buildWeatherUrl(location, format, unitSystem)
  const fetchImpl = context.fetch ?? globalThis.fetch

  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is not available in this runtime')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  let response
  try {
    response = await fetchImpl(sourceUrl, {
      headers: { Accept: format === 'json' ? 'application/json' : 'text/plain' },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    throw new Error(`wttr.in returned HTTP ${response.status}`)
  }

  const text = (await response.text()).trim()
  if (text.length === 0) {
    throw new Error('wttr.in returned an empty response')
  }

  const output = {
    location,
    format,
    unitSystem,
    sourceUrl,
    text,
  }

  if (format === 'json') {
    output.data = parseWeatherJson(text)
  }

  return output
}

function buildWeatherUrl(location, format, unitSystem) {
  const encodedLocation = encodeURIComponent(location).replaceAll('%20', '+')
  const queryParts = [FORMAT_QUERY[format], UNIT_QUERY[unitSystem]].filter(part => part.length > 0)
  const query = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
  return `https://wttr.in/${encodedLocation}${query}`
}

function parseWeatherJson(text) {
  try {
    const parsed = JSON.parse(text)
    if (!isJsonObject(parsed)) {
      throw new Error('top-level response is not an object')
    }
    return parsed
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown parse error'
    throw new Error(`wttr.in JSON response could not be parsed: ${message}`)
  }
}

function isJsonObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
