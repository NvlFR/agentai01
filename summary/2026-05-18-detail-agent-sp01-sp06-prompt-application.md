## Summary

- Membaca spec detail agent dari:
  - `.kiro/specs/detail-agent/SP-01-ceo-agent.md`
  - `.kiro/specs/detail-agent/SP-02-engineering-agent.md`
  - `.kiro/specs/detail-agent/SP-03-marketing-agent.md`
  - `.kiro/specs/detail-agent/SP-04-product-agent.md`
  - `.kiro/specs/detail-agent/SP-05-project-manager-agent.md`
  - `.kiro/specs/detail-agent/06-support-agent.md`
- Menemukan bahwa path `SP-06-*` tidak ada secara literal; spec support ada pada `06-support-agent.md`.
- Menerapkan isi spec ke runtime provider prompt sub-agent melalui katalog prompt baru di `src/runtime/subagents/specPrompts.ts`.
- Memperkaya `buildSpecialistSystemPrompt()` di `src/runtime/subagents/prompts.ts` agar:
  - menyuntikkan charter per department
  - menyuntikkan pola berpikir, style komunikasi, dan hard rules
  - menambahkan hint spesifik per specialist
  - memaksa output partial yang eksplisit saat input penting belum tersedia
- Menambahkan test di `src/runtime/subagents/specPrompts.test.ts` untuk memastikan prompt CEO, Marketing, dan Support benar-benar memuat guidance dari spec.

## Dampak

- Semua specialist yang berjalan dalam mode `provider` sekarang menggunakan system prompt yang jauh lebih kaya dan dekat dengan dokumen spec detail-agent.
- Perubahan ini tidak mengubah kontrak registry, tool binding, atau workflow chain; fokusnya murni pada kualitas instruksi runtime provider.
- Sales tidak ikut diperkaya dari seri `SP-*` karena tidak ada file `SP-sales` pada folder tersebut.

## Verification

- `bun test src/runtime/subagents/specPrompts.test.ts src/runtime/subagents/departmentRunner.test.ts src/domain/mcpToolsMapping.test.ts`
- `npm run check`
