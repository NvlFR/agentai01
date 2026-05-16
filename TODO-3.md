# TODO-3: Adaptasi `skills/` dari Referensi OpenClaw

Dokumen ini adalah kelanjutan dari `TODO.md` dan `TODO-2.md`, khusus untuk adaptasi semua skill di `referensi/openclaw/skills/` ke project ini.

Prinsip: **semua skill dianggap relevan**. Skill-skill ini memperluas kemampuan agen AI Company Runtime untuk berinteraksi dengan tools eksternal, platform komunikasi, dan layanan produktivitas.

Urutan pengerjaan mengikuti prioritas yang sama dengan `TODO.md`: fondasi dulu, capability kemudian.

---

## Prinsip Adaptasi

- Jangan copy-paste mentah. Sesuaikan dengan arsitektur AI Company Runtime.
- Ganti semua referensi `openclaw` → nama project ini.
- Hapus bagian yang spesifik ke OpenClaw (state dir `~/.openclaw`, `openclaw message send`, dll).
- Pertahankan pattern dan interface yang bagus, buang implementasi yang tidak relevan.
- Setiap skill harus punya `SKILL.md` yang menjelaskan kapan dan bagaimana menggunakannya.
- Skill yang butuh binary eksternal harus dokumentasikan cara install-nya.

---

## Prioritas 1 — Skill Inti untuk Operasional Agent

Skill-skill ini langsung mendukung workflow agen AI Company Runtime.

### 1. `skills/coding-agent/`

**Referensi:** `referensi/openclaw/skills/coding-agent/`

**Yang diadaptasi:**
- Pattern untuk mendelegasikan coding task ke Codex, Claude Code, atau agent lain via background process
- PTY mode untuk Codex/Pi/OpenCode, non-PTY untuk Claude Code
- Completion notification via channel yang sudah ada (Telegram, dll)
- Parallel issue fixing dengan git worktrees
- Progress update pattern agar operator tahu status

**Target path:** `skills/coding-agent/`

**Relevansi:** Sangat relevan — project ini punya AI-WORKFLOW.md yang sudah mendokumentasikan pembagian kerja antara Kiro, Codex, dan Gemini. Skill ini memformalkan pattern tersebut.

---

### 2. `skills/github/`

**Referensi:** `referensi/openclaw/skills/github/`

**Yang diadaptasi:**
- Penggunaan `gh` CLI untuk PR, issues, CI/CD
- JSON output dan filtering dengan `--jq`
- Template untuk PR review summary dan issue triage
- Konfigurasi `GH_CONFIG_DIR` untuk environment yang berbeda

**Target path:** `skills/github/`

**Relevansi:** Sangat relevan — project ini aktif menggunakan GitHub untuk development workflow.

---

### 3. `skills/gh-issues/`

**Referensi:** `referensi/openclaw/skills/gh-issues/`

**Yang diadaptasi:**
- Orchestrator untuk auto-fix GitHub issues dengan parallel sub-agents
- 6-phase workflow: parse args → fetch issues → confirm → pre-flight → spawn agents → collect results
- PR review handler untuk address review comments
- Cron mode untuk scheduled issue processing
- Fork mode untuk PR dari fork ke upstream

**Target path:** `skills/gh-issues/`

**Relevansi:** Sangat relevan — memungkinkan agen secara otomatis mengerjakan GitHub issues.

---

### 4. `skills/taskflow/`

**Referensi:** `referensi/openclaw/skills/taskflow/`

**Yang diadaptasi:**
- Pattern untuk multi-step background task dengan satu owner
- Flow lifecycle: `createManaged` → `runTask` → `setWaiting` → `resume` → `finish`/`fail`
- State persistence antar step via `stateJson`
- Child task linking dan parent orchestration
- Revision-checked mutations untuk conflict-safe updates

**Target path:** `skills/taskflow/`

**Relevansi:** Sangat relevan — project ini punya lifecycle proyek yang kompleks (lead → delivered) yang butuh durable task orchestration.

