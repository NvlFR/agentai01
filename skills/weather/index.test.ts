import { describe, expect, it } from 'bun:test'
import { execute } from './index.mjs'

function createResponse(body: string, init: { ok?: boolean; status?: number } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    async text() {
      return body
    },
  }
}

describe('weather skill', () => {
  it('fetches a brief wttr.in response with encoded location and metric units', async () => {
    const calls: Array<{ url: string; accept: string | null }> = []
    const fetchMock = async (url: string, init: { headers?: { Accept?: string } }) => {
      calls.push({ url, accept: init.headers?.Accept ?? null })
      return createResponse('Jakarta: cloudy +30C')
    }

    await expect(
      execute({ location: 'New York', format: 'brief' }, { fetch: fetchMock }),
    ).resolves.toEqual({
      location: 'New York',
      format: 'brief',
      unitSystem: 'metric',
      sourceUrl:
        'https://wttr.in/New+York?format=%l:+%c+%t+(feels+like+%f),+%w+wind,+%h+humidity,+%p+precipitation&m',
      text: 'Jakarta: cloudy +30C',
    })

    expect(calls).toEqual([
      {
        url:
          'https://wttr.in/New+York?format=%l:+%c+%t+(feels+like+%f),+%w+wind,+%h+humidity,+%p+precipitation&m',
        accept: 'text/plain',
      },
    ])
  })

  it('parses JSON weather output when requested', async () => {
    const fetchMock = async () =>
      createResponse('{"current_condition":[{"temp_C":"30"}],"weather":[]}')

    await expect(
      execute({ location: 'ORD', format: 'json', unitSystem: 'us' }, { fetch: fetchMock }),
    ).resolves.toEqual({
      location: 'ORD',
      format: 'json',
      unitSystem: 'us',
      sourceUrl: 'https://wttr.in/ORD?format=j1&u',
      text: '{"current_condition":[{"temp_C":"30"}],"weather":[]}',
      data: {
        current_condition: [{ temp_C: '30' }],
        weather: [],
      },
    })
  })

  it('fails on upstream HTTP errors', async () => {
    const fetchMock = async () => createResponse('rate limited', { ok: false, status: 429 })

    await expect(execute({ location: 'London' }, { fetch: fetchMock })).rejects.toThrow(
      'wttr.in returned HTTP 429',
    )
  })

  it('fails when JSON output is malformed', async () => {
    const fetchMock = async () => createResponse('not json')

    await expect(execute({ location: 'London', format: 'json' }, { fetch: fetchMock })).rejects.toThrow(
      'wttr.in JSON response could not be parsed',
    )
  })
})
