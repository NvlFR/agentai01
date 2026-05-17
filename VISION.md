# VISION.md — AgentAI01 Platform Vision

## Misi

Membangun **AI Company Runtime Platform** — sebuah sistem di mana sebuah perusahaan dijalankan oleh tim agen AI yang terorganisir secara hierarkis, otonom, dan dapat berkomunikasi satu sama lain layaknya karyawan nyata.

## Problem Statement

Perusahaan modern membutuhkan kecepatan eksekusi yang lebih tinggi dari kapasitas manusia. Namun AI yang ada hari ini bekerja secara monolitik — satu prompt besar untuk semua tugas, tanpa spesialisasi, tanpa memori konteks yang terisolasi, dan tanpa struktur organisasi yang jelas.

Hasilnya: AI yang "terlalu pintar sedikit untuk segalanya" tapi tidak cukup tajam untuk satu hal secara mendalam.

## Solusi — Hierarchical Agent Company

AgentAI01 membangun paradigma baru: **Tree of Agents** berbasis departemen.

```
Human Operator (Owner / Mission Control)
    │
    ▼
CEO Agent ← Orchestrator strategis, tidak mengeksekusi
    │
    ├── Marketing Head ← Orkestrasi kampanye dan konten
    │     └── [6 specialist sub-agents]
    ├── Engineering Head ← Code review, bug hunting, docs
    │     └── [6 specialist sub-agents]
    ├── Product Head ← Riset user, PRD, roadmap
    │     └── [5 specialist sub-agents]
    ├── Project Manager Head ← Sprint, koordinasi, deadline
    │     └── [5 specialist sub-agents]
    ├── Sales Head ← Lead, proposal, pipeline
    │     └── [5 specialist sub-agents]
    └── Support Head ← Tiket, FAQ, CSAT, WA bot
          └── [6 specialist sub-agents]
```

Setiap agen memiliki:
- **Domain yang jelas** — tidak ada tumpang tindih tanggung jawab
- **MCP tools eksklusif** — hanya tools yang relevan, mencegah halusinasi
- **Memori terisolasi** — `IntraDepartmentScratchpad` per departemen
- **Baton passing** — serah terima tugas berantai antar sub-agen

## Prinsip Desain

1. **CEO Agent tidak mengeksekusi** — hanya memutuskan dan mendelegasikan
2. **Support Agent adalah satu-satunya yang berkomunikasi dengan user akhir**
3. **Product Agent adalah sumber kebenaran untuk roadmap**
4. **PM Agent adalah pusat koordinasi** — semua task harus tercatat di sini
5. **Semua agent melapor ke CEO Agent** — minimum mingguan
6. **Context isolation** — sub-agen hanya tahu tugasnya sendiri, bukan seluruh konteks perusahaan

## Teknologi

- **Runtime**: Bun 1.3.x + TypeScript ESM strict
- **AI Provider**: OpenAI-compatible API (default: Gemini via local proxy)
- **Communication**: OperatorEventBus + IntraDepartmentScratchpad
- **Orchestration**: BatonPassingOrchestrator (delegate → pass → return)
- **Registry**: AgentRegistry (domain state) + SubAgentRegistry (hierarki 4 tingkat)
- **Channels**: Telegram, WhatsApp, HTTP REST API
- **MCP Tools**: Notion, Google Workspace, Slack, GitHub, WhatsApp API, Canva, Figma

## Roadmap

### Phase 1 — Foundation ✅
- Domain types (lifecycle, approval gates, project namespace)
- AgentRegistry dengan audit log dan history
- Agent implementations: CEO, Engineering, Marketing, Product, PM, Sales, Support

### Phase 2 — Sub-Agent Hierarchy ✅
- `AgentHierarchyConfig` + Zod schema validation
- `SubAgentRegistry` (4-tier tree)
- `IntraDepartmentScratchpad` (isolated dept memory)
- `BatonPassingOrchestrator` (delegate/pass/fail state machine)
- 33 sub-agent specialists across 7 departments

### Phase 3 — MCP Integration (Next)
- Live binding MCP tools ke sub-agen (Notion, Slack, GitHub, WA API)
- Real-time baton execution dengan AI provider calls
- Telegram/WA channel bridge untuk Support sub-agen

### Phase 4 — Operator Control (Planned)
- Company Dashboard (web UI) untuk monitoring seluruh hierarki
- Approval gate UI untuk human-in-the-loop decisions
- OKR tracking dan auto-reporting ke founder

## Success Metrics

- **CEO → Departemen → Sub-Agent latency** < 5 detik per delegation
- **Baton chain completion rate** > 95% untuk 3-agent chains
- **MCP tool call accuracy** (tool dipanggil sesuai agent role) > 99%
- **Context leak rate** (informasi bocor antar departemen) = 0%
