# Requirements Document

## Introduction

Feature **medium-priority-adaptation** adalah tahap kedua adaptasi dari referensi OpenClaw ke AI Company Runtime Platform, dikerjakan setelah fondasi inti (`foundation-adaptation`) sudah stabil. Adaptasi ini mencakup dua area besar:

1. **Folder-folder tooling & workflow** — `qa/`, `git-hooks/`, `patches/`, `.agents/`, `changelog/`, dan `apps/swabble/` yang memperkuat disiplin engineering, release management, dan AI-assisted development workflow.
2. **Extensions medium priority** — provider LLM tambahan, channel baru (WhatsApp), memory lanjutan, speech & voice, image/video generation, search & web tools, tool plugins, diagnostics & observability, dan infrastructure extensions.

Prinsip adaptasi tetap sama: bukan copy-paste dari referensi, melainkan adopsi konsep dan pola yang relevan, disesuaikan dengan stack Bun 1.3.x + TypeScript ESM strict dan arsitektur agent-based runtime yang sudah ada.

Tujuan akhir: platform yang lebih mature dari sisi engineering discipline, lebih kaya kemampuan provider dan tool, serta siap untuk ritme release yang lebih rutin.

---

## Glossary

- **QA_Runner**: Sistem scenario-based QA di `qa/` yang menjalankan skenario end-to-end terhadap runtime yang berjalan.
- **QA_Scenario**: Satu file skenario yang mendefinisikan urutan aksi dan assertion terhadap runtime.
- **Git_Hook**: Script yang dijalankan otomatis oleh Git pada event tertentu (pre-commit, commit-msg, pre-push).
- **Patch_File**: File `.patch` di `patches/` yang memodifikasi dependency tertentu setelah `npm install`.
- **Agents_Workflow**: Folder `.agents/` berisi maintainer notes dan skills untuk AI-assisted development workflow.
- **Maintainer_Note**: Dokumen di `.agents/maintainer-notes/` yang memberikan konteks tambahan kepada AI agent saat bekerja di area tertentu.
- **Changelog_Fragment**: File kecil di `changelog/fragments/` yang merepresentasikan satu perubahan untuk satu release.
- **Changelog_Compiler**: Script yang mengompilasi fragments menjadi `CHANGELOG.md` final.
- **Swabble_App**: Aplikasi voice interface di `apps/swabble/` yang memungkinkan interaksi dengan runtime via suara.
- **Provider_Adapter**: Modul di `src/runtime-app/providers/` yang mengadaptasi API provider eksternal ke interface internal runtime.
- **LLM_Provider**: Provider model bahasa besar (Anthropic Vertex, Groq, Gemini CLI).
- **WhatsApp_Channel**: Channel komunikasi WhatsApp yang memungkinkan operator berinteraksi dengan runtime via WhatsApp.
- **Memory_Backend**: Implementasi storage untuk memory subsystem (LanceDB, Wiki, Active Memory).
- **Speech_Core**: Subsistem speech-to-text dan text-to-speech yang menjadi fondasi voice interaction.
- **Image_Generation_Core**: Subsistem generasi gambar yang menjadi fondasi image generation capabilities.
- **Video_Generation_Core**: Subsistem generasi video yang menjadi fondasi video generation capabilities.
- **Search_Tool**: Tool yang memungkinkan agent melakukan pencarian web (Brave, DuckDuckGo, Exa, Tavily).
- **Web_Readability**: Tool yang mengekstrak konten readable dari halaman web.
- **Observability_Backend**: Backend untuk diagnostics dan metrics (OpenTelemetry, Prometheus).
- **Extension_Contract**: Interface TypeScript yang harus diimplementasikan oleh setiap extension agar bisa di-load oleh runtime.
- **Operator**: Pengguna yang mengoperasikan runtime platform via HTTP API, UI, atau channel bot.
- **Runtime_Platform**: Sistem keseluruhan AI Company Runtime Platform.

---

## Requirements

### Requirement 1: QA Scenario Runner

