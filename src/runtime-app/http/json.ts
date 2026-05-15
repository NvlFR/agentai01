import { HttpError } from './errors.js'

export type JsonSuccess<T> = {
  ok: true
  correlation_id: string
  data: T
}

export type JsonFailure = {
  ok: false
  correlation_id: string
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export function jsonResponse<T>(
  correlationId: string,
  data: T,
  init?: ResponseInit,
): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      correlation_id: correlationId,
      data,
    } satisfies JsonSuccess<T>),
    {
      status: init?.status ?? 200,
      headers: withJsonHeaders(correlationId, init?.headers),
    },
  )
}

export function jsonErrorResponse(
  correlationId: string,
  error: HttpError,
): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      correlation_id: correlationId,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    } satisfies JsonFailure),
    {
      status: error.status,
      headers: withJsonHeaders(correlationId),
    },
  )
}

export async function readJsonBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new HttpError(400, 'bad_request', 'Request body must be application/json.')
  }

  try {
    return await request.json()
  } catch {
    throw new HttpError(400, 'bad_request', 'Request body is not valid JSON.')
  }
}

function withJsonHeaders(
  correlationId: string,
  headers?: HeadersInit,
): Headers {
  const responseHeaders = new Headers(headers)
  responseHeaders.set('content-type', 'application/json; charset=utf-8')
  responseHeaders.set('x-correlation-id', correlationId)
  return responseHeaders
}
