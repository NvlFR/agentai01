import express, { type Express } from 'express'

import { createOperatorMicroApp, type OperatorTransportSnapshot } from './honoRoutes.js'

export function createOperatorExpressApp(snapshot: OperatorTransportSnapshot): Express {
  const app = express()
  const micro = createOperatorMicroApp(snapshot)

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      generated_at: snapshot.generated_at,
      server: 'express',
    })
  })

  app.use('/micro', async (req, res) => {
    const microPath = req.originalUrl.startsWith('/micro')
      ? req.originalUrl.slice('/micro'.length) || '/'
      : req.originalUrl
    const url = new URL(microPath, 'http://127.0.0.1')
    const request = new Request(url.toString(), {
      method: req.method,
      headers: new Headers(Object.entries(req.headers).flatMap(([key, value]) => toHeaderEntries(key, value))),
    })
    const response = await micro.fetch(request)
    res.status(response.status)
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })
    res.send(await response.text())
  })

  return app
}

function toHeaderEntries(
  key: string,
  value: string | string[] | undefined,
): Array<[string, string]> {
  if (Array.isArray(value)) {
    return value.map(entry => [key, entry])
  }

  return typeof value === 'string' ? [[key, value]] : []
}
