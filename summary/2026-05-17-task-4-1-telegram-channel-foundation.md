# Summary: Task 4.1 — Telegram Token, Transport, Normalize, Offset, Status, dan Error Policy

## Status
- [x] `src/channels/telegram/token.ts`
- [x] `src/channels/telegram/fetch.ts`
- [x] `src/channels/telegram/normalize.ts`
- [x] `src/channels/telegram/update-offset-store.ts`
- [x] `src/channels/telegram/polling-status.ts`
- [x] `src/channels/telegram/error-policy.ts`
- [x] Colocated tests untuk seluruh surface task 4.1
- [x] `npm run check` green
- [x] `bun test src/channels/telegram/` green
- [x] `npm run runtime:smoke` green

## Changes

### 1. Token Resolution
Menambahkan resolver token Telegram dengan precedence:
- `TOKEN_TELE` dari environment
- token file via `tryReadSecretFileSync`
- token dari config
- fallback `missing`

Resolver mengembalikan `status`, `value`, dan `source`, sekaligus trim whitespace dan membedakan `configured_unavailable` vs `missing`.

### 2. Transport dan API Root
Menambahkan transport resolver Telegram yang:
- default ke global `fetch`
- normalize root ke `https://api.telegram.org`
- strip root yang sudah mengandung `/bot<token>`
- mendukung proxy via `ProxyAgent`
- log mode transport melalui subsystem logger `telegram/network`

### 3. Target Normalize
Menambahkan normalizer target Telegram yang:
- menerima prefix `telegram:` dan `tg:`
- mendukung `group:` dan thread/topic id
- reject input kosong / invalid
- selalu output lowercase

### 4. Offset Store
Menambahkan offset store polling Telegram yang:
- baca missing file sebagai `null`
- write JSON secara atomic
- simpan `version` dan `tokenFingerprint`
- reset offset saat version tidak cocok atau token berubah

### 5. Polling Status dan Error Policy
Menambahkan publisher status polling yang aman no-op saat sink tidak tersedia, plus error policy Telegram yang mendukung:
- `always`
- `once`
- `silent`

Cooldown default adalah 4 jam dan suppression discope per `account/chat/thread`.

### 6. Small Compatibility Fix
Merapikan `src/channels/telegram/bot-helpers.ts` agar type signature cocok dengan test/helper yang sudah ada, tanpa mengubah behavior runtime-nya.

## Validation
- `npm run check`
- `bun test src/channels/telegram/`
- `npm run runtime:smoke`
