import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'

export type HttpClientError = {
  code: 'http_error'
  message: string
  status?: number
  retryable: boolean
}

export type HttpClientResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: HttpClientError }

export function createAxiosHttpClient(config: AxiosRequestConfig = {}): AxiosInstance {
  return axios.create(config)
}

export async function requestJson<T>(
  client: AxiosInstance,
  config: AxiosRequestConfig,
): Promise<HttpClientResult<T>> {
  try {
    const response = await client.request<T>(config)
    return {
      ok: true,
      data: response.data,
      status: response.status,
    }
  } catch (error) {
    return {
      ok: false,
      error: normalizeAxiosError(error),
    }
  }
}

export function normalizeAxiosError(error: unknown): HttpClientError {
  if (error instanceof AxiosError) {
    const status = error.response?.status
    return {
      code: 'http_error',
      message: error.message,
      status,
      retryable: status === undefined || status >= 500 || status === 429,
    }
  }

  return {
    code: 'http_error',
    message: error instanceof Error ? error.message : 'Unknown HTTP client error',
    retryable: true,
  }
}