---

### 5. `skills/taskflow-inbox-triage/`

**Referensi:** `referensi/openclaw/skills/taskflow-inbox-triage/`

**Yang diadaptasi:**
- Concrete routing pattern untuk inbox triage menggunakan TaskFlow
- Klasifikasi pesan: business, personal, later
- Integration dengan channel (Slack, Telegram, dll)

**Target path:** `skills/taskflow-inbox-triage/`

**Relevansi:** Relevan — agen support dan sales butuh pattern triage untuk pesan masuk.

---

### 6. `skills/healthcheck/`

**Referensi:** `referensi/openclaw/skills/healthcheck/`

**Yang diadaptasi:**
- Audit dan hardening host yang menjalankan runtime
- Security audit workflow: context → audit → risk tolerance → remediation plan
- Periodic check scheduling
- Ganti referensi `openclaw security audit` → endpoint `/health` dan `/ready` project ini

**Target path:** `skills/healthcheck/`

**Relevansi:** Relevan — project ini punya `/health` dan `/ready` endpoint yang perlu dimonitor.

---

### 7. `skills/session-logs/`

**Referensi:** `referensi/openclaw/skills/session-logs/`

**Yang diadaptasi:**
- Search dan analisis session logs menggunakan `jq` dan `rg`
- Query untuk cost summary, tool usage breakdown, message count
- Sesuaikan path ke session storage project ini

**Target path:** `skills/session-logs/`

**Relevansi:** Relevan — project ini menyimpan session transcript dan butuh cara untuk menganalisisnya.

---

### 8. `skills/summarize/`

**Referensi:** `referensi/openclaw/skills/summarize/`

**Yang diadaptasi:**
- Summarize URL, YouTube, artikel, PDF, dan file lokal via `summarize` CLI
- Model selection dan API key configuration
- Trigger phrases untuk aktivasi skill

**Target path:** `skills/summarize/`

**Relevansi:** Relevan — agen research dan product butuh kemampuan summarize konten eksternal.

---

## Prioritas 2 — Skill Komunikasi dan Kolaborasi

### 9. `skills/slack/`

**Referensi:** `referensi/openclaw/skills/slack/`

**Yang diadaptasi:**
- Slack actions: react, pin/unpin, send, edit, delete messages
- Member info dan emoji list
- Ganti referensi `openclaw` → runtime project ini

**Target path:** `skills/slack/`

**Relevansi:** Relevan — Slack adalah channel komunikasi tim yang umum dipakai.

---

### 10. `skills/discord/`

**Referensi:** `referensi/openclaw/skills/discord/`

**Yang diadaptasi:**
- Discord ops via message tool
- Components v2 untuk rich UI
- Thread management, polls, reactions
- Writing style guidelines untuk Discord

**Target path:** `skills/discord/`

**Relevansi:** Medium — berguna kalau project ini perlu berinteraksi dengan komunitas Discord.

---

### 11. `skills/wacli/`

**Referensi:** `referensi/openclaw/skills/wacli/`

**Yang diadaptasi:**
- Send WhatsApp messages ke third-party via `wacli` CLI
- Sync dan search WhatsApp history
- Safety rules: require explicit recipient + confirmation sebelum send

**Target path:** `skills/wacli/`

**Relevansi:** Medium — berguna untuk agen sales/support yang perlu menghubungi klien via WhatsApp.

---

### 12. `skills/notion/`

**Referensi:** `referensi/openclaw/skills/notion/`

**Yang diadaptasi:**
- Notion API untuk create/read/update pages, databases, dan blocks
- Property types dan format untuk database items
- Perbedaan API version 2025-09-03 (data sources)

**Target path:** `skills/notion/`

**Relevansi:** Relevan — agen product dan project manager sering butuh akses ke Notion untuk dokumentasi.

---

### 13. `skills/trello/`

**Referensi:** `referensi/openclaw/skills/trello/`

**Yang diadaptasi:**
- Trello REST API untuk boards, lists, dan cards
- CRUD operations via curl
- Setup dan auth dengan API key + token

