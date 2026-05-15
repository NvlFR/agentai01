import { generateCorrelationId } from '../../shared/index.js'

export function getCorrelationId(request: Request): string {
  return request.headers.get('x-correlation-id')?.trim() || generateCorrelationId('req')
}

export function getUrlPath(request: Request): string {
  return new URL(request.url).pathname.replace(/\/+$/, '') || '/'
}
