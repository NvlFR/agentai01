# CLAUDE.md — Context for Claude Agent

> File ini dibaca oleh Claude saat memulai session di repo ini.
> Berisi orientasi cepat, prinsip kerja, dan panduan navigasi kode.

---

## Apa Repo Ini?

`agentai01` adalah **AI Company Runtime Platform** — sistem di mana sebuah perusahaan dijalankan oleh tim agen AI dengan hierarki 4 tingkat:

```
Human Operator → CEO Agent → Department Heads (7) → Sub-Agent Specialists (33)
```

Proyek ini dibangun secara kolaboratif oleh beberapa AI coding agent (Codex, Gemini, Kiro, Claude). Anda mungkin menemukan kode dari session sebelumnya — baca dulu, pahami, baru edit.

---

## Bacaan Wajib Sebelum Kerja

1. `AGENTS.md` — root rules, map direktori, commands
2. `CODEX.md` — coding standards ketat
3. `SECURITY.md` — security policy
4. `.kiro/specs/detail-agent/` — spesifikasi tiap agent
5. `.kiro/specs/subagent-hierarchy-infrastructure/` — specs hierarki sub-agent

---

## Orientasi Cepat Codebase

### File paling penting:

```
src/domain/types.ts           ← Lifecycle, messages, approval gates — sumber kebenaran
src/domain/hierarchy.ts       ← AgentHierarchyConfig + Zod schema (4-tier hierarchy)
src/registry/AgentRegistry.ts ← State, history, access control untuk domain agents
src/registry/subAgentRegistry.ts ← SubAgentRegistry untuk pohon hierarki sub-agen
src/runtime/scratchpad.ts     ← IntraDepartmentScratchpad (isolated dept memory)
src/runtime/batonPassing.ts   ← BatonPassingOrchestrator (delegate→pass→fail)
src/agents/subagents/         ← 33 sub-agent configs across 7 departments
```

### Department sub-agents:

| Dept | Path | Jumlah Specialist |
|------|------|-------------------|
| CEO | `src/agents/subagents/ceo/` | 4 |
| Marketing | `src/agents/subagents/marketing/` | 6 |
| Engineering | `src/agents/subagents/engineering/` | 6 |
| Product | `src/agents/subagents/product/` | 5 |
| PM | `src/agents/subagents/pm/` | 5 |
| Sales | `src/agents/subagents/sales/` | 5 |
| Support | `src/agents/subagents/support/` | 6 |

---

## Prinsip Kerja Claude di Repo Ini

### DO ✅
- Baca specs di `.kiro/specs/` sebelum implementasi baru
- Gunakan `validateIntegrity()` setelah batch register sub-agents
- Tulis colocated `*.test.ts` untuk setiap modul baru
- Gunakan `makeSpecialistConfig()` helper untuk sub-agent configs
- Import dengan `.js` suffix (`import from './module.js'`)
- Jalankan `npm run check` dan `bun test` sebelum selesai

### DON'T ❌
- Jangan tulis `throw new Error('not implemented')` sebagai implementasi final
- Jangan gunakan `any` — pakai `unknown` atau narrow adapter
- Jangan import tanpa `.js` suffix
- Jangan hardcode API keys atau secrets
- Jangan push langsung ke `main`
- Jangan buat file kosong yang hanya berisi `export type {}`

---

## Cara Menambah Sub-Agent Baru

```typescript
// 1. Gunakan makeSpecialistConfig
export const MY_SPECIALIST_CONFIG = makeSpecialistConfig({
  agentId: 'dept-my-specialist',
  parentAgentId: 'dept-head',
  departmentName: 'dept',
  allowedMcpTools: ['notion', 'web_search'],
  roleDescription: 'Apa yang dilakukan specialist ini.',
})

// 2. Tambahkan ke array dept configs
export const DEPT_CONFIGS = [...existingConfigs, MY_SPECIALIST_CONFIG]

// 3. Update subAgentIds di Head config
export const DEPT_HEAD_CONFIG = {
  ...existingHead,
  subAgentIds: [...existingHead.subAgentIds, 'dept-my-specialist'],
}

// 4. Jalankan validateIntegrity setelah register
```

---

## Cara Menjalankan Baton Chain

```typescript
import { BatonPassingOrchestrator } from './src/runtime/batonPassing.js'
import { IntraDepartmentScratchpad } from './src/runtime/scratchpad.js'
import { MARKETING_CAMPAIGN_CHAIN } from './src/agents/subagents/marketing/index.js'

const pad = new IntraDepartmentScratchpad('marketing')
const orch = new BatonPassingOrchestrator(pad)

// Delegate
const { taskId } = orch.delegate({
  delegatorId: 'marketing-head',
  departmentName: 'marketing',
  agentChain: [...MARKETING_CAMPAIGN_CHAIN],
  payload: { brief: 'Q2 Campaign' },
}) as { success: true; taskId: string }

// Each sub-agent calls pass() after completion
orch.pass({ taskId, agentId: 'marketing-content-creator', output: { draft: 'Article...' } })
orch.pass({ taskId, agentId: 'marketing-seo-specialist', output: { keywords: ['ai'] } })
orch.pass({ taskId, agentId: 'marketing-campaign-manager', output: { sent: 1000 } })

// Final output
const result = orch.getFinalOutput(taskId) // { sent: 1000 }
```

---

## Session Checklist

Sebelum mengakhiri session:

- [ ] `npm run check` — zero TypeScript errors
- [ ] `bun test` — semua test pass (atau failing test sudah didokumentasikan)
- [ ] Tidak ada `// TODO` baru di production code path
- [ ] Tidak ada secret yang terekspos
- [ ] Commit sudah diformat dengan conventional-ish message

---

## Mission Control

Jika ada Mission Control (JARVIS) di `localhost:3010`, laporkan task:
- **Start**: `POST /api/external/task` dengan `action: "start"`
- **Complete**: `POST /api/external/task` dengan `action: "complete"`
- Hanya untuk task nyata — bukan diskusi/brainstorming
