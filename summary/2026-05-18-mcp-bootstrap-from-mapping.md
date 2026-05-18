# Summary — MCP Bootstrap from `mcp-tools-mapping.md`

## Scope

- Menambahkan katalog runtime untuk repo MCP dan repo tooling eksternal yang direferensikan oleh `.kiro/specs/subagent-hierarchy-infrastructure/mcp-tools-mapping.md`.
- Menambahkan bootstrap lokal agar repo-repo tersebut bisa di-clone secara terstruktur ke workspace project ini.
- Menghasilkan manifest lokal yang memetakan repo ↔ agent ↔ MCP server ↔ path checkout.

## Changes

- Menambahkan `src/mcp/repositories.ts` sebagai katalog repo MCP terkelola:
  - repo resmi `modelcontextprotocol/servers`
  - repo resmi `googleanalytics/google-analytics-mcp`
  - repo eksternal skill/automation seperti `OpenOutreach`, `Agentic-SEO-Skill`, `antigravity-awesome-skills`, dan lainnya
- Menambahkan `src/mcp/bootstrap.ts` untuk:
  - membangun install plan berdasarkan `AGENT_MCP_TOOL_PROFILES`
  - clone/fetch repo secara shallow
  - menulis manifest lokal di workspace vendor MCP
- Menambahkan test `src/mcp/repositories.test.ts`
- Menambahkan script:
  - `npm run mcp:plan`
  - `npm run mcp:bootstrap`

## Local Bootstrap Result

- Vendor root: `workspaces/mcp-vendors`
- Manifest lokal: `workspaces/mcp-vendors/manifest.json`
- Repo yang berhasil di-install:
  - `modelcontextprotocol-servers`
  - `google-analytics-mcp`
  - `antigravity-awesome-skills`
  - `open-outreach`
  - `agentic-seo-skill`
  - `youtube-content-creation-agent`
  - `smart-marketing-assistant-crew-ai`
  - `facebook-python-business-sdk`
  - `instapy`
  - `facebook-posts-automation`
  - `tiktok-automation`
  - `tiktok-uploader`

## Verification

- `bun test src/mcp/repositories.test.ts src/mcp/index.test.ts src/mcp/service.test.ts` ✅
- `npm run check` ✅
- `npm run runtime:smoke` ✅

## Notes

- Checkout repo vendor disimpan di `workspaces/mcp-vendors`, yang sudah termasuk path lokal/non-commit.
- Bootstrap ini baru mematerialisasi repo dan manifest relasinya. Tahap berikutnya adalah memilih repo mana yang benar-benar ingin di-wire menjadi server/config MCP aktif untuk runtime project.
- Mission Control `start` tidak bisa dikirim karena `http://localhost:3010` tidak merespons dari environment ini.
