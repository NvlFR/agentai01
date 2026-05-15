# CODEX.md

Symlink ke `AGENTS.md`. Baca `AGENTS.md` untuk full policy.
Dokumen ini adalah ringkasan cepat untuk Codex worktree.

## Project

AI Company Runtime Platform — runtime untuk menjalankan perusahaan AI dengan agen-agen yang berkoordinasi.
Stack: TypeScript ESM strict, Bun 1.3.x, Node 20+, OpenAI-compatible provider.

## Map

```
src/
  domain/          # types dan kontrak utama
  agents/          # CEO, engineering, marketing, product, project-manager, sales, support
  runtime/         # orchestrator
  runtime-app/     # HTTP server, worker, scheduler, Telegram bot, UI, providers
  registry/        # AgentRegistry
  app/             # app-level exports
```

## Commands

```bash
npm install                  # install deps
npm run dev                  # dev server dengan watch mode
npm run check                # TypeScript typecheck
bun test                     # unit tests
npm run runtime:smoke        # smoke test end-to-end
npm run runtime:telegram     # Telegram bot
npm run runtime:worker       # worker loop
npm run runtime:scheduler    # scheduler loop
```

## Validation Rules

- Jalankan `npm run check` sebelum push — typecheck wajib hijau.
- Jalankan `bun test` untuk unit tests.
- Jangan landing kode dengan failing typecheck atau test.
- Untuk perubahan provider/auth/secrets: jalankan `npm run runtime:smoke` juga.

## Code Rules

- TypeScript ESM strict. Tidak ada `any`. Tidak ada `@ts-nocheck`.
- Discriminated unions untuk runtime branching, bukan freeform strings.
- Tidak ada hardcoded secrets, tokens, atau API keys.
- Split file di ~700 LOC kalau clarity membaik.
- Comments: singkat, hanya untuk logic non-obvious.

## Test Rules

- Bun test. Colocated `*.test.ts`.
- Prefer behavior tests.
- Clean timers/env/mocks/temp dirs setelah test.
- Prefer injection dan narrow mocks.

## Git Rules

- Commits: conventional-ish, concise.
- Stage hanya file yang intended — jangan `git add .` sembarangan.
- Push ke branch baru, bukan langsung ke `main`.
- Jangan commit `.env.local`, secrets, atau credentials.

## Security Rules

- Jangan pernah print atau log raw secrets.
- `OPERATOR_TOKEN`, `AI_API_KEY`, `TOKEN_TELE` harus dari env — tidak pernah hardcoded.
- UI harus mask `AI_API_KEY`.
- Lihat `SECURITY.md` untuk full policy.

## Specs

Semua specs ada di `.kiro/specs/`. Setiap spec punya `requirements.md`, `design.md`, dan `tasks.md`.
**Baca `tasks.md` untuk daftar task yang perlu dikerjakan.**

| Spec | Path |
|------|------|
| AI Company Agents (parent) | `.kiro/specs/ai-company-agents/tasks.md` |
| AI Company Runtime Platform | `.kiro/specs/ai-company-runtime-platform/tasks.md` |
| CEO Agent | `.kiro/specs/ceo-agent/tasks.md` |
| Engineering Agent | `.kiro/specs/engineering-agent/tasks.md` |
| Marketing Agent | `.kiro/specs/marketing-agent/tasks.md` |
| Product Agent | `.kiro/specs/product-agent/tasks.md` |
| Project Manager Agent | `.kiro/specs/project-manager-agent/tasks.md` |
| Sales Agent | `.kiro/specs/sales-agent/tasks.md` |
| Support Agent | `.kiro/specs/support-agent/tasks.md` |

Konvensi task status di `tasks.md`:
- `[x]` — selesai
- `[ ]` — belum dikerjakan
- `[~]` — in progress / sebagian selesai

## Referensi

- Full policy: `AGENTS.md`
- Security: `SECURITY.md`
- Vision: `VISION.md`
- Roadmap adaptasi: `TODO.md`
- Workflow AI tools: `AI-WORKFLOW.md`
- Referensi OpenClaw: `referensi/openclaw/` (jangan edit)