**User Story:** As a developer, I want a QA scenario runner, so that I can define and execute end-to-end scenarios against a running runtime instance to verify behavior beyond unit tests.

#### Acceptance Criteria

1. THE QA_Runner SHALL load scenario files dari `qa/scenarios/` dan mengeksekusinya secara berurutan.
2. SETIAP QA_Scenario SHALL mendefinisikan: nama skenario, urutan aksi (HTTP calls, message sends), dan assertion yang diharapkan.
3. KETIKA sebuah assertion gagal, THE QA_Runner SHALL melaporkan nama skenario, langkah yang gagal, nilai yang diharapkan, dan nilai aktual.
4. THE QA_Runner SHALL dapat dijalankan via `node qa/run.mjs` atau `bun qa/run.mjs` tanpa build step tambahan.
5. THE QA_Runner SHALL mendukung flag `--scenario <name>` untuk menjalankan satu skenario spesifik.
6. THE QA_Runner SHALL mendukung flag `--base-url <url>` untuk menentukan target runtime instance.
7. KETIKA semua skenario lolos, THE QA_Runner SHALL exit dengan kode `0` dan mencetak ringkasan hasil.
8. KETIKA ada skenario yang gagal, THE QA_Runner SHALL exit dengan kode non-zero.
9. THE QA_Runner SHALL menyediakan `qa/helpers/` dengan helper functions untuk membangun request dan assertion umum.
10. UNTUK SEMUA skenario yang valid, menjalankan skenario dua kali berturut-turut pada runtime yang sama SHALL menghasilkan hasil yang konsisten (determinism property).

---

### Requirement 2: Git Hooks

**User Story:** As a developer, I want automated git hooks, so that code quality checks run automatically before commits and pushes, preventing bad code from entering the repository.

#### Acceptance Criteria

1. THE Git_Hook `pre-commit` SHALL menjalankan TypeScript typecheck (`npm run check`) sebelum setiap commit.
2. THE Git_Hook `commit-msg` SHALL memvalidasi format pesan commit mengikuti conventional commits format: `<type>(<scope>): <description>`.
3. THE Git_Hook `pre-push` SHALL menjalankan `bun test` sebelum setiap push ke remote.
4. KETIKA sebuah hook gagal, Git SHALL membatalkan operasi (commit atau push) dan menampilkan pesan error yang actionable.
5. THE Git_Hook scripts SHALL dapat diinstall via `node git-hooks/install.mjs` yang menyalin hooks ke `.git/hooks/`.
6. THE Git_Hook scripts SHALL dapat di-uninstall via `node git-hooks/uninstall.mjs`.
7. SETIAP hook script SHALL dapat di-bypass dengan flag `--no-verify` untuk kasus darurat (terdokumentasi).
8. THE Git_Hook `commit-msg` SHALL menerima tipe commit yang valid: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `ci`, `build`.
9. UNTUK SEMUA pesan commit yang valid, `commit-msg` hook SHALL exit dengan kode `0` (completeness property).
10. UNTUK SEMUA pesan commit yang tidak valid, `commit-msg` hook SHALL exit dengan kode non-zero dan menampilkan contoh format yang benar.

---

### Requirement 3: Dependency Patches

**User Story:** As a developer, I want a patches system, so that I can apply targeted modifications to dependencies without forking them, keeping the changes auditable and reproducible.

#### Acceptance Criteria

1. THE Patch_File system SHALL menyimpan patch files di `patches/` dengan format `<package-name>+<version>.patch`.
2. SETIAP Patch_File SHALL dapat diaplikasikan otomatis setelah `npm install` via `postinstall` script di `package.json`.
3. THE patch application script SHALL menggunakan `patch-package` atau mekanisme ekuivalen yang kompatibel dengan Bun.
4. KETIKA sebuah patch gagal diaplikasikan (karena versi dependency berubah), THE patch script SHALL melaporkan nama package, versi yang diharapkan, dan versi aktual.
5. THE `patches/` directory SHALL menyertakan `patches/README.md` yang mendokumentasikan setiap patch: alasan, package yang di-patch, dan tanggal dibuat.
6. UNTUK SEMUA patch yang valid, mengaplikasikan patch dua kali SHALL menghasilkan state yang sama seperti mengaplikasikan sekali (idempotence property).
7. THE patch system SHALL tidak memodifikasi file di `node_modules/` secara langsung tanpa melalui mekanisme patch.

