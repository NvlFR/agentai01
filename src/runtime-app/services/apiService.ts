import { createTelemetryPipeline } from '../../logging/telemetry.js'

export type ApiTransportResponse = {
  readonly status: number
  readonly body: string
  readonly headers?: Readonly<Record<string, string>>
}

export function createApiService(input: {
  readonly transport: (request: {
    readonly url: string
    readonly method: string
    readonly headers?: Readonly<Record<string, string>>
    readonly body?: string
  }) => Promise<ApiTransportResponse>
  readonly telemetry?: ReturnType<typeof createTelemetryPipeline>
  readonly retries?: number
}) {
  const retries = input.retries ?? 0
  return {
    async request<T>(request: {
      readonly url: string
      readonly method?: string
      readonly headers?: Readonly<Record<string, string>>
      readonly body?: string
      readonly parse: (response: ApiTransportResponse) => T
    }): Promise<T> {
      let attempt = 0
      while (true) {
        try {
          const response = await input.transport({
            url: request.url,
            method: request.method ?? 'GET',
            headers: request.headers,
            body: request.body,
          })
          input.telemetry?.record({ name: 'api.request', level: 'info', attributes: { url: request.url, status: response.status } })
          return request.parse(response)
        } catch (error) {
          if (attempt >= retries) {
            throw error
          }
          attempt += 1
        }
      }
    },
  }
}
