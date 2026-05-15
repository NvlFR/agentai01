# Maintainer Note: src/domain/

**Area:** `src/domain/` — core types, contracts, dan lifecycle definitions.

## Overview

`src/domain/` adalah kontrak pusat yang mengikat semua bagian sistem.
Tidak ada import dari runtime-app, agents, atau registry ke domain — hanya satu arah.

## File Kunci

- `src/domain/types.ts` — semua core domain types (AgentId, ProjectId, Message, lifecycle states, dll)
- Tidak boleh ada `process.env` atau side effects di folder ini.

## Gotchas dan Pitfalls

- **Jangan ubah domain types tanpa diskusi** — perubahan di sini ripple ke seluruh codebase.
- Discriminated unions digunakan untuk lifecycle states — jaga pattern ini.
- `medium-priority-adaptation` secara eksplisit out of scope untuk perubahan domain types.

## Keputusan Arsitektur

- Domain adalah pure TypeScript — tidak ada dependency eksternal.
- Agent hanya boleh cross ke core via domain types dan registry contracts.

## Pointer

- Lihat `AGENTS.md` > Architecture untuk aturan boundary.
- Lihat `.kiro/specs/` untuk requirements yang mengikat domain contracts.

## Changelog

- 2026-05-16: Initial maintainer note dibuat.