---

### Requirement 4: AI-Assisted Development Workflow (.agents/)

**User Story:** As a developer, I want an `.agents/` directory with maintainer notes and skills, so that AI agents working on this codebase have the context they need to make correct decisions.

#### Acceptance Criteria

1. THE Agents_Workflow SHALL menyediakan `.agents/maintainer-notes/` dengan dokumen konteks per area codebase.
2. SETIAP Maintainer_Note SHALL mencakup: area yang dicakup, gotchas dan pitfalls yang diketahui, keputusan arsitektur yang tidak obvious, dan pointer ke file relevan.
3. THE Agents_Workflow SHALL menyediakan `.agents/skills/` dengan skill definitions yang dapat digunakan oleh AI agent.
4. SETIAP skill definition SHALL mendefinisikan: nama skill, deskripsi kapabilitas, dan instruksi penggunaan.
5. THE `.agents/` directory SHALL menyertakan `README.md` yang menjelaskan struktur dan cara menggunakan workflow ini.
6. Maintainer notes SHALL di-update setiap kali ada perubahan arsitektur signifikan di area yang dicakup.
7. THE Agents_Workflow SHALL tidak menyimpan secrets, credentials, atau informasi sensitif dalam bentuk apapun.

---

### Requirement 5: Changelog Management

**User Story:** As a developer, I want a changelog management system, so that release notes are generated consistently from structured fragments rather than manually written.

#### Acceptance Criteria

1. THE Changelog_Fragment system SHALL menyimpan fragments di `changelog/fragments/` dengan format `<id>-<type>.md`.
2. SETIAP Changelog_Fragment SHALL mengandung: tipe perubahan (`feat`, `fix`, `breaking`, `chore`), deskripsi singkat, dan referensi issue/PR jika ada.
3. THE Changelog_Compiler SHALL dapat dijalankan via `node changelog/compile.mjs` untuk menghasilkan atau memperbarui `CHANGELOG.md`.
4. KETIKA dikompilasi, THE Changelog_Compiler SHALL mengelompokkan fragments berdasarkan tipe dan mengurutkan secara kronologis.
5. THE Changelog_Compiler SHALL mendukung flag `--version <semver>` untuk menandai release baru.
6. SETELAH kompilasi berhasil, fragments yang sudah dikompilasi SHALL dipindahkan ke `changelog/fragments/released/` agar tidak dikompilasi ulang.
7. THE `changelog/` directory SHALL menyertakan `changelog/template.md` sebagai template format output.
8. UNTUK SEMUA set fragments yang sama, mengompilasi dua kali SHALL menghasilkan output `CHANGELOG.md` yang identik (determinism property).

---

### Requirement 6: Swabble Voice Interface App

**User Story:** As an operator, I want a voice interface app, so that I can interact with the AI runtime using voice commands without needing to type.

#### Acceptance Criteria

1. THE Swabble_App SHALL dapat menerima input suara dari mikrofon dan mengkonversinya ke teks menggunakan Speech_Core.
2. THE Swabble_App SHALL mengirimkan teks hasil konversi ke runtime sebagai pesan operator.
3. THE Swabble_App SHALL menerima respons dari runtime dan mengkonversinya ke suara menggunakan text-to-speech.
4. THE Swabble_App SHALL dapat dijalankan sebagai aplikasi standalone di `apps/swabble/`.
5. THE Swabble_App SHALL mendukung konfigurasi via environment variables: `SWABBLE_RUNTIME_URL`, `SWABBLE_OPERATOR_TOKEN`.
6. KETIKA Speech_Core tidak tersedia, THE Swabble_App SHALL fallback ke mode teks biasa tanpa crash.
7. THE Swabble_App SHALL tidak menyimpan rekaman suara ke disk secara permanen.
8. THE Swabble_App SHALL menampilkan indikator visual saat sedang mendengarkan, memproses, atau berbicara.

