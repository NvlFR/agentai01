# Troubleshooting

Dokumen ini merangkum masalah yang paling mungkin ditemui saat setup dan operasi lokal.

## `GET /ready` Menunjukkan `ready=false`

Penyebab umum:

- `AI_API_KEY` belum diisi
- `AI_BASE_URL` tidak reachable
- `AI_MODEL` tidak cocok dengan provider
- path artifacts tidak writable
- port app sedang dipakai proses lain

Langkah cek:

1. buka `GET /ready`
2. baca `reasons`
3. cek `checklist`

## `runtime:smoke` Gagal

Penyebab umum:

- provider AI tidak hidup
- endpoint provider tidak kompatibel
- model tidak tersedia
- timeout terlalu kecil

Yang perlu dicek:

- `AI_BASE_URL`
- `AI_API_KEY`
- `AI_MODEL`
- `AI_TIMEOUT_MS`

## `runtime:tui` Jalan Tapi Respons AI Aneh

Penyebab umum:

- operator mengirim greeting atau prompt terlalu ambigu
- provider merespons tetapi directive tidak cukup jelas
- mode `natural` dipakai untuk request yang lebih cocok `structured`

Saran:

- mulai dari directive yang spesifik
- cek `Session History`
- lihat `Live Log / Messages Pane`

## Draft Agent Tidak Tersimpan

Penyebab umum:

- identifier duplikat
- field wajib belum lengkap
- path tujuan tidak writable

Langkah:

1. jalankan `validate` dulu
2. cek location `project`, `runtime`, atau `user`
3. cek output path yang ditampilkan wizard

## Telegram Tidak Mengirim

Penyebab umum:

- token tidak ada di env
- chat id tidak valid
- runner belum dijalankan

Yang dicek:

- `TOKEN_TELE` atau `TELEGRAM_BOT_TOKEN`
- `ID_CHAT`
- `GET /api/telegram/status`

## MCP Tidak Siap

Penyebab umum:

- bootstrap vendor belum dijalankan
- `.mcp.json` belum dibuat
- credential eksternal belum ada

Langkah:

```bash
npm run mcp:plan
npm run mcp:bootstrap
npm run mcp:config:plan
npm run mcp:config
```
