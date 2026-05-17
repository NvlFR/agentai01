# Company Agent Architecture — Index

> Dokumentasi lengkap arsitektur multi-agent perusahaan. Setiap agent memiliki file terpisah dengan detail sub-agent, tools, alur kerja, dan batasan.

---

## Daftar Agent

| # | Agent | File | Fungsi Utama |
|---|-------|------|--------------|
| 1 | CEO Agent | `01-ceo-agent.md` | Orchestrator strategis, pengambil keputusan |
| 2 | Engineering Agent | `02-engineering-agent.md` | Development, review, infra, dokumentasi teknis |
| 3 | Product Agent | `03-product-agent.md` | Riset user, PRD, roadmap, prioritisasi fitur |
| 4 | Project Manager Agent | `04-project-manager-agent.md` | Koordinasi task, sprint, deadline, risiko |
| 5 | Sales Agent | `05-sales-agent.md` | Lead, proposal, follow-up, pipeline |
| 6 | Support Agent | `06-support-agent.md` | Tiket, FAQ, WA bot, CSAT, eskalasi |
| 7 | Marketing Agent | *(lihat chat)* | Konten, SEO, campaign, analytics |

---

## Ringkasan Sub-Agent per Department

### CEO Agent
- Strategy Analyst
- Report Summarizer
- Decision Logger
- OKR Tracker

### Engineering Agent
- Code Reviewer
- Bug Hunter
- Docs Writer
- Infra Monitor
- Test Generator
- PR Summarizer

### Product Agent
- User Researcher
- Feature Prioritizer
- PRD Writer
- Roadmap Builder
- Feedback Analyzer

### Project Manager Agent
- Task Coordinator
- Risk Analyzer
- Sprint Planner
- Progress Reporter
- Deadline Watcher

### Sales Agent
- Lead Qualifier
- Proposal Generator
- Follow-up Drafter
- Pipeline Tracker
- Competitor Watcher

### Support Agent
- Ticket Classifier
- FAQ Responder
- Escalation Router
- CSAT Analyzer
- Knowledge Builder
- WA Bot Handler

### Marketing Agent
- Content Creator
- SEO Specialist
- Campaign Manager
- Analytics Reader
- Social Scheduler
- Trend Watcher

---

## Peta Komunikasi Antar Agent

```
CEO Agent
├── ← Laporan dari semua agent (mingguan)
├── → Delegasi inisiatif ke department agent
└── → OKR tracking ke semua department

Product Agent
├── → PRD ke Engineering Agent
├── → Backlog prioritas ke PM Agent
├── → Brief fitur ke Marketing Agent
└── ← Feedback dari Support Agent

Project Manager Agent
├── ← PRD dari Product Agent
├── → Task assignment ke semua department
├── → Deadline reminder ke semua department
└── → Laporan progress ke CEO Agent

Engineering Agent
├── ← Task dari PM Agent
├── ← Bug report dari Support Agent
├── → Update teknis ke PM Agent
└── → Konfirmasi fix ke Support Agent

Marketing Agent
├── ← Brief dari Product Agent
├── → Lead ke Sales Agent
├── → Blast WA template ke Support Agent
└── → Laporan performa ke CEO Agent

Sales Agent
├── ← Lead dari Marketing Agent
├── → Feedback market ke Product Agent
├── → Handoff klien baru ke Support Agent
└── → Pipeline report ke CEO Agent

Support Agent
├── ← Handoff klien dari Sales Agent
├── → Bug report ke Engineering Agent
├── → Feedback berulang ke Product Agent
└── → CSAT report ke CEO Agent
```

---

## Tools yang Digunakan (Master List)

| Tool | Digunakan oleh |
|------|----------------|
| `anthropic_api` | Semua agent |
| `notion` | Semua agent |
| `google_sheets` | CEO, Engineering, Product, PM, Sales, Support, Marketing |
| `google_drive` | CEO, Engineering, Product, PM, Sales, Support, Marketing |
| `gmail` | CEO, PM, Sales, Support |
| `slack` | CEO, Engineering, PM, Sales, Support, Marketing |
| `google_calendar` | CEO, PM, Sales |
| `github` | Engineering, Product, PM |
| `web_search` | Engineering, Product, Sales, Support, Marketing |
| `bash_tool` | Engineering |
| `figma_mcp` | Product |
| `canva_mcp` | Marketing |
| `whatsapp_api` | Support, Marketing |

---

## Prinsip Arsitektur

1. **Setiap agent punya domain yang jelas** — tidak ada tumpang tindih tanggung jawab
2. **CEO Agent tidak mengeksekusi** — hanya memutuskan dan mendelegasikan
3. **Support Agent adalah satu-satunya yang berkomunikasi dengan user akhir**
4. **Product Agent adalah sumber kebenaran untuk roadmap** — tidak ada agent lain yang bisa mengubah prioritas produk
5. **PM Agent adalah pusat koordinasi** — semua task harus tercatat di sini
6. **Semua agent melapor ke CEO Agent secara berkala** — minimum mingguan
