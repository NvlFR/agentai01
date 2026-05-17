# Summary — Test Stability and WhatsApp Isolation

## Scope

- Menstabilkan full test suite agar `bun test` default tidak lagi tercemar test dari `referensi/**`.
- Menghilangkan test pollution lintas file pada area plugin loader dan WhatsApp.
- Menyelaraskan kontrak memory backend wiki, redaction expectation, dan timeout runbook runtime app dengan perilaku runtime aktual.

## Implementasi

- Menambahkan konfigurasi `bunfig.toml` untuk preload test, isolasi file, dan ignore path referensi/upstream.
- Mengubah `src/plugin-sdk/loader.ts` agar mendukung injected file reader, lalu memperbarui `src/plugin-sdk/loader.test.ts` supaya tidak memakai `mock.module()` global.
- Memperbaiki `src/runtime-app/memory/wiki/wikiMemoryBackend.ts` agar `retrieve()` mengembalikan nilai asli yang di-store, sambil tetap mempertahankan metadata pencarian.
- Menyelaraskan expectation redaction di `src/runtime-app/config/runtimeConfig.test.ts` dan `src/runtime-app/extensions/registry.test.ts` dengan policy redaction bersama.
- Menaikkan timeout test runbook di `src/runtime-app/runtimeApp.test.ts` karena test itu benar-benar menjalankan `bun run check`.
- Menambahkan dependency injection kecil di `src/channels/whatsapp/send.ts` lalu memigrasikan `send.test.ts` agar tidak memock module `connection-controller`.
- Membersihkan `src/channels/whatsapp/connection-controller.test.ts` dari mock `auth-store` yang bocor ke suite lain.

## Verification

- `npm run check` ✅
- `bun test` ✅ (`1222 pass`, `0 fail`)
