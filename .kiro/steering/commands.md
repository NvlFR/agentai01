---
inclusion: always
---

# Commands

## Development

```bash
npm install                  # install dependencies
npm run dev                  # dev server dengan watch mode (port 3000)
npm run runtime:app          # jalankan HTTP app tanpa watch mode
npm run runtime:worker       # jalankan worker loop terpisah
npm run runtime:scheduler    # jalankan scheduler loop terpisah
npm run runtime:telegram     # jalankan Telegram bot polling
```

## Validation

```bash
npm run check                # TypeScript typecheck — wajib hijau sebelum push
bun test                     # unit tests
npm run runtime:smoke        # smoke test end-to-end dengan provider nyata
```

## Build

```bash
npm run build                # compile TypeScript ke output
```

## Aturan Validation

- Selalu jalankan `npm run check` sebelum push atau handoff.
- Selalu jalankan `bun test` setelah perubahan logic.
- Untuk perubahan provider, auth, atau secrets: jalankan `npm run runtime:smoke` juga.
- Jangan landing kode dengan failing typecheck, test, atau smoke.
- Kalau proof terblokir, jelaskan apa yang missing dan kenapa.

## Health Endpoints

```
GET /health     # health snapshot runtime
GET /ready      # readiness check — 503 kalau AI_API_KEY belum ada
GET /api/snapshot  # payload agregat untuk operator UI
```