**Target path:** `skills/trello/`

**Relevansi:** Medium — berguna untuk agen project manager yang menggunakan Trello.

---

## Prioritas 3 — Skill Produktivitas dan Tools

### 14. `skills/model-usage/`

**Referensi:** `referensi/openclaw/skills/model-usage/`

**Yang diadaptasi:**
- Summarize cost logs per model untuk Codex atau Claude
- Current model vs all models breakdown
- Sesuaikan dengan cost tracking project ini

**Target path:** `skills/model-usage/`

**Relevansi:** Relevan — project ini butuh visibility ke penggunaan dan biaya model AI.

---

### 15. `skills/tmux/`

**Referensi:** `referensi/openclaw/skills/tmux/`

**Yang diadaptasi:**
- Remote-control tmux sessions via keystrokes dan pane output scraping
- Pattern untuk monitoring Claude Code / Codex sessions
- Check all sessions status sekaligus
- Send task ke session tertentu

**Target path:** `skills/tmux/`

**Relevansi:** Relevan — AI-WORKFLOW.md sudah menyebut penggunaan tmux untuk parallel agent sessions.

---

### 16. `skills/weather/`

**Referensi:** `referensi/openclaw/skills/weather/`

**Yang diadaptasi:**
- Current weather dan forecast via `wttr.in` (no API key needed)
- Format codes untuk custom output
- Trigger phrases untuk aktivasi

**Target path:** `skills/weather/`

**Relevansi:** Low-medium — berguna sebagai skill utilitas umum untuk agen.

---

### 17. `skills/xurl/`

**Referensi:** `referensi/openclaw/skills/xurl/`

**Yang diadaptasi:**
- X (Twitter) API via `xurl` CLI
- Post, reply, search, DM, media upload
- Secret safety rules — jangan expose credentials ke LLM context
- Multi-app dan multi-account management

**Target path:** `skills/xurl/`

**Relevansi:** Medium — berguna untuk agen marketing yang perlu posting ke X/Twitter.

---

## Prioritas 4 — Skill Spesifik Platform (Low Priority)

Skill-skill berikut lebih spesifik ke platform tertentu atau butuh hardware/software khusus. Dikerjakan setelah skill prioritas 1-3 sudah stabil.

### 18. `skills/skill-creator/`

**Referensi:** `referensi/openclaw/skills/skill-creator/`

**Yang diadaptasi:**
- Workflow untuk membuat skill baru
- Template SKILL.md
- Validation dan testing skill

**Target path:** `skills/skill-creator/`

**Relevansi:** Relevan untuk jangka panjang — memungkinkan agen membuat skill baru secara mandiri.

---

### 19. `skills/nano-pdf/`

**Referensi:** `referensi/openclaw/skills/nano-pdf/`

**Yang diadaptasi:**
- PDF processing dan extraction
- Sesuaikan dengan kebutuhan document handling project ini

**Target path:** `skills/nano-pdf/`

**Relevansi:** Medium — berguna untuk agen yang perlu memproses dokumen PDF dari klien.

---

### 20. `skills/openai-whisper/` dan `skills/openai-whisper-api/`

**Referensi:** `referensi/openclaw/skills/openai-whisper/` dan `referensi/openclaw/skills/openai-whisper-api/`

**Yang diadaptasi:**
- Speech-to-text via Whisper (local CLI dan API)
- Audio transcription untuk meeting notes, voice messages

**Target path:** `skills/openai-whisper/` dan `skills/openai-whisper-api/`

**Relevansi:** Medium — berguna untuk agen yang perlu transcribe audio dari klien atau meeting.

---

### 21. `skills/obsidian/`

**Referensi:** `referensi/openclaw/skills/obsidian/`

**Yang diadaptasi:**
- Obsidian vault management
- Note creation dan search

**Target path:** `skills/obsidian/`

**Relevansi:** Low — berguna kalau tim menggunakan Obsidian untuk knowledge management.

---

