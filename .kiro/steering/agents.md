---
inclusion: always
---

# Agent Development Rules

## Arsitektur Agen

- Setiap agen punya domain, state, dan kontrak komunikasi sendiri.
- Agen berkomunikasi via `Agent_Message` — jangan bypass lewat direct import antar agen.
- Core tetap agent-agnostic. Jangan hardcode agent ID, defaults, atau policy di core.
- Agent hanya boleh cross ke core via domain types dan registry contracts.

## Lifecycle State

Urutan lifecycle proyek yang valid:

```
lead → qualified → proposal → won → discovery → implementation → qa → delivered → support → closed
```

- Transisi state ilegal harus ditolak.
- State tidak boleh mundur kecuali ada approval gate yang mengizinkan (contoh: `qa` → `implementation` kalau defect mayor ditemukan).
- Setiap transisi harus tercatat di audit log.

## Agent Message Contract

Field wajib `Agent_Message`:

```typescript
{
  from: string        // agent_id pengirim
  to: string          // agent_id penerima
  message_type: MessageType
  project_id: string
  timestamp: string
  payload: unknown
}
```

Message types yang valid: `lead_handoff`, `discovery_handoff`, `implementation_handoff`, `status_update`, `clarification_request`, `clarification_response`, `approval_request`, `approval_response`, `ticket_escalation`, `risk_alert`.

- Pesan dengan field wajib yang hilang harus ditolak.
- Validasi hak akses `project_id` sebelum dispatch.

## Approval Gates

Approval gate wajib ada di titik-titik kritis:
- Proposal ke klien (Sales Agent)
- Discovery handoff ke Engineering (Product Agent)
- Delivery final ke Owner (Engineering Agent)

Response yang valid: `approve`, `reject`, `revise`.
Histori versi tidak boleh dihapus saat ada revisi.

## Artifact Namespace

Artefak proyek disimpan di namespace: `projects/{client_id}/{project_id}/`

- Artefak hanya bisa diakses dalam konteks proyek aktif.
- Versi lama deliverable tidak boleh tertimpa saat ada revisi.

## Code Rules untuk Agent

- TypeScript ESM strict. Tidak ada `any`. Tidak ada `@ts-nocheck`.
- Discriminated unions untuk runtime branching, bukan freeform strings.
- Tidak ada hardcoded secrets, tokens, atau API keys.
- Split file di ~700 LOC kalau clarity membaik.
- Comments: singkat, hanya untuk logic non-obvious.

## Security Rules

- Jangan pernah print atau log raw secrets.
- `OPERATOR_TOKEN`, `AI_API_KEY`, `TOKEN_TELE` harus dari env — tidak pernah hardcoded.
- Aksi destruktif selalu butuh konfirmasi operator.
- Audit log wajib untuk semua approval, handoff, dan aksi operasional penting.

## Referensi Lengkap

- Full policy: `AGENTS.md`
- Security: `SECURITY.md`
- Specs: `.kiro/specs/`