---

### Requirement 7: Additional LLM Providers

**User Story:** As an operator, I want additional LLM provider adapters (Anthropic Vertex, Groq, Gemini CLI), so that I can choose the best model for each use case without being locked into a single provider.

#### Acceptance Criteria

1. SETIAP Provider_Adapter SHALL mengimplementasikan Extension_Contract yang sama dengan provider yang sudah ada (`openai`).
2. THE `anthropic-vertex` adapter SHALL mendukung autentikasi via Google Cloud credentials dan konfigurasi project/region via environment variables.
3. THE `groq` adapter SHALL mendukung konfigurasi `GROQ_API_KEY` dan `GROQ_MODEL` via environment variables.
4. THE `gemini-cli` adapter SHALL mendukung konfigurasi `GEMINI_API_KEY` dan `GEMINI_MODEL` via environment variables.
5. SETIAP adapter SHALL menangani error dari provider (rate limit, timeout, invalid key) dan mengkonversinya ke error type internal yang konsisten.
6. KETIKA provider tidak tersedia atau key tidak valid, adapter SHALL mengembalikan error yang deskriptif tanpa mengekspos raw API response ke log.
7. UNTUK SEMUA adapter, mengirim request yang sama SHALL menghasilkan response dengan struktur yang konsisten (interface consistency property).
8. SETIAP adapter SHALL dapat dikonfigurasi dan diaktifkan tanpa mengubah kode core runtime.

---

### Requirement 8: WhatsApp Channel

**User Story:** As an operator, I want a WhatsApp channel plugin, so that I can interact with the AI runtime via WhatsApp in addition to Telegram.

#### Acceptance Criteria