### 22. `skills/oracle/`

**Referensi:** `referensi/openclaw/skills/oracle/`

**Yang diadaptasi:**
- Oracle database operations
- Query dan data management

**Target path:** `skills/oracle/`

**Relevansi:** Low — berguna kalau ada klien yang menggunakan Oracle database.

---

### 23. `skills/sag/`

**Referensi:** `referensi/openclaw/skills/sag/`

**Yang diadaptasi:**
- Sub-agent generation pattern
- Sesuaikan dengan agent spawning di project ini

**Target path:** `skills/sag/`

**Relevansi:** Medium — berguna untuk pattern spawning sub-agent yang lebih terstruktur.

---

### 24. Skill macOS-Specific (Sangat Low Priority)

Skill-skill berikut sangat spesifik ke macOS dan tidak relevan untuk server/Linux runtime:

- `skills/apple-notes/` — Apple Notes integration
- `skills/apple-reminders/` — Apple Reminders integration
- `skills/bear-notes/` — Bear Notes app
- `skills/things-mac/` — Things 3 task manager
- `skills/imsg/` — iMessage integration
- `skills/camsnap/` — Camera snapshot
- `skills/openhue/` — Philips Hue smart lights
- `skills/sonoscli/` — Sonos speaker control
- `skills/spotify-player/` — Spotify playback control
- `skills/blucli/` — Bluetooth CLI
- `skills/peekaboo/` — Screen capture
- `skills/sherpa-onnx-tts/` — Local TTS via ONNX

**Catatan:** Semua skill macOS-specific ini bisa diabaikan untuk sekarang karena project ini berjalan di server Linux. Bisa dipertimbangkan kembali kalau ada kebutuhan spesifik.

---

### 25. Skill Lain-lain (Low Priority)

- `skills/blogwatcher/` — Monitor blog/RSS feeds
- `skills/clawhub/` — OpenClaw Hub integration (tidak relevan, ganti dengan registry project ini)
- `skills/eightctl/` — Eight Sleep mattress control (sangat spesifik)
- `skills/gemini/` — Gemini AI integration (bisa diadaptasi untuk provider Gemini)
- `skills/gifgrep/` — GIF search
- `skills/gog/` — GOG game platform
- `skills/goplaces/` — Google Places
- `skills/himalaya/` — Email client CLI
- `skills/mcporter/` — MCP server porting
- `skills/node-connect/` — Node connection management
- `skills/songsee/` — Song lyrics
- `skills/video-frames/` — Video frame extraction
- `skills/voice-call/` — Voice call management
- `skills/1password/` — 1Password CLI integration

---

## Urutan Eksekusi yang Disarankan

Kalau mau dikerjakan bertahap:

1. **Batch 1** — Skill inti: `coding-agent`, `github`, `gh-issues`, `taskflow`
2. **Batch 2** — Operasional: `healthcheck`, `session-logs`, `model-usage`, `tmux`
3. **Batch 3** — Komunikasi: `slack`, `notion`, `summarize`
4. **Batch 4** — Tools tambahan: `discord`, `wacli`, `trello`, `xurl`, `weather`
5. **Batch 5** — Skill creator dan PDF: `skill-creator`, `nano-pdf`
6. **Batch 6** — Speech dan lainnya: `openai-whisper`, `openai-whisper-api`, `sag`
7. **Batch 7** — Low priority: `obsidian`, `oracle`, dan lainnya sesuai kebutuhan

---

## Catatan

- Prioritas ini dibuat berdasarkan relevansi langsung ke workflow AI Company Runtime.
- Skill macOS-specific diabaikan karena project berjalan di Linux server.
- Skill yang butuh binary eksternal harus dokumentasikan cara install di Linux.
- Lihat `TODO.md` untuk adaptasi folder dan extensions lainnya.
- Lihat `TODO-2.md` untuk adaptasi modul `src/` dari referensi.
- Lihat `AI-WORKFLOW.md` untuk cara membagi kerja antara Kiro, Codex, dan Gemini.
