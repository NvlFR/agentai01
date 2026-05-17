# Summary — Task 6.2 Runtime App Speech Layer

## Implementasi

- Menambahkan layer speech baru di `src/runtime-app/speech/`:
  - `types.ts` untuk kontrak `SpeechProvider`, `SynthesizeOptions`, `TranscribeOptions`, dan result types.
  - `provider.ts` untuk `createOpenAICompatibleSpeechProvider(config)` berbasis package `openai` dengan fallback env `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, dan `AI_TRANSCRIBE_MODEL`.
  - `registry.ts` untuk registrasi multi-provider dan resolusi provider berdasarkan capability.
  - `core.ts` untuk orchestration `synthesize()` dan `transcribe()` melalui registry.
  - `index.ts` untuk re-export surface speech layer.
- Menambahkan test tanpa network di:
  - `src/runtime-app/speech/provider.test.ts`
  - `src/runtime-app/speech/registry.test.ts`
  - `src/runtime-app/speech/core.test.ts`
- Memperbaiki mismatch type lama di `src/channels/whatsapp/index.ts` agar `npm run check` kembali hijau dengan kontrak `ChannelSetupAdapter` terbaru.

## Bukti Verifikasi

- `npm run check` — pass
- `bun test src/runtime-app/speech/` — 6 pass, 0 fail
- `npm run runtime:smoke` — pass

## Catatan

- Test provider speech memakai mock client OpenAI, jadi tidak ada network call dari unit test.
