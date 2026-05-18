# Development Workflow

Panduan ini merangkum alur kerja pengembangan yang sehat untuk repo ini.

## Baca Dulu

- `AGENTS.md`
- `CODEX.md`
- `SECURITY.md`
- spec terkait di `.kiro/specs/`

## Alur Kerja Dasar

1. pahami scope dan boundary modul
2. cek source aktif sebelum adaptasi dari `restored-src`
3. implementasikan perubahan nyata
4. validasi surface yang disentuh
5. update docs atau summary bila relevan

## Command Harian

```bash
npm install
npm run check
bun test
npm run runtime:smoke
```

## Saat Menyentuh Runtime App

- uji `GET /health` dan `GET /ready`
- cek TUI bila perubahan menyentuh operator flow
- cek route HTTP terkait

## Saat Menyentuh MCP

- jalankan `npm run mcp:config:plan`
- bila perlu jalankan `npm run mcp:config`
- review file hasil di `workspaces/mcp-vendors/`

## Saat Menyentuh Agent Creation

- uji wizard schema, generate, validate, dan save
- cek draft yang tersimpan di workspace
- pastikan prompt dan tool boundary masih waras

## Guardrails

- jangan hardcode secret
- jangan edit `node_modules`
- jangan copy mentah surface restored yang belum cocok dengan boundary aktif
- jangan landing perubahan dengan typecheck atau test merah
