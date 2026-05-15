# Skill: Add Channel

**Kapabilitas:** Menambah channel komunikasi baru (inbound/outbound) ke runtime app.

## Instruksi

### 1. Referensi channel yang ada

Gunakan `src/runtime-app/telegramBot.ts` sebagai referensi implementasi channel.

### 2. Buat folder channel

```
src/runtime-app/channels/<channel-name>/
  index.ts          — entrypoint dan exports
  channel.ts        — implementasi channel
  channel.test.ts   — tests
```

### 3. Inbound: transform ke operator message

Setiap pesan masuk harus di-transform ke format operator message runtime sebelum diproses.

### 4. Outbound: kirim response runtime ke channel

Response dari runtime harus di-transform ke format yang dimengerti channel provider.

### 5. Config via env

Baca token/key dari environment variable.
Jika token tidak ada, channel tidak start — log warning, bukan crash.

### 6. Allowlist

Implementasikan allowlist nomor/ID yang diizinkan (analog `ID_CHAT` di Telegram).
Pesan dari luar allowlist di-drop dengan silent atau log.

### 7. Acknowledge cepat

Untuk channel yang punya retry mechanism (WhatsApp, dll), acknowledge penerimaan dalam 5 detik.
Proses response secara async setelah acknowledge.

### 8. Security

- Validasi webhook signature jika channel menyediakannya.
- Jangan tulis konten pesan ke disk di luar audit log yang sudah ada.

### 9. Typecheck dan test

```bash
npm run check
bun test
```

## Checklist

- [ ] Folder channel dibuat di path yang benar
- [ ] Inbound transform ke operator message format
- [ ] Outbound transform dari runtime response
- [ ] Config dari env, tidak start jika key hilang
- [ ] Allowlist diimplementasikan
- [ ] Acknowledge cepat (jika diperlukan)
- [ ] Webhook signature validation (jika ada)
- [ ] Tests
- [ ] Typecheck clean
