# Telegram And Channels

Project ini punya surface channel untuk Telegram dan WhatsApp di runtime-app.

## Telegram Setup

Environment yang umum dipakai:

- `TOKEN_TELE`
- `TELEGRAM_BOT_TOKEN`
- `ID_CHAT`
- `TELEGRAM_ALLOWED_CHAT_IDS`

Minimal, siapkan bot token dan chat id.

## Menjalankan Runner

```bash
npm run runtime:telegram
```

## Endpoint Telegram

- `GET /api/telegram/status`
- `POST /api/telegram/send`
- `POST /api/telegram/webhook` — requires signed webhook headers before mutating runtime

## Pola Penggunaan

- operator mengirim laporan atau dokumen ke chat tertentu
- bot menerima webhook event
- runtime memvalidasi ketersediaan token dan target chat

## WhatsApp Surface

Endpoint yang tersedia:

- `GET /api/whatsapp/status`
- `POST /api/whatsapp/send`
- `POST /api/whatsapp/webhook`

## Catatan Penting

- Channel integration sebaiknya diproteksi oleh env dan network boundary yang ketat.
- Jangan commit token bot atau chat id sensitif ke repo.
- Sebelum produksi, review lagi jalur webhook, auth, rate limit, dan logging payload.
- Webhook endpoints (`/api/telegram/webhook`, `/api/whatsapp/webhook`) require `x-agentai-event-id`, `x-agentai-timestamp`, and `x-agentai-signature`.
- Signature format is HMAC-SHA256 over `<timestamp>.<raw-body>` using `TELEGRAM_WEBHOOK_SECRET` or `WHATSAPP_WEBHOOK_SECRET`.
- Missing secrets fail closed; failed verification cannot submit directives.
