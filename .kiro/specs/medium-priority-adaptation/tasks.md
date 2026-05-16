# Tasks

## Medium Priority Adaptation

---

## Task List

- [ ] 1. Build QA Scenario Runner
  - [ ] 1.1 Buat struktur `qa/scenarios/`, `qa/helpers/`, dan entrypoint `qa/run.mjs`
  - [ ] 1.2 Definisikan schema `QA_Scenario` berisi nama, steps, dan assertions
  - [ ] 1.3 Implementasikan executor untuk step HTTP calls dan message sends
  - [ ] 1.4 Tambahkan reporting failure yang memuat nama skenario, langkah gagal, expected, dan actual
  - [ ] 1.5 Tambahkan flag `--scenario` dan `--base-url`, plus summary dan exit code yang konsisten

- [ ] 2. Add Git Hooks Workflow
  - [ ] 2.1 Buat hook `pre-commit` untuk menjalankan `npm run check`
  - [ ] 2.2 Buat hook `commit-msg` untuk validasi conventional commit format
  - [ ] 2.3 Buat hook `pre-push` untuk menjalankan `bun test`
  - [ ] 2.4 Tambahkan `git-hooks/install.mjs` dan `git-hooks/uninstall.mjs`
  - [ ] 2.5 Tambahkan error messages yang actionable dan dokumentasi bypass `--no-verify`

- [ ] 3. Introduce Dependency Patch System
  - [ ] 3.1 Buat struktur `patches/` dengan format file `<package-name>+<version>.patch`
  - [ ] 3.2 Tambahkan `postinstall` hook di `package.json` untuk apply patch secara otomatis
  - [ ] 3.3 Pilih `patch-package` atau mekanisme ekuivalen yang kompatibel dengan Bun/npm workflow repo
  - [ ] 3.4 Tambahkan failure reporting untuk mismatch package/version saat patch tidak bisa diaplikasikan
  - [ ] 3.5 Tambahkan `patches/README.md` untuk alasan, target package, dan tanggal pembuatan patch

- [ ] 4. Build AI-Assisted Development Workflow
  - [ ] 4.1 Buat `.agents/maintainer-notes/` dengan notes per area codebase utama
  - [ ] 4.2 Buat `.agents/skills/` dengan skill definitions ringan untuk workflow repo
  - [ ] 4.3 Tambahkan `.agents/README.md` yang menjelaskan struktur dan cara pakainya
  - [ ] 4.4 Definisikan convention update notes saat ada perubahan arsitektur signifikan
  - [ ] 4.5 Audit agar `.agents/` tidak mengandung secrets atau informasi sensitif

- [ ] 5. Build Changelog Management
  - [ ] 5.1 Buat `changelog/fragments/` dan `changelog/fragments/released/`
  - [ ] 5.2 Definisikan format fragment `<id>-<type>.md` dengan tipe `feat`, `fix`, `breaking`, dan `chore`
  - [ ] 5.3 Buat `changelog/template.md` sebagai template output
  - [ ] 5.4 Implementasikan `changelog/compile.mjs` dengan grouping per tipe dan sorting kronologis
  - [ ] 5.5 Tambahkan flag `--version` dan perpindahan fragment yang sudah dirilis

- [x] 6. Build Swabble Voice Interface App
  - [x] 6.1 Buat shell aplikasi standalone di `apps/swabble/`
  - [x] 6.2 Hubungkan input mikrofon ke `Speech_Core` untuk transkripsi
  - [x] 6.3 Hubungkan output runtime ke TTS untuk playback suara
  - [x] 6.4 Tambahkan fallback ke text mode jika speech backend unavailable
  - [x] 6.5 Tambahkan indikator visual `listening`, `processing`, `speaking`, dan `error`

- [x] 7. Add Additional LLM Provider Adapters
  - [x] 7.1 Implementasikan adapter `anthropic-vertex` di atas provider contract yang sama dengan provider existing
  - [x] 7.2 Implementasikan adapter `groq` dengan config `GROQ_API_KEY` dan `GROQ_MODEL`
  - [x] 7.3 Implementasikan adapter `gemini-cli` dengan config `GEMINI_API_KEY` dan `GEMINI_MODEL`
  - [x] 7.4 Normalisasi provider errors: rate limit, timeout, invalid key, dan provider unavailable
  - [x] 7.5 Tambahkan activation via config tanpa mengubah core runtime code path

