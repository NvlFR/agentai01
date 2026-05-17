# CODEX.md — AgentAI01 Coding Standards

> Panduan coding ketat untuk semua agen (Codex, Claude, Gemini, Kiro) yang bekerja di repo ini.
> Ikuti setiap aturan tanpa pengecualian.

---

## 1. TypeScript ESM Strict

```typescript
// ✅ BENAR — import dengan suffix .js
import { BatonPassingOrchestrator } from './batonPassing.js'
import type { AgentHierarchyConfig } from '../domain/hierarchy.js'

// ❌ SALAH — tidak ada suffix
import { BatonPassingOrchestrator } from './batonPassing'
```

- Semua file TypeScript menggunakan ESM (`"type": "module"` di package.json)
- Import relatif **wajib** menggunakan suffix `.js`
- `strict: true` di tsconfig — tidak ada implicit `any`
- Tidak ada `@ts-nocheck` — jika harus suppress, beri komentar alasannya

---

## 2. No Any

```typescript
// ✅ BENAR
function processPayload(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) throw new Error('Invalid')
  const p = payload as Record<string, unknown>
  return String(p['text'] ?? '')
}

// ❌ SALAH
function processPayload(payload: any): string {
  return payload.text
}
```

Gunakan: `unknown`, discriminated unions, Zod parse, atau narrow adapter pattern.

---

## 3. External Boundary — Selalu Zod

Semua data dari luar boundary (config file, API request, env var) harus divalidasi Zod:

```typescript
// ✅ BENAR
const result = AgentHierarchyConfigSchema.safeParse(rawInput)
if (!result.success) {
  throw new Error(`Invalid config: ${result.error.issues.map(i => i.message).join(', ')}`)
}
const config = result.data

// ❌ SALAH — langsung cast tanpa validasi
const config = rawInput as AgentHierarchyConfig
```

---

## 4. Error Handling — Discriminated Union

```typescript
// ✅ BENAR — result type yang jelas
type RegisterResult =
  | { success: true; agentId: string }
  | { success: false; reason: string }

function register(config: unknown): RegisterResult {
  // ...
}

// ❌ SALAH — throw untuk flow control normal
function register(config: unknown): string {
  throw new Error('duplicate') // caller tidak tahu ini normal atau exceptional
}
```

Gunakan `throw` hanya untuk kondisi truly exceptional (programming error, invariant violation).

---

## 5. Immutability

```typescript
// ✅ BENAR — kembalikan salinan baru
getConfig(agentId: string): AgentHierarchyConfig | undefined {
  const config = this._store.get(agentId)
  if (!config) return undefined
  return { ...config, subAgentIds: [...config.subAgentIds] }
}

// ❌ SALAH — expose reference langsung
getConfig(agentId: string): AgentHierarchyConfig | undefined {
  return this._store.get(agentId) // caller bisa mutasi!
}
```

---

## 6. Sub-Agent Rules

### Registrasi

```typescript
// ✅ BENAR — gunakan makeSpecialistConfig helper
const config = makeSpecialistConfig({
  agentId: 'marketing-content-creator',
  parentAgentId: 'marketing-head',
  departmentName: 'marketing',
  allowedMcpTools: ['canva_mcp', 'notion', 'google_drive'],
})

// ❌ SALAH — CEO tidak boleh punya parentAgentId
const ceo: AgentHierarchyConfig = {
  agentId: 'ceo-agent',
  roleType: 'ceo',
  parentAgentId: 'some-parent', // INVALID!
  // ...
}
```

### Integrity check wajib setelah batch:

```typescript
registry.registerBatch(MARKETING_DEPARTMENT_CONFIGS)
const errors = registry.validateIntegrity()
if (errors.length > 0) throw new Error(errors.join('\n'))
```

---

## 7. Baton Passing Pattern

```typescript
// ✅ Pattern lengkap
const pad = new IntraDepartmentScratchpad('marketing')
const orch = new BatonPassingOrchestrator(pad)

const result = orch.delegate({
  delegatorId: 'marketing-head',
  departmentName: 'marketing',
  agentChain: [...MARKETING_CAMPAIGN_CHAIN],
  payload: { brief: 'Q2 Campaign' },
})
if (!result.success) throw new Error(result.reason)

// Setiap sub-agent memanggil pass() setelah selesai
orch.pass({ taskId: result.taskId, agentId: 'marketing-content-creator', output: { draft: '...' } })
```

---

## 8. Test Rules

### Colocated test files
```
src/registry/subAgentRegistry.ts        # implementation
src/registry/subAgentRegistry.test.ts   # test (same folder!)
```

### Timebound behavior pakai injected `now`
```typescript
// ✅ BENAR — injectable now untuk determinisme
pad.write({ fromAgentId: 'a', messageType: 'baton_pass', payload: {}, now: '2026-01-01T00:00:00Z' })
const entries = pad.readFor('b', '2026-01-01T00:00:00Z') // deterministic!

// ❌ SALAH — bergantung pada waktu nyata
pad.write({ fromAgentId: 'a', messageType: 'baton_pass', payload: {} })
const entries = pad.readFor('b') // non-deterministic!
```

### Cleanup
```typescript
beforeEach(() => {
  registry.clear()
  scratchpad.clear()
})
```

---

## 9. Prohibited Patterns

| Pattern | Alasan |
|---------|--------|
| `throw new Error('not implemented')` | Production code path harus selalu punya behavior |
| `() => {}` sebagai final body | Harus punya real behavior atau explicit no-op comment |
| `// TODO` di production code | Catat di `TODO.md` root, bukan di source |
| Import tanpa `.js` suffix | Breaks ESM resolution |
| `export type {}` file kosong | File harus punya runtime value atau tidak dibuat |
| `Date.now()` langsung di test | Pakai injected `now` |
| Hardcoded API keys | Selalu dari env |

---

## 10. Commit & PR Rules

- Conventional commits: `feat(marketing): add campaign baton chain`
- Stage hanya file yang intended — `git diff --staged` sebelum commit
- `npm run check` + `bun test` harus green sebelum push
- Branch: `feat/<feature>`, `fix/<issue>`, `docs/<topic>`
- Jangan push langsung ke `main` kecuali diminta eksplisit

---

## 11. File Organization

```
src/
  domain/           ← Pure types, no side effects
  registry/         ← AgentRegistry + SubAgentRegistry
  runtime/          ← Orchestrator, scratchpad, batonPassing
  agents/
    ceo/            ← CEO agent logic
    marketing/      ← Marketing head logic
    ...
    subagents/
      ceo/          ← CEO sub-agent configs
      marketing/    ← Marketing sub-agent configs
      ...
  runtime-app/      ← HTTP server, channels, scheduler
```

Barrel index (`index.ts`) hanya re-export — implementasi di sub-file.

---

## 12. Verifikasi Sebelum Handoff

```bash
npm run check        # Zero TypeScript errors
bun test             # All tests pass
npm run runtime:smoke # No regression (butuh AI_API_KEY)
```

Jangan serahkan pekerjaan jika ada satu pun yang failing.
