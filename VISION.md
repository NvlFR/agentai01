## Vision

Project ini adalah AI Company Runtime — platform untuk menjalankan perusahaan AI yang benar-benar beroperasi.

Bukan chatbot. Bukan demo. Sebuah runtime di mana agen-agen AI bekerja bersama menjalankan proyek nyata: dari lead masuk, proposal, discovery, implementasi, QA, sampai delivery ke klien.

Dokumen ini menjelaskan state saat ini dan arah project ke depan.
Kita masih early, jadi iterasi cepat.
Overview project dan developer docs: [`README.md`](README.md)
Security policy: [`SECURITY.md`](SECURITY.md)
Panduan adaptasi dari referensi: [`TODO.md`](TODO.md)

---

Project ini dimulai dari satu pertanyaan sederhana:
**Bisa tidak sebuah perusahaan dijalankan sepenuhnya oleh agen AI?**

Bukan perusahaan simulasi. Bukan workflow demo. Tapi perusahaan yang punya CEO, tim engineering, sales, marketing, product, project manager, dan support — semuanya agen AI yang berkoordinasi, mengambil keputusan, dan mengeksekusi pekerjaan nyata.

Jawabannya: bisa. Dan project ini adalah runtime-nya.

---

## State Saat Ini

Runtime sudah berjalan. Agen-agen sudah ada. Lifecycle proyek dari `lead` sampai `delivered` sudah terdefinisi.

Yang sudah ada:

- **CEO Agent** — orkestrasi, dashboard, registry, dan delegasi ke agen lain
- **Sales Agent** — lifecycle sales, proposal, approval gate, dan `lead_handoff`
- **Product Agent** — discovery, spec, dan `discovery_handoff` ke engineering
- **Engineering Agent** — implementasi, QA, delivery packaging, dan approval gate final
- **Project Manager Agent** — monitoring milestone, SLA, dan koordinasi lintas agen
- **Marketing Agent** — lead generation dan handoff ke sales
- **Support Agent** — tiket support dan eskalasi post-delivery
- **Runtime App** — HTTP server, worker, scheduler, approval queue, message log, audit log
- **Operator UI** — dashboard web untuk operator memantau dan mengontrol runtime
- **Telegram Bot** — channel alternatif untuk operator berinteraksi dengan runtime

---

## Fokus Saat Ini

**Priority:**

- Stabilitas runtime dan recovery setelah restart
- Kelengkapan lifecycle end-to-end: lead → delivered
- Keamanan dan safe defaults untuk operator
- Observability: structured logging, metrics, correlation ID

**Next priorities:**

- Dukungan multi-provider LLM (Anthropic, Google, Groq, OpenRouter)
- Persistent memory untuk agen (antar sesi, antar proyek)
- Channel tambahan: WhatsApp
- Search dan web tools untuk agen (Brave, Tavily, Firecrawl)
- Tool execution yang lebih kaya: shell, file, browser, diffs
- Diagnostics dan observability yang lebih dalam (OpenTelemetry, Prometheus)
- Deployment ke VPS/cloud dengan Docker

---

## Arsitektur

Runtime ini dibangun di atas beberapa prinsip:

**Agen adalah first-class citizens.**
Setiap agen punya domain, state, dan kontrak komunikasi sendiri.
Agen tidak saling tahu implementasi internal satu sama lain — mereka berkomunikasi via `Agent_Message` yang terdefinisi.

**Core tetap lean.**
Capability opsional harus bisa ditambahkan sebagai extension atau plugin, bukan hardcoded ke core.
Kalau sebuah fitur tidak bisa dibangun sebagai extension, itu sinyal bahwa extension API perlu diperluas.

**Operator tetap in control.**
Runtime tidak mengambil keputusan destruktif tanpa konfirmasi operator.
Approval gate ada di titik-titik kritis: proposal ke klien, delivery final, aksi berisiko.

**Local-first, cloud-ready.**
Runtime berjalan di lokal dengan satu command. Tidak butuh cloud untuk mulai.
Tapi arsitekturnya dirancang agar bisa di-deploy ke VPS atau container tanpa perubahan besar.

---

## Extension dan Provider

Runtime ini dirancang untuk mendukung berbagai provider dan channel via extension system yang diadaptasi dari referensi OpenClaw.

**LLM Providers yang akan didukung:**
`openai`, `anthropic`, `google`, `groq`, `openrouter`

**Channels:**
`telegram` (sudah ada), `whatsapp` (planned)

**Memory:**
`memory-core`, `memory-lancedb`, `memory-wiki`, `active-memory`

**Search & Web:**
`brave`, `tavily`, `firecrawl`, `web-readability`

**Tools:**
`openshell`, `file-transfer`, `diffs`, `llm-task`, `webhooks`, `browser`

**Diagnostics:**
`diagnostics-otel`, `diagnostics-prometheus`

Lihat [`TODO.md`](TODO.md) untuk daftar lengkap adaptasi yang direncanakan.

---

## Security

Security di runtime ini adalah tradeoff yang disengaja: default yang aman tanpa membunuh capability.

Tujuannya: tetap powerful untuk pekerjaan nyata sambil membuat jalur berisiko eksplisit dan operator-controlled.

Prinsip utama:
- Secrets tidak pernah di-commit ke repo
- UI tidak pernah menampilkan raw API key
- Aksi destruktif selalu butuh konfirmasi operator
- Audit log untuk semua approval, handoff, dan aksi operasional penting

Canonical security policy: [`SECURITY.md`](SECURITY.md)

---

## Yang Tidak Akan Di-merge (Untuk Sekarang)

- Agent-hierarchy frameworks berlapis-lapis (manager-of-managers / nested planner trees) sebagai arsitektur default
- Heavy orchestration layers yang menduplikasi infrastructure agen dan tool yang sudah ada
- Integrasi service komersial yang tidak jelas fit-nya dengan model provider
- Wrapper channel di atas channel yang sudah didukung tanpa capability atau security gap yang jelas
- Fitur yang bisa dibangun sebagai extension tapi malah hardcoded ke core

Daftar ini adalah guardrail roadmap, bukan hukum alam.
Demand yang kuat dan rationale teknis yang kuat bisa mengubahnya.

---

## Kenapa TypeScript + Bun?

Runtime ini pada dasarnya adalah sistem orkestrasi: prompts, tools, protokol, dan integrasi.
TypeScript dipilih agar runtime ini hackable by default.
Widely known, cepat untuk iterasi, mudah dibaca, dimodifikasi, dan di-extend.

Bun dipilih untuk startup yang cepat, built-in test runner, dan kompatibilitas TypeScript native tanpa build step yang berat.