1. THE WhatsApp_Channel SHALL mendukung penerimaan pesan dari WhatsApp dan meneruskannya ke runtime sebagai operator message.
2. THE WhatsApp_Channel SHALL mendukung pengiriman respons dari runtime ke WhatsApp.
3. THE WhatsApp_Channel SHALL dikonfigurasi via environment variables: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`.
4. THE WhatsApp_Channel SHALL memvalidasi webhook signature dari Meta sebelum memproses pesan.
5. KETIKA `WHATSAPP_TOKEN` tidak ada, THE WhatsApp_Channel SHALL tidak start dan melaporkan konfigurasi yang hilang.
6. THE WhatsApp_Channel SHALL membatasi akses hanya ke nomor yang terdaftar di `WHATSAPP_ALLOWED_NUMBERS` (comma-separated), analog dengan `ID_CHAT` di Telegram.
7. THE WhatsApp_Channel SHALL tidak menyimpan konten pesan ke disk di luar audit log yang sudah ada.
8. UNTUK SEMUA pesan masuk yang valid, THE WhatsApp_Channel SHALL mengakui penerimaan (acknowledge) dalam 5 detik untuk menghindari retry dari Meta.

---

### Requirement 9: Advanced Memory Backends

**User Story:** As a developer, I want advanced memory backends (LanceDB, Wiki, Active Memory), so that agents can store and retrieve information with better performance and richer query capabilities than the basic memory core.

#### Acceptance Criteria

1. THE `memory-lancedb` backend SHALL mengimplementasikan interface Memory_Backend yang sama dengan `memory-core`.
2. THE `memory-lancedb` backend SHALL mendukung vector similarity search untuk retrieval berbasis semantic similarity.
3. THE `memory-wiki` backend SHALL menyimpan memory sebagai dokumen terstruktur yang dapat di-query dengan full-text search.
4. THE `active-memory` backend SHALL mengelola working memory yang aktif selama sesi agent berjalan dan membersihkannya saat sesi berakhir.
5. SETIAP Memory_Backend SHALL dapat dikonfigurasi dan diaktifkan tanpa mengubah kode agent atau core runtime.
6. KETIKA backend tidak tersedia (misalnya LanceDB tidak terinstall), runtime SHALL fallback ke `memory-core` dan melaporkan fallback via log.
7. UNTUK SEMUA operasi write-then-read pada backend yang sama, data yang dibaca SHALL konsisten dengan data yang ditulis (consistency property).
8. SETIAP Memory_Backend SHALL mengimplementasikan operasi: `store(key, value)`, `retrieve(key)`, `search(query)`, dan `delete(key)`.

---

### Requirement 10: Speech & Voice Subsystem

**User Story:** As a developer, I want a speech and voice subsystem, so that agents and the Swabble app can convert between speech and text using configurable backends.

#### Acceptance Criteria

1. THE Speech_Core SHALL menyediakan interface abstrak untuk speech-to-text (STT) dan text-to-speech (TTS).
2. THE `deepgram` backend SHALL mengimplementasikan STT menggunakan Deepgram API dengan konfigurasi via `DEEPGRAM_API_KEY`.
3. THE `tts-local-cli` backend SHALL mengimplementasikan TTS menggunakan CLI tool lokal yang dapat dikonfigurasi via `TTS_CLI_COMMAND`.
4. SETIAP speech backend SHALL mengimplementasikan interface yang sama sehingga dapat dipertukarkan tanpa mengubah consumer.
5. KETIKA backend speech tidak tersedia, Speech_Core SHALL mengembalikan error yang deskriptif tanpa crash.
6. THE Speech_Core SHALL tidak menyimpan audio data ke disk kecuali secara eksplisit diminta via konfigurasi.
7. UNTUK SEMUA input teks yang valid, TTS backend SHALL menghasilkan audio output yang dapat diputar (non-empty audio property).

---

### Requirement 11: Image & Video Generation Core

**User Story:** As a developer, I want image and video generation core subsystems, so that agents can generate visual content as part of their work.

#### Acceptance Criteria

1. THE Image_Generation_Core SHALL menyediakan interface abstrak untuk generasi gambar dari text prompt.
2. THE Video_Generation_Core SHALL menyediakan interface abstrak untuk generasi video dari text prompt atau image.
3. SETIAP generation backend SHALL mengimplementasikan interface yang sama sehingga dapat dipertukarkan.
4. KETIKA generation backend tidak tersedia atau quota habis, core SHALL mengembalikan error yang deskriptif.
5. THE Image_Generation_Core SHALL mendukung konfigurasi: model, ukuran output, dan format file.
6. THE Video_Generation_Core SHALL mendukung konfigurasi: model, durasi, resolusi, dan format file.
7. UNTUK SEMUA prompt yang valid, generation core SHALL menghasilkan output atau error yang deskriptif — tidak pernah hang tanpa timeout.
8. THE generation cores SHALL menerapkan timeout yang dapat dikonfigurasi via `IMAGE_GEN_TIMEOUT_MS` dan `VIDEO_GEN_TIMEOUT_MS`.

---

### Requirement 12: Search & Web Tools

**User Story:** As a developer, I want search and web tools (Brave, DuckDuckGo, Exa, Tavily, Web Readability), so that agents can search the web and extract content from pages as part of their tasks.

#### Acceptance Criteria

1. SETIAP search tool (Brave, DuckDuckGo, Exa, Tavily) SHALL mengimplementasikan interface Search_Tool yang sama: `search(query: string, options?: SearchOptions): Promise<SearchResult[]>`.
2. THE `brave` tool SHALL dikonfigurasi via `BRAVE_API_KEY` environment variable.
3. THE `exa` tool SHALL dikonfigurasi via `EXA_API_KEY` environment variable.
4. THE `tavily` tool SHALL dikonfigurasi via `TAVILY_API_KEY` environment variable.
5. THE `duckduckgo` tool SHALL beroperasi tanpa API key menggunakan public endpoint.
6. THE `web-readability` tool SHALL mengekstrak konten readable dari URL yang diberikan, menghilangkan navigasi, iklan, dan boilerplate.
7. KETIKA search provider tidak tersedia atau rate limit tercapai, tool SHALL mengembalikan error yang deskriptif tanpa crash.
8. UNTUK SEMUA query yang valid, setiap search tool SHALL mengembalikan array `SearchResult` (bisa kosong) atau error — tidak pernah `undefined` (completeness property).
9. SETIAP `SearchResult` SHALL mengandung minimal: `title`, `url`, dan `snippet`.

---

### Requirement 13: Tool Plugins (Canvas, Document Extract, Diffs, OC-Path, LLM Task, Lobster)

**User Story:** As a developer, I want additional tool plugins, so that agents have richer capabilities for working with documents, code, and structured data.

#### Acceptance Criteria

1. THE `canvas` tool SHALL menyediakan kemampuan untuk membuat dan memanipulasi canvas/whiteboard terstruktur untuk agent collaboration.
2. THE `document-extract` tool SHALL mengekstrak teks dan metadata dari dokumen (PDF, DOCX, dll) yang diberikan sebagai path atau URL.
3. THE `diffs` tool SHALL menghasilkan dan mengaplikasikan diff antara dua versi teks atau file.
4. THE `oc-path` tool SHALL menyediakan path resolution dan file system navigation yang aman dalam konteks project.
5. THE `llm-task` tool SHALL memungkinkan agent mendelegasikan sub-task ke LLM call terpisah dengan prompt yang dapat dikonfigurasi.
6. THE `lobster` tool SHALL menyediakan kemampuan structured data extraction dari teks tidak terstruktur.
7. SETIAP tool plugin SHALL mengimplementasikan Extension_Contract yang konsisten.
8. KETIKA sebuah tool gagal, tool SHALL mengembalikan error yang deskriptif tanpa mengekspos internal stack trace ke agent.
9. UNTUK SEMUA tool yang menerima file path sebagai input, tool SHALL memvalidasi bahwa path berada dalam batas yang diizinkan (path traversal prevention property).

---

### Requirement 14: Diagnostics & Observability

**User Story:** As an operator, I want diagnostics and observability backends (OpenTelemetry, Prometheus), so that I can monitor runtime health, trace requests, and alert on anomalies in production.

#### Acceptance Criteria

1. THE `diagnostics-otel` backend SHALL mengekspor traces dan metrics ke OpenTelemetry collector yang dikonfigurasi via `OTEL_EXPORTER_OTLP_ENDPOINT`.
2. THE `diagnostics-prometheus` backend SHALL mengekspos metrics endpoint di `/metrics` dalam format Prometheus scrape.
3. SETIAP agent operation yang signifikan (handoff, approval, LLM call) SHALL menghasilkan span/trace yang dapat di-observe.
4. THE observability backends SHALL dapat diaktifkan/dinonaktifkan via environment variables tanpa mengubah kode runtime.
5. KETIKA observability backend tidak tersedia, runtime SHALL tetap berjalan normal — observability adalah best-effort, bukan hard dependency.
6. THE `diagnostics-prometheus` backend SHALL mengekspos minimal: request count, error rate, LLM call latency, dan agent message throughput.
7. UNTUK SEMUA metrics yang diekspos, nilai SHALL selalu non-negative (validity property).
8. THE observability backends SHALL tidak menyertakan secret values dalam trace attributes atau metric labels.

---

### Requirement 15: Infrastructure Extensions

**User Story:** As a developer, I want infrastructure extensions (Bonjour, Device Pair, TokenJuice, Voyage, Synthetic), so that the runtime has better service discovery, device pairing, token management, and testing capabilities.

#### Acceptance Criteria

1. THE `bonjour` extension SHALL menyediakan service discovery via mDNS untuk menemukan runtime instances di jaringan lokal.
2. THE `device-pair` extension SHALL memungkinkan pairing antara runtime instance dan device (mobile, desktop) untuk channel communication.
3. THE `tokenjuice` extension SHALL menyediakan token budget management: tracking penggunaan token per agent, per project, dan per provider.
4. THE `voyage` extension SHALL menyediakan embedding generation untuk kebutuhan semantic search dan memory retrieval.
5. THE `synthetic` extension SHALL menyediakan synthetic data generation untuk kebutuhan testing dan development.
6. SETIAP infrastructure extension SHALL dapat diaktifkan/dinonaktifkan secara independen via konfigurasi.
7. THE `tokenjuice` extension SHALL melaporkan warning ketika token budget mendekati batas yang dikonfigurasi.
8. UNTUK SEMUA token usage yang dicatat, total usage SHALL selalu >= 0 dan konsisten dengan sum dari individual calls (accounting property).

---

### Requirement 16: QA & Testing Extensions

**User Story:** As a developer, I want QA and testing extensions (QA Channel, Test Support), so that I can run automated quality checks through the same channel interface used by real operators.

#### Acceptance Criteria

1. THE `qa-channel` extension SHALL menyediakan channel virtual yang dapat digunakan oleh QA_Runner untuk mengirim dan menerima pesan tanpa koneksi jaringan eksternal.
2. THE `test-support` extension SHALL menyediakan utilities untuk setup dan teardown test environment yang melibatkan runtime yang berjalan.
3. THE `qa-channel` SHALL mendukung recording dan replay pesan untuk regression testing.
4. KETIKA `qa-channel` digunakan, pesan SHALL diproses oleh runtime dengan cara yang identik dengan channel nyata (behavioral equivalence property).
5. THE `test-support` extension SHALL menyediakan helper untuk: membuat project test, mensimulasikan lifecycle transitions, dan memverifikasi audit log.
6. SETIAP test yang menggunakan `test-support` SHALL membersihkan state setelah selesai (cleanup property).

---

### Requirement 17: Thread Ownership (Skills & Coding Agents)

**User Story:** As a developer, I want thread ownership tracking, so that concurrent agent operations on the same project don't conflict and ownership of work items is always clear.

#### Acceptance Criteria

1. THE `thread-ownership` extension SHALL melacak kepemilikan thread/task per agent dan per project.
2. KETIKA dua agent mencoba mengklaim ownership atas thread yang sama, THE extension SHALL menolak klaim kedua dan melaporkan konflik.
3. THE `thread-ownership` extension SHALL mendukung transfer ownership antar agent dengan approval gate.
4. KETIKA agent yang memiliki thread tidak aktif selama lebih dari `THREAD_OWNERSHIP_TIMEOUT_MS`, ownership SHALL dilepas otomatis.
5. UNTUK SEMUA operasi claim-then-release, state ownership SHALL kembali ke unowned (round-trip property).
6. THE extension SHALL mengekspos ownership state via audit log untuk traceability.

---

## Out of Scope

Item berikut secara eksplisit **tidak** termasuk dalam scope feature ini:

- **High priority items** — sudah dicakup di `foundation-adaptation`.
- **Low priority extensions** — ElevenLabs, Azure Speech, Microsoft, Fal, Runway, Comfy, Vydra, Perplexity, Firecrawl, SearXNG, OpenShell, Phone Control, QA Lab, QA Matrix, Skill Workshop, Open Prose — akan dikerjakan di `low-priority-adaptation`.
- **Folder `skills/`** — adaptasi skills ecosystem adalah low priority, bukan medium.
- **CI/CD workflows** — GitHub Actions setup adalah feature terpisah.
- **Docker/deployment** — containerization adalah feature terpisah.
- **Perubahan pada `src/domain/types.ts`** — domain contract tidak diubah dalam adaptasi ini.
- **Perubahan pada agent implementations** (`src/agents/`) — agent logic tidak disentuh kecuali untuk integrasi extension yang diperlukan.
- **Multi-tenant boundary** — runtime app tetap single-operator shell untuk fase ini.
