# Maintainer Note: src/runtime-app/providers/

**Area:** `src/runtime-app/providers/` — LLM provider adapters.

## Overview

Semua provider adapter duduk di atas contract yang sama.
Provider default: OpenAI-compatible (base URL + API key + model).

## Provider Contract

Dari `openaiCompatibleProvider.ts`:

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

Error handling: `ProviderRequestError` dengan `status`, `attempt`, `retryable`, `responseBody`.

## Provider yang Ada

- `openai-compatible` — default, via `AI_BASE_URL` + `AI_API_KEY` + `AI_MODEL`

## Provider yang Akan Ditambah (Medium Adaptation)

- `anthropic-vertex` — Google Cloud credentials + project/region
- `groq` — `GROQ_API_KEY` + `GROQ_MODEL`
- `gemini-cli` — `GEMINI_API_KEY` + `GEMINI_MODEL`

## Gotchas

- Rate limit (429) dan server error (5xx) harus retryable — lihat `openaiCompatibleProvider.ts` sebagai referensi.
- Jangan log raw vendor API response saat error — bisa mengandung sensitive data.
- Timeout default 30 detik (`AI_TIMEOUT_MS`). Provider baru harus honor timeout yang dapat dikonfigurasi.

## Menambah Provider Baru

Lihat skill: `.agents/skills/add-provider.md`

## Changelog

- 2026-05-16: Initial note. Dokumentasi contract dan provider medium yang akan ditambah.
