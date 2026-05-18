# Installation And Setup

Dokumen ini adalah panduan setup lokal untuk developer dan operator.

## Requirements

- Bun `1.3.x`
- Node.js `20+`
- `npm`
- Provider AI yang kompatibel dengan OpenAI-style API

## Install

```bash
npm install
```

## Environment Minimum

Project ini membaca konfigurasi runtime dari environment variable.

```bash
export AI_BASE_URL=http://127.0.0.1:8045/v1
export AI_API_KEY=your-key
export AI_MODEL=gemini-3-flash
```

## Environment Yang Didukung

### Runtime App

- `NODE_ENV`
- `APP_HOST`
- `APP_PORT`
- `APP_BASE_URL`
- `RUNTIME_ID`

### Provider AI

- `AI_BASE_URL`
- `AI_API_KEY`
- `AI_MODEL`
- `AI_TIMEOUT_MS`
- `AI_RETRY_LIMIT`
- `AI_LOG_LATENCY`

### Storage

- `STORAGE_ARTIFACTS_ROOT`
- `RUNTIME_ARTIFACT_ROOT`
- `RUNTIME_OPERATIONAL_ROOT`

### Queue

- `QUEUE_CONCURRENCY`
- `QUEUE_RETRY_LIMIT`

### Telegram

- `TOKEN_TELE`
- `TELEGRAM_BOT_TOKEN`
- `ID_CHAT`
- `TELEGRAM_ALLOWED_CHAT_IDS`

## Menjalankan Service

### Runtime App HTTP

```bash
npm run runtime:app
```

### Worker

```bash
npm run runtime:worker
```

### Scheduler

```bash
npm run runtime:scheduler
```

### Terminal UI

```bash
npm run runtime:tui
```

### Telegram Runner

```bash
npm run runtime:telegram
```

## Validasi Lokal

```bash
npm run check
bun test
npm run runtime:smoke
```

## Readiness

Runtime akan menandai dirinya siap bila dependency minimum tersedia. Cek dengan:

```bash
curl http://127.0.0.1:3000/ready
```

Jika `ready=false`, lihat daftar `reasons` dan `checklist` pada response.
