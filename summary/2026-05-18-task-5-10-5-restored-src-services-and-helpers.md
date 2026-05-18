# Summary Task 5-10.5

Tanggal: 2026-05-18
Spec: `.kiro/specs/restored-src-modules-adaptation`
Batch: task 5 sampai 10.5

## Implementasi

- Menambahkan helper telemetry redaction-safe di `src/logging/telemetry.ts` beserta test exporter.
- Menambahkan helper git worktree-aware dan GitHub auth/repo mapping di `src/runtime-app/integrations/git/gitRuntime.ts` dan `src/runtime-app/integrations/github/githubRuntime.ts`.
- Menambahkan disk persistence helper dengan path safety dan repair path di `src/runtime-app/storage/filePersistence.ts`.
- Menambahkan helper teleport export di `src/runtime/teleport.ts` dan planning helper di `src/tools/ultraplan.ts`.
- Menambahkan computer-use gate dan host adapter executor ringan di `src/runtime-app/tools/computer-use/index.ts`.
- Menambahkan kontrak service baru untuk:
  - API request/retry: `src/runtime-app/services/apiService.ts`
  - MCP client wrapper + header normalization: `src/mcp/service.ts`
  - Analytics, compact, LSP: `src/runtime-app/services/analyticsService.ts`, `compactService.ts`, `lspService.ts`
  - Plugin ops, settings sync, remote managed settings: `pluginOpsService.ts`, `settingsSyncService.ts`, `remoteManagedSettingsService.ts`
  - Session memory, team memory sync, prompt suggestion: `sessionMemoryService.ts`, `teamMemorySyncService.ts`, `promptSuggestionService.ts`
  - Magic docs dan tool-use summary: `magicDocsService.ts`, `toolUseSummaryService.ts`
- Menambahkan barrel export yang relevan di `src/logging/index.ts`, `src/mcp/index.ts`, `src/tools/index.ts`, dan `src/runtime-app/services/index.ts`.
- Menyesuaikan landing path union di `src/compat/restored-src-adaptation.ts` agar selaras dengan baseline capability yang memang sudah didaftarkan.

## Verifikasi

- Targeted tests lulus:
  `bun test src/logging/telemetry.test.ts src/runtime-app/integrations/git/gitRuntime.test.ts src/runtime-app/integrations/github/githubRuntime.test.ts src/runtime-app/storage/filePersistence.test.ts src/runtime/teleport.test.ts src/tools/ultraplan.test.ts src/runtime-app/tools/computer-use/index.test.ts src/runtime-app/services/apiService.test.ts src/mcp/service.test.ts src/runtime-app/services/analyticsService.test.ts src/runtime-app/services/compactService.test.ts src/runtime-app/services/lspService.test.ts src/runtime-app/services/pluginOpsService.test.ts src/runtime-app/services/settingsSyncService.test.ts src/runtime-app/services/remoteManagedSettingsService.test.ts src/runtime-app/services/sessionMemoryService.test.ts src/runtime-app/services/teamMemorySyncService.test.ts src/runtime-app/services/promptSuggestionService.test.ts src/runtime-app/services/magicDocsService.test.ts src/runtime-app/services/toolUseSummaryService.test.ts src/compat/restored-src-adaptation.test.ts`

## Catatan

- `npm run check` masih gagal karena banyak error pre-existing di surface referensi/adaptasi yang belum selesai, terutama `src/logging/analytics/*`, `src/logging/telemetry/*`, `src/runtime-app/services/*` lama, `src/runtime-app/tools/computer-use/*` lama, dan `src/tools/summary/*`.
- `bun test` suite penuh juga masih memiliki kegagalan pre-existing di `src/runtime-app/runtimeApp.test.ts` pada skenario `executes real runbook directives through runtime app state`.
