# Task 3.1 Summary — Plugin SDK Core Types dan Entry Contract

## Scope

- Spec: `.kiro/specs/plugin-sdk-adaptation/`
- Phase: 3 — Plugin SDK Layer
- Task: 3.1 — Implementasi Plugin SDK Core Types dan Entry Contract
- Source checked: `AGENTS.md`, `CODEX.md`, `SECURITY.md`, `.kiro/specs/plugin-sdk-adaptation/requirements.md`, `.kiro/specs/plugin-sdk-adaptation/design.md`, `.kiro/specs/plugin-sdk-adaptation/tasks.md`, dan referensi `referensi/openclaw/src/plugin-sdk/plugin-entry.ts`.

## Result

- `src/plugin-sdk/types.ts` sekarang punya core plugin contract yang dipakai runtime:
  - `PluginKind`, `PluginContext`, `ProviderPlugin`, `ChannelPlugin`, `ToolPlugin`, `RuntimePlugin`, `PluginFactory`
  - runtime helpers `PLUGIN_KINDS`, `isPluginKind`, dan `createPluginContext`
- `src/plugin-sdk/plugin-entry.ts` ditambahkan dengan entry contract yang bisa dipakai ulang:
  - `definePluginEntry`
  - `defineChannelPluginEntry`
  - `defineSetupPluginEntry`
  - `emptyPluginConfigSchema`
- `definePluginEntry` sekarang:
  - trim `id`, `name`, dan `description`
  - resolve `configSchema` secara lazy
  - cache hasil `configSchema` satu kali
  - route hook registration sesuai mode `cli-metadata`, `discovery`, dan `full`
- `defineChannelPluginEntry` membungkus `definePluginEntry` dan menambahkan `api.registerChannel({ plugin })` hanya pada mode `full`.
- `src/plugin-sdk/index.ts` sekarang menjadi barrel re-export only untuk `types`, `plugin-entry`, dan `channel-core`.

## Tests

- `src/plugin-sdk/types.test.ts`: runtime plugin kinds, context normalization, dan provider/channel/tool contracts.
- `src/plugin-sdk/plugin-entry.test.ts`: lazy config schema cache, routing mode registration, channel registration, default empty schema, dan setup entry helper.
- `src/plugin-sdk/index.test.ts`: barrel export untuk helper utama.
- `src/plugin-sdk/channel-core.test.ts`: tetap hijau setelah perubahan barrel/core type.

## Validation

- `./node_modules/.bin/tsc -p tsconfig.json --noEmit --pretty false`: pass.
- `bun test src/plugin-sdk/types.test.ts src/plugin-sdk/plugin-entry.test.ts src/plugin-sdk/index.test.ts`: pass, 10 tests.
- `bun test ./src/plugin-sdk/*.test.ts`: pass, 17 tests.
- `npm run runtime:smoke`: pass; provider success, `/ready` status 200, tidak ada regression baru dari perubahan task ini.

## Notes

- Tidak ada `any`, `@ts-nocheck`, `throw new Error('not implemented')`, atau `// TODO` di surface `src/plugin-sdk/` yang disentuh.
- `bun test src/plugin-sdk/` tidak dipakai sebagai bukti karena Bun ikut menangkap `referensi/openclaw/src/plugin-sdk/`; validasi final memakai glob `./src/plugin-sdk/*.test.ts` agar hanya menguji code production repo ini.
