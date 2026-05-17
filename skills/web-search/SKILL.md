---
name: web-search
description: Melakukan pencarian web menggunakan provider seperti Tavily atau DuckDuckGo.
version: 0.1.0
---
# Web Search

## Tujuan
Memungkinkan agent untuk mencari informasi di web secara real-time untuk menjawab pertanyaan pengguna atau mendapatkan data terkini.

## Cara Pakai
Panggil modul `src/web-search/` untuk melakukan pencarian. Klien pencarian diinisialisasi dengan konfigurasi provider (misalnya Tavily atau DuckDuckGo) dan menyediakan interface asinkron untuk mengirimkan query.

Contoh penggunaan:
```typescript
import { createWebSearchClient } from '../web-search/runtime.js'

const client = createWebSearchClient({
  env: process.env // Memastikan provider seperti Tavily mendapatkan API key
})

const result = await client.search('informasi terbaru AI 2026', { limit: 5 })
console.log(result.results)
```

## Parameter
Saat memanggil `client.search(query, options)`, berikut adalah parameter yang didukung:
- `query` (string): Kata kunci pencarian.
- `options.limit` (number): Batas maksimal hasil pencarian yang dikembalikan (default: 10).
- `options.locale` (string): Opsional, locale untuk hasil pencarian (misal 'id-ID').
- `options.signal` (AbortSignal): Opsional, sinyal untuk membatalkan request.
