import { describe, expect, it } from 'bun:test'

import {
  authenticateGatewayRequest,
  createGatewayHealthResponse,
  validateGatewayRequest,
} from './index.js'

describe('gateway', () => {
  it('validates protocol messages before use', () => {
    expect(validateGatewayRequest({
      id: 'req-1',
      protocol: 'websocket',
      kind: 'operator_message',
      payload: { text: 'hello' },
    }, () => new Date('2026-05-16T00:00:00.000Z'))).toEqual({
      ok: true,
      value: {
        id: 'req-1',
        protocol: 'websocket',
        kind: 'operator_message',
        payload: { text: 'hello' },
        receivedAt: '2026-05-16T00:00:00.000Z',
      },
    })

    expect(validateGatewayRequest({ protocol: 'ftp', kind: 'unknown' })).toEqual({
      ok: false,
      error: [
        'Gateway request field "id" is required.',
        'Gateway request field "protocol" is invalid.',
        'Gateway request field "kind" is invalid.',
      ],
    })
  })

  it('authenticates operator-token contracts', () => {
    expect(authenticateGatewayRequest({ mode: 'operator_token', operatorToken: 'secret' }, 'secret')).toEqual({
      ok: true,
      value: 'authenticated',
    })
    expect(authenticateGatewayRequest({ mode: 'operator_token', operatorToken: 'secret' }, 'wrong')).toEqual({
      ok: false,
      error: 'invalid_token',
    })
  })

  it('reports readiness from dependency health', () => {
    expect(createGatewayHealthResponse({
      service: 'runtime-gateway',
      dependencies: [{ name: 'provider', healthy: false }],
      now: () => new Date('2026-05-16T00:00:00.000Z'),
    })).toEqual({
      service: 'runtime-gateway',
      status: 'not_ready',
      checkedAt: '2026-05-16T00:00:00.000Z',
      dependencies: [{ name: 'provider', healthy: false }],
    })
  })
})
