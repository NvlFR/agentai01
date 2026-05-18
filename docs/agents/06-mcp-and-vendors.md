# MCP And Vendors

Project ini memakai MCP sebagai lapisan tool/runtime integration dan punya bootstrap untuk vendor repos yang dirujuk dari mapping spec.

## Script Yang Tersedia

```bash
npm run mcp:plan
npm run mcp:bootstrap
npm run mcp:config:plan
npm run mcp:config
```

## Fungsi Masing-Masing

- `mcp:plan` — melihat rencana bootstrap repo vendor MCP
- `mcp:bootstrap` — clone dan materialize repo vendor ke workspace lokal
- `mcp:config:plan` — melihat rencana konfigurasi `.mcp.json`
- `mcp:config` — menulis konfigurasi MCP project tanpa menghapus server yang sudah ada

## Output Penting

- `workspaces/mcp-vendors/manifest.json`
- `workspaces/mcp-vendors/project-config-report.json`
- `.mcp.json`

## Server MCP Yang Sudah Diwire

Project config saat ini mendukung wiring untuk server resmi yang relevan, termasuk:

- `filesystem`
- `memory`
- `git`
- `fetch`
- `google-analytics-mcp`

## Kapan Dipakai

- saat menyiapkan toolchain project untuk agent
- saat memetakan allowed MCP tools per specialist
- saat menyelaraskan vendor server dengan kebutuhan runtime aktif

## Catatan Operasional

- beberapa vendor repo hanya dibootstrap sebagai referensi atau bahan adaptasi
- tidak semua repo vendor otomatis berarti server siap produksi
- provider atau credential eksternal seperti Google Analytics tetap harus diisi lewat env
