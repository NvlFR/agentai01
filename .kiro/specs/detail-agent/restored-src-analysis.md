# Analisis Ekstraksi `restored-src/` (Referensi OpenClaw)

## Ringkasan Eksekutif
Direktori `restored-src` berisi lebih dari 4.400 file dan 1.200 folder. Codebase ini merupakan implementasi lengkap dari sistem agen AI interaktif berbasis CLI (sangat mirip dengan *Claude Code* atau *OpenClaw*). Mengingat ukurannya yang masif, menjelaskan file-per-file secara individual tidak efisien dan akan mengaburkan fokus proyek `agentai01`.

Oleh karena itu, dokumen ini membedah `restored-src` berdasarkan **Subsistem (Direktori Utama)** dan memberikan rekomendasi strategis mengenai apa yang harus diekstrak, diadaptasi, atau diabaikan untuk menyelesaikan **Phase 7** di proyek kita.

---

## 1. Subsistem yang WAJIB Digunakan (Ekstrak Mentah/Modifikasi Minimal)

### A. Model Context Protocol (`restored-src/src/mcp/*`)
* **Isi:** Implementasi klien MCP, koneksi transport (stdio/HTTP), validasi *tools*, parsing skema, dan eksekusi server MCP.
* **Alasan Dipakai:** Ini adalah *engine* utama untuk **Task 7.1 (Real MCP Integrations)**. Kita tidak perlu menulis ulang logika koneksi MCP dari nol.
* **Target:** Disalin/diadaptasi ke `src/mcp/`.

### B. LLM API Clients (`restored-src/src/api/*` & `restored-src/src/core/*`)
* **Isi:** Klien untuk Anthropic API, AWS Bedrock, GCP Vertex. Terdapat juga mekanisme *Token Budgeting*, *Rate Limiting*, *Retries*, dan *Prompt Construction*.
* **Alasan Dipakai:** Sangat krusial untuk **Task 7.3 (ContentCreatorRuntime)** dan semua *Specialist Executor*. Ini menangani *error handling* LLM kelas produksi.
* **Target:** Disalin ke `src/provider-runtime/` atau `src/llm/`.

### C. Sistem Keamanan & Sanitasi (`restored-src/src/security/*`)
* **Isi:** Logika sanitasi input, pendeteksi *dangerous config*, redaction (penyensoran) token rahasia, dan *audit logging*.
* **Alasan Dipakai:** Keamanan mutlak diperlukan sebelum membiarkan agen mengeksekusi perintah atau memanggil API.
* **Target:** Diadaptasi ke `src/security/`.

---

## 2. Subsistem yang BISA Diadaptasi (Contek Polanya)

### A. Shell & Command Execution (`restored-src/src/shell/*`, `restored-src/src/tools/*`)
* **Isi:** `bashProvider.ts`, `powershellProvider.ts`, *read-only validation*, resolusi shell bawaan.
* **Penerapan:** Agen Engineering kita (`CodeReviewer`, `BugHunter`) membutuhkan eksekusi bash. Kita bisa mengekstrak `bashProvider.ts` untuk dijadikan bagian dari `bash_tool` MCP internal kita.

### B. Telemetri & Observabilitas (`restored-src/src/telemetry/*`)
* **Isi:** *Session tracing*, ekspor ke BigQuery, *structured logger*.
* **Penerapan:** Pola *logging*-nya sangat bagus untuk dikirim ke *RuntimeOperationalApp* (UI Operator / JARVIS), agar aksi agen bisa dimonitor *real-time*.

### C. Memori & Konteks (`restored-src/src/memory/*`, `restored-src/src/context/*`)
* **Isi:** Penyimpanan *state* lokal, deduplikasi pesan, *context window management*.
* **Penerapan:** Kita sudah memiliki `IntraDepartmentScratchpad`. Namun, algoritma kompresi konteks dari sini bisa kita terapkan saat *scratchpad* kita hampir penuh.

---

## 3. Subsistem yang HARUS DIABAIKAN (Jangan Digunakan)

### A. Terminal User Interface / TUI (`restored-src/src/tui/*`, `restored-src/src/components/*`)
* **Isi:** Komponen antarmuka berbasis teks (React Ink), *rendering loading spinner*, *status bar* terminal.
* **Alasan Dibuang:** `agentai01` adalah **Platform Backend**. Operator kita berinteraksi melalui Web UI (Task 7.5) atau Telegram Bot, BUKAN melalui CLI. Kode ini hanya akan menjadi *dead code*.

### B. CLI Command Routing (`restored-src/src/cli.ts`, `restored-src/src/commands/*`)
* **Isi:** Parsing argumen baris perintah (`claude auth`, `claude update`).
* **Alasan Dibuang:** Tidak relevan dengan model *always-on daemon* / worker dari `agentai01`.

### C. Swarm / Teammate Architecture (`restored-src/src/swarm/*`, `restored-src/src/teammateMode/*`)
* **Isi:** Arsitektur pendelegasian tugas bawaan OpenClaw (leader/teammate).
* **Alasan Dibuang:** **Sangat Konflik**. Kita secara spesifik telah merancang dan membangun arsitektur hierarki 4 tingkat dengan `BatonPassingOrchestrator` dan `SubAgentRegistry`. Menggunakan sistem *swarm* bawaan mereka akan merusak fondasi Phase 1-6 kita.

---

## Kesimpulan & Rencana Aksi untuk Phase 7

1. Jangan melakukan *Copy-Paste* massal seluruh folder `restored-src/`.
2. Untuk memulai **Task 7.1**, ekstrak HANYA `restored-src/src/mcp/*` ke dalam *codebase* kita.
3. Sesuaikan *import paths* dari file MCP yang diekstrak agar menggunakan sistem `import ... from './module.js'` berbasis ESM ketat milik kita.
4. Buat agar *specialist executor* (`ContentCreator`, dll) menggunakan klien MCP hasil ekstraksi ini.
