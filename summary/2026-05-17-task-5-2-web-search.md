# Task 5.2 — Web Search

## Ringkasan

- Pecah `src/web-search/` menjadi `types.ts`, `runtime.ts`, `providers/tavily.ts`, `providers/duckduckgo.ts`, dan `index.ts`.
- Tambah `createWebSearchClient(options)` dengan auto-selection provider: Tavily saat `TAVILY_API_KEY` tersedia, DuckDuckGo saat tidak tersedia.
- Tambah `normalizeSearchResults(raw, providerId)` untuk hasil Tavily, DuckDuckGo, dan provider custom berbasis array.
- Tambah colocated tests untuk types, runtime, barrel export, dan masing-masing provider dengan mock HTTP response.

## Verifikasi

- `./node_modules/.bin/bun test ./src/web-search/types.test.ts ./src/web-search/runtime.test.ts ./src/web-search/providers/tavily.test.ts ./src/web-search/providers/duckduckgo.test.ts ./src/web-search/index.test.ts` ✅
- `bun test src/web-search/` tidak dipakai sebagai bukti akhir karena runner ikut mengeksekusi `referensi/openclaw/src/web-search/runtime.test.ts`, yang gagal di `vi.hoisted` dan bukan bagian dari surface task ini.
- `npm run check` masih gagal karena error existing di `src/channels/whatsapp/index.ts`, bukan dari perubahan `src/web-search/`.
- `npm run runtime:smoke` gagal karena provider upstream membalas `HTTP 503` dengan pesan `Token error: Token pool is empty`, tanpa indikasi regression dari `src/web-search/`.
