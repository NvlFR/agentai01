# Task 5.1 — Web Fetch

## Ringkasan

- Pecah `src/web-fetch/` menjadi `types.ts`, `runtime.ts`, `content-extractors.ts`, dan `index.ts`.
- Tambah `fetchWebContent(url, options?, runtimeOptions?)` dengan native `fetch`, timeout `AbortController`, URL safety gate, dan readability extraction untuk HTML.
- Pertahankan surface lama `evaluateUrlSafety`, `createSafeFetchClient`, dan `safeFetch` agar consumer seperti `src/link-understanding/` tetap jalan.
- Tambah colocated tests untuk types, extractor, runtime, dan barrel export.

## Verifikasi

- `./node_modules/.bin/bun test ./src/web-fetch/types.test.ts ./src/web-fetch/content-extractors.test.ts ./src/web-fetch/runtime.test.ts ./src/web-fetch/index.test.ts` ✅
- `./node_modules/.bin/bun test src/link-understanding/index.test.ts` ✅
- `npm run check` masih gagal karena error yang sudah ada di `src/channels/whatsapp/index.ts`, bukan dari perubahan `web-fetch`.
- `npm run runtime:smoke` gagal karena provider upstream membalas `HTTP 503` dengan pesan `Token error: Token pool is empty`.
