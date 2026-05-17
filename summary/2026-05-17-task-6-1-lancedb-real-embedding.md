# Task 6.1 — LanceDB Real Embedding Function

## Ringkasan

- Ganti `placeholderEmbedding()` di `src/runtime-app/memory/lancedb/lancedbMemoryBackend.ts` dengan `createEmbeddingFunction(options)` yang injectable dan mockable.
- Tambah call real OpenAI-compatible embedding endpoint ke `${AI_BASE_URL}/embeddings` dengan header `Authorization: Bearer ${AI_API_KEY}` dan payload `model` + `input`.
- Tambah validasi response dengan `zod`, timeout berbasis `AbortController`, dan error deskriptif saat provider tidak terkonfigurasi, timeout, atau membalas payload/status yang tidak valid.
- Tambah injection point `connectDb` dan `embeddingFunction` pada `LanceDbMemoryBackend` agar backend bisa dites tanpa paket `vectordb` atau provider nyata.
- Tambah colocated test `src/runtime-app/memory/lancedb/lancedbMemoryBackend.test.ts` untuk request embedding, backend call flow, dan error tanpa fallback placeholder.

## Verifikasi

- `./node_modules/.bin/bun test src/runtime-app/memory/lancedb/lancedbMemoryBackend.test.ts` ✅
- `./node_modules/.bin/bun test src/runtime-app/memory/lancedb/` ✅
- `npm run check` gagal karena error existing di `src/channels/whatsapp/index.ts` (`implicit any` dan adapter type mismatch), bukan dari perubahan LanceDB.
- `npm run runtime:smoke` gagal karena provider upstream membalas `HTTP 503` dengan `Token error: Token pool is empty`, tanpa indikasi regression dari patch LanceDB.
