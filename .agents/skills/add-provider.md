# Skill: Add Provider Adapter

**Kapabilitas:** Menambah LLM provider adapter baru ke runtime app.

## Instruksi

### 1. Buat file adapter baru

```
src/runtime-app/providers/<provider-name>/
  index.ts          — exports utama
  adapter.ts        — implementasi adapter
  adapter.test.ts   — contract tests
```

### 2. Implementasikan provider contract

Adapter harus mengekspos interface yang kompatibel dengan `openaiCompatibleProvider.ts`:

```ts
type ProviderTextGenerationRequest = {
  messages: ProviderMessage[]
  temperature?: number
  maxTokens?: number
  metadata?: Record<string, string>
}

type ProviderResponse = {
  model: string
  content: string
  raw: unknown
  latencyMs: number
  attempts: number
}
```

### 3. Error normalization

Map semua vendor errors ke `ProviderRequestError`:
- HTTP 429 → retryable: true (rate limit)
- HTTP 5xx → retryable: true (server error)
- Timeout → retryable: true
- HTTP 401/403 → retryable: false (invalid key)
- Network error → retryable: true

Jangan log raw vendor response body saat error.

### 4. Config via env

Baca config dari environment variable, bukan hardcode.
Tambahkan ke `.env` defaults non-secret jika ada.

### 5. Enable/disable gating

```ts
export function isEnabled(): boolean {
  return Boolean(process.env.PROVIDER_API_KEY)
}
```

### 6. Tambahkan contract test

Test bahwa adapter mengembalikan `ProviderResponse` yang valid dengan mock fetch.
Test bahwa rate limit (429) menghasilkan retryable error.
Test bahwa invalid key (401) menghasilkan non-retryable error.

### 7. Typecheck dan test

```bash
npm run check
bun test
```

## Checklist

- [ ] File adapter dibuat di folder yang benar
- [ ] Contract interface kompatibel
- [ ] Error normalization lengkap (rate limit, timeout, invalid key, unavailable)
- [ ] Config dari env
- [ ] Enable/disable gating
- [ ] Contract tests
- [ ] Typecheck clean
- [ ] Maintainer note di `.agents/maintainer-notes/providers.md` di-update
