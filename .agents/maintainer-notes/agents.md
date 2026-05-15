# Maintainer Note: src/agents/

**Area:** `src/agents/` — implementasi agent (CEO, engineering, marketing, product, project-manager, sales, support).

## Overview

Agent implementations adalah business logic layer. Setiap agent adalah spesialisasi dari contract domain.

## Aturan Ketat

- Agent hanya boleh cross ke core via domain types dan registry contracts.
- **Medium-priority-adaptation tidak menyentuh agent implementations** kecuali integrasi extension yang diperlukan.
- Provider code tidak boleh import langsung dari agent internals.

## Pola Umum

- Setiap agent directory memiliki entrypoint file sesuai nama agent.
- Capability dan behavior agent didefinisikan via domain types.

## Gotchas

- Jangan tambah business logic agent sebagai side effect dari perubahan infra/extension.
- Jika extension perlu di-invoke dari agent, gunakan abstraction layer — jangan direct import dari extension internals.

## Changelog

- 2026-05-16: Initial maintainer note dibuat.
