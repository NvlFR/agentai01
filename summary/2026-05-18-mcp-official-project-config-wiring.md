## Summary

- Menambahkan wiring config MCP resmi lokal lewat `src/mcp/projectConfig.ts`.
- Menulis `.mcp.json` berbasis subset upstream yang benar-benar tersedia dari hasil clone:
  - `filesystem`
  - `memory`
  - `git`
  - `fetch`
  - `google-analytics-mcp`
- Menjaga server MCP yang sudah ada di `.mcp.json` agar tidak ikut terhapus saat generator dijalankan ulang.
- Menambahkan report coverage ke `workspaces/mcp-vendors/project-config-report.json` untuk membedakan server `available` vs `deferred`.
- Memperbaiki katalog MCP domain agar `git` ikut tercatat sebagai server resmi dan dipetakan dari `bash_tool`.
- Menambahkan script:
  - `npm run mcp:config`
  - `npm run mcp:config:plan`
- Menambahkan test coverage untuk plan, coverage report, dan write behavior.

## Deferred Official Servers

Server berikut masih ditandai `deferred` karena checkout upstream-nya tidak ada pada clone resmi yang tersedia saat ini:

- `brave-search`
- `notion`
- `slack`
- `postgres`
- `github`
- `puppeteer`
- `sqlite`

## Verification

- `bun test src/mcp/projectConfig.test.ts src/mcp/repositories.test.ts src/mcp/index.test.ts src/mcp/service.test.ts`
- `npm run mcp:config:plan`
- `npm run mcp:config`
- `npm run check`