- [x] 8. Add WhatsApp Channel
  - [x] 8.1 Buat channel WhatsApp untuk inbound dan outbound message runtime
  - [x] 8.2 Tambahkan config `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, dan `WHATSAPP_VERIFY_TOKEN`
  - [x] 8.3 Implementasikan validasi webhook signature Meta
  - [x] 8.4 Tambahkan allowlist `WHATSAPP_ALLOWED_NUMBERS`
  - [x] 8.5 Pastikan inbound valid message di-ack dalam 5 detik dan tidak menulis konten ke disk di luar audit log

- [x] 9. Add Advanced Memory Backends
  - [x] 9.1 Definisikan interface `Memory_Backend` yang konsisten untuk `store`, `retrieve`, `search`, dan `delete`
  - [x] 9.2 Implementasikan `memory-lancedb` dengan vector similarity search
  - [x] 9.3 Implementasikan `memory-wiki` untuk structured/full-text retrieval
  - [x] 9.4 Implementasikan `active-memory` untuk working memory sesi aktif
  - [x] 9.5 Tambahkan fallback ke `memory-core` saat backend opsional tidak tersedia

- [x] 10. Build Speech and Voice Core
  - [x] 10.1 Definisikan `Speech_Core` abstraction untuk STT dan TTS
  - [x] 10.2 Implementasikan backend STT `deepgram`
  - [x] 10.3 Implementasikan backend TTS `tts-local-cli`
  - [x] 10.4 Tambahkan normalized errors dan non-persistent audio handling
  - [x] 10.5 Pastikan consumer seperti `apps/swabble/` dapat tukar backend tanpa perubahan logic

- [x] 11. Build Image and Video Generation Core
  - [x] 11.1 Definisikan `Image_Generation_Core` untuk prompt-to-image
  - [x] 11.2 Definisikan `Video_Generation_Core` untuk prompt/image-to-video
  - [x] 11.3 Tambahkan konfigurasi `model`, ukuran/resolusi, format, dan timeout
  - [x] 11.4 Tambahkan normalized error path untuk backend unavailable atau quota exhausted
  - [x] 11.5 Siapkan pluggable interface agar provider low-priority bisa langsung menempel nanti

- [x] 12. Add Search and Web Tools
  - [x] 12.1 Definisikan `Search_Tool` contract dan `SearchResult` normalized shape
  - [x] 12.2 Implementasikan tool `brave`, `duckduckgo`, `exa`, dan `tavily`
  - [x] 12.3 Implementasikan tool `web-readability` untuk ekstraksi konten readable dari URL
  - [x] 12.4 Tambahkan config handling untuk provider yang butuh API keys
  - [x] 12.5 Tambahkan descriptive error handling tanpa crash atau `undefined` returns

- [/] 13. Add Tool Plugins
  - [x] 13.1 Definisikan `Extension_Contract` yang dipakai tool plugins medium priority
  - [/] 13.2 Implementasikan `canvas`, `document-extract`, `diffs`, `oc-path`, `llm-task`, dan `lobster`
  - [x] 13.3 Tambahkan path validation untuk semua plugin yang menerima file path
  - [x] 13.4 Tambahkan normalized error output tanpa internal stack trace leakage
  - [ ] 13.5 Integrasikan registry/loading mechanism untuk plugins ini di runtime app

- [/] 14. Add Diagnostics and Observability
  - [ ] 14.1 Implementasikan backend `diagnostics-otel`
  - [x] 14.2 Implementasikan backend `diagnostics-prometheus` dengan endpoint `/metrics`
  - [x] 14.3 Tambahkan spans/traces untuk handoff, approval, provider call, dan message routing
  - [x] 14.4 Tambahkan metrics minimum: request count, error rate, LLM latency, dan message throughput
  - [x] 14.5 Pastikan observability best-effort dan tidak pernah mengekspos secret values

- [ ] 15. Add Infrastructure Extensions
  - [ ] 15.1 Implementasikan `bonjour` untuk local runtime discovery via mDNS
  - [ ] 15.2 Implementasikan `device-pair` untuk pairing runtime dan device
  - [ ] 15.3 Implementasikan `tokenjuice` untuk token budget tracking per agent, project, dan provider
  - [ ] 15.4 Implementasikan `voyage` untuk embeddings dan `synthetic` untuk synthetic test data
  - [ ] 15.5 Tambahkan independent enable/disable config dan warning saat budget token mendekati limit

- [ ] 16. Add QA and Testing Extensions
  - [ ] 16.1 Implementasikan `qa-channel` sebagai virtual operator channel untuk automation
  - [ ] 16.2 Tambahkan recording dan replay capability untuk regression scenarios
  - [ ] 16.3 Implementasikan `test-support` helpers untuk project setup, lifecycle simulation, dan audit verification
  - [ ] 16.4 Pastikan behavior `qa-channel` ekuivalen dengan channel nyata di runtime
  - [ ] 16.5 Pastikan semua helper membersihkan state setelah test selesai

- [ ] 17. Add Thread Ownership Tracking
  - [ ] 17.1 Implementasikan `thread-ownership` state model per project dan per thread
  - [ ] 17.2 Tambahkan claim flow dengan conflict rejection jika thread sudah dimiliki agent lain
  - [ ] 17.3 Tambahkan transfer ownership dengan approval gate
  - [ ] 17.4 Tambahkan auto-release setelah `THREAD_OWNERSHIP_TIMEOUT_MS`
  - [ ] 17.5 Tambahkan audit log untuk claim, conflict, transfer, dan release

- [ ] 18. Unify Medium Extension Integration
  - [ ] 18.1 Integrasikan semua provider/channel/backend/tool medium ke runtime app lewat activation registry yang konsisten
  - [ ] 18.2 Pastikan semua extension dapat diaktifkan/dimatikan via config tanpa edit agent internals
  - [ ] 18.3 Reuse config, secrets, logging, dan security helpers dari foundation adaptation
  - [ ] 18.4 Tambahkan readiness/degraded reporting untuk extension opsional yang tidak aktif atau gagal start

- [ ] 19. Add Tests and Validation Coverage
  - [ ] 19.1 Tambahkan behavior tests untuk QA runner, changelog compiler, dan git hook validators
  - [ ] 19.2 Tambahkan contract tests untuk provider adapters, memory backends, speech core, generation core, dan search tools
  - [ ] 19.3 Tambahkan channel tests untuk WhatsApp dan QA virtual channel
  - [ ] 19.4 Tambahkan observability tests untuk metrics validity dan no-secret telemetry
  - [ ] 19.5 Tambahkan ownership round-trip dan token accounting tests

- [ ] 20. Final Validation Pass
  - [ ] 20.1 Verifikasi runtime utama tetap sehat ketika seluruh medium extensions opsional dimatikan
  - [ ] 20.2 Jalankan `npm run check` setelah semua integration hooks dan scripts terpasang
  - [ ] 20.3 Jalankan `bun test` untuk memverifikasi unit, contract, dan behavior tests
  - [ ] 20.4 Jalankan `npm run runtime:smoke` dan QA scenarios yang relevan untuk surface runtime yang disentuh
