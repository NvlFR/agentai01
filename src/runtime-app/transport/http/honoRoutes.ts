import { Hono } from 'hono'

export type OperatorTransportSnapshot = {
  ready: boolean
  generated_at: string
}

export function createOperatorMicroApp(snapshot: OperatorTransportSnapshot): Hono {
  const app = new Hono()

  app.get('/health', c => c.json({
    ok: true,
    generated_at: snapshot.generated_at,
  }))

  app.get('/ready', c => c.json({
    ok: snapshot.ready,
    generated_at: snapshot.generated_at,
  }, snapshot.ready ? 200 : 503))

  return app
}
