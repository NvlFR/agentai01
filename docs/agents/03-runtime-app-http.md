# Runtime App HTTP

Runtime app menyediakan HTTP API untuk operator, dashboard, approvals, jobs, messages, channel bridge, dan wizard agent.

## Start Server

```bash
npm run runtime:app
```

Default host dan port:

- `127.0.0.1`
- `3000`

## Health Endpoints

- `GET /`
- `GET /health`
- `GET /ready`

## Observability Endpoints

- `GET /api/snapshot`
- `GET /api/dashboard`
- `GET /api/projects`
- `GET /api/projects/:projectId`
- `GET /api/approvals`
- `GET /api/runtime/jobs`
- `GET /api/messages`
- `GET /api/audit`
- `GET /api/extensions`
- `GET /api/skills`

## Directive And Chat Endpoints

- `POST /api/directives`
- `POST /api/chat`

Contoh directive:

```bash
curl -X POST http://127.0.0.1:3000/api/directives \
  -H 'content-type: application/json' \
  -d '{
    "owner": "operator",
    "directive": "Buat ringkasan status runtime hari ini",
    "mode": "natural"
  }'
```

## Approval And Retry Endpoints

- `POST /api/approvals/:requestId/respond`
- `POST /api/jobs/:jobId/retry`
- `POST /api/messages/:logId/retry`

## Agent Wizard Endpoints

- `GET /api/agents/wizard/schema`
- `POST /api/agents/wizard/generate`
- `POST /api/agents/wizard/validate`
- `POST /api/agents/wizard/save`
- `GET /api/agents/drafts?location=project|runtime|user`

Contoh generate draft:

```bash
curl -X POST http://127.0.0.1:3000/api/agents/wizard/generate \
  -H 'content-type: application/json' \
  -d '{
    "brief": "Buat agent untuk merangkum insiden engineering",
    "location": "project"
  }'
```

## Channel Endpoints

### Telegram

- `GET /api/telegram/status`
- `POST /api/telegram/send`
- `POST /api/telegram/webhook`

### WhatsApp

- `GET /api/whatsapp/status`
- `POST /api/whatsapp/send`
- `POST /api/whatsapp/webhook`

## Catatan Operasional

- `GET /ready` adalah endpoint terbaik untuk health operasional, bukan hanya liveness.
- Simpan token dan key di env, jangan di payload contoh permanen.
- Beberapa jalur channel saat ini cocok untuk integrasi internal dan pengujian runtime, bukan public exposure tanpa hardening tambahan.
