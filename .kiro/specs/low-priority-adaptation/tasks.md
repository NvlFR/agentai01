# Tasks

## Low Priority Adaptation

---

## Task List

- [ ] 1. Build Skills Ecosystem Foundation
  - [ ] 1.1 Buat struktur `skills/` dengan satu skill per folder, `skill.json`, implementasi, dan test independen
  - [ ] 1.2 Definisikan schema manifest skill: `name`, `version`, `description`, `inputSchema`, `outputSchema`, `implementation`, dan flag `deterministic`
  - [ ] 1.3 Implementasikan `Skill_Registry` untuk discovery, version resolution, dan execution
  - [ ] 1.4 Tambahkan validasi input schema dan error deskriptif untuk skill yang tidak ada atau input invalid
  - [ ] 1.5 Tambahkan `skills/README.md` untuk authoring convention dan lifecycle skill baru

- [ ] 2. Integrate Premium TTS Providers
  - [ ] 2.1 Implementasikan adapter `elevenlabs` di atas TTS interface yang sama dengan `tts-local-cli`
  - [ ] 2.2 Implementasikan adapter `azure-speech` dengan config `AZURE_SPEECH_KEY` dan `AZURE_SPEECH_REGION`
  - [ ] 2.3 Implementasikan adapter `microsoft` untuk Microsoft Cognitive Services TTS
  - [ ] 2.4 Tambahkan timeout, retry logic untuk rate limit/quota, dan normalized error handling tanpa raw API leakage
  - [ ] 2.5 Pastikan audio tidak ditulis ke disk kecuali caller secara eksplisit memintanya

- [ ] 3. Integrate Advanced Image Generation Providers
  - [ ] 3.1 Implementasikan adapter `fal` di atas `Image_Generation_Core`
  - [ ] 3.2 Implementasikan adapter `comfy` untuk instance ComfyUI lokal via `COMFY_BASE_URL`
  - [ ] 3.3 Tambahkan dukungan parameter `model`, `size`, `steps`, dan `seed`
  - [ ] 3.4 Tambahkan timeout dan error normalization untuk kegagalan generation
  - [ ] 3.5 Pastikan persistence ke disk bersifat opt-in saja

- [ ] 4. Integrate Advanced Video Generation Providers
  - [ ] 4.1 Implementasikan adapter `runway` di atas `Video_Generation_Core`
  - [ ] 4.2 Implementasikan adapter `vydra` dengan konfigurasi provider yang sesuai
  - [ ] 4.3 Tambahkan lifecycle async `submit`, `poll`, dan `retrieve`
  - [ ] 4.4 Tambahkan config `model`, `duration`, `resolution`, dan `output format`
  - [ ] 4.5 Tambahkan cleanup resource dan descriptive error saat generation gagal atau timeout

- [ ] 5. Add Advanced Search Tools
  - [ ] 5.1 Implementasikan tool `perplexity` di atas `Search_Tool` dengan mode raw results dan synthesized answer
  - [ ] 5.2 Implementasikan tool `firecrawl` dengan recursive crawling, depth limit, dan domain restrictions
  - [ ] 5.3 Implementasikan tool `searxng` untuk instance self-hosted via `SEARXNG_BASE_URL`
  - [ ] 5.4 Normalisasi semua hasil ke `SearchResult` dengan `title`, `url`, `snippet`, dan `source`
  - [ ] 5.5 Tambahkan policy layer untuk `robots.txt`, rate limiting, dan `FIRECRAWL_MAX_DEPTH`

- [ ] 6. Implement OpenShell Tool
  - [ ] 6.1 Buat tool `OpenShell` yang default disabled dan hanya aktif saat `OPENSHELL_ENABLED=true`
  - [ ] 6.2 Tambahkan sandbox boundary dan allowlist `OPENSHELL_ALLOWED_DIRS`
  - [ ] 6.3 Tambahkan validator command untuk dangerous commands, path traversal, dan injection patterns
  - [ ] 6.4 Tambahkan timeout `OPENSHELL_COMMAND_TIMEOUT_MS` dan forced process termination saat timeout
  - [ ] 6.5 Tambahkan audit log berisi command, working directory, exit code, timestamp, dan status eksekusi

- [ ] 7. Implement Phone Control Tool
  - [ ] 7.1 Buat unified driver layer untuk Android via ADB dan iOS via `xcrun` atau `libimobiledevice`
  - [ ] 7.2 Implementasikan aksi `tap`, `swipe`, `type text`, `screenshot`, dan `launch app`
  - [ ] 7.3 Tambahkan config `PHONE_CONTROL_DEVICE_ID` dan feature flag `PHONE_CONTROL_ENABLED=true`
  - [ ] 7.4 Tambahkan error deskriptif untuk device yang tidak tersedia atau tidak terhubung
  - [ ] 7.5 Tambahkan audit log per aksi termasuk device ID dan timestamp

- [ ] 8. Build QA Lab Platform
  - [ ] 8.1 Buat struktur `qa/labs/` untuk deklarasi lab environments
  - [ ] 8.2 Implementasikan `qa/lab-runner.mjs` untuk setup, run, dan teardown programmatic
  - [ ] 8.3 Tambahkan step model untuk database seeding, service mocking, env overrides, dan cleanup
  - [ ] 8.4 Pastikan setiap lab run mulai dari clean state dan punya partial teardown saat setup gagal
  - [ ] 8.5 Tambahkan isolasi resource agar multiple lab environments dapat berjalan paralel

- [ ] 9. Build QA Matrix Runner
  - [ ] 9.1 Definisikan format konfigurasi matrix untuk provider, model, dan parameter combinations
  - [ ] 9.2 Implementasikan `qa/matrix.mjs` untuk menjalankan skenario di seluruh kombinasi
  - [ ] 9.3 Tambahkan laporan hasil per kombinasi: pass/fail, durasi, dan error
  - [ ] 9.4 Tambahkan flag `--fail-fast` dengan perilaku kontrol flow yang jelas
  - [ ] 9.5 Verifikasi hasil matrix ekuivalen dengan eksekusi manual untuk kombinasi yang sama

- [ ] 10. Build Skill Workshop
  - [ ] 10.1 Buat `skills/workshop.mjs` atau padanan Bun sebagai interface authoring skill
  - [ ] 10.2 Tambahkan template generator untuk membuat skill baru
  - [ ] 10.3 Reuse validator `Skill_Registry` untuk validasi real-time manifest dan schema
  - [ ] 10.4 Tambahkan kemampuan menjalankan skill dengan sample input tanpa runtime penuh
  - [ ] 10.5 Pastikan output workshop langsung kompatibel dengan registry tanpa edit manual

- [ ] 11. Build Open Prose Tool
  - [ ] 11.1 Implementasikan tool `Open_Prose` di atas provider interface yang sudah aktif
  - [ ] 11.2 Tambahkan mode `generate`, `expand`, `condense`, `rewrite`, dan `proofread`
  - [ ] 11.3 Tambahkan kontrol `tone`, `target length`, dan `output format`
  - [ ] 11.4 Tambahkan graceful degradation saat output melebihi panjang target
  - [ ] 11.5 Pastikan konten tidak ditulis ke disk kecuali eksplisit diminta

- [ ] 12. Unify Extension Contracts and Registry Integration
  - [ ] 12.1 Definisikan `Extension_Contract` yang konsisten untuk provider dan tool low priority
  - [ ] 12.2 Integrasikan registrasi extension ke runtime app tanpa mengubah agent internals
  - [ ] 12.3 Tambahkan enable/disable gating berbasis config untuk semua extension opsional
  - [ ] 12.4 Normalisasi error contract agar caller mendapat pesan deskriptif yang konsisten

- [ ] 13. Add Security and Audit Guardrails
  - [ ] 13.1 Pastikan semua provider/tool baru memakai config dan secrets subsystem yang sudah ada
  - [ ] 13.2 Tambahkan structured logging untuk execution path extension yang signifikan
  - [ ] 13.3 Tambahkan audit event wajib untuk OpenShell, Phone Control, dan QA Lab
  - [ ] 13.4 Tambahkan sanitization agar secret atau raw vendor payload tidak bocor ke logs atau errors

- [ ] 14. Add Tests for Skills and Extensions
  - [ ] 14.1 Tambahkan unit tests independen untuk setiap skill definition sample
  - [ ] 14.2 Tambahkan contract tests untuk premium TTS, image/video providers, dan search tools dengan narrow mocks
  - [ ] 14.3 Tambahkan security tests untuk command validation, timeout, dan path restrictions di OpenShell
  - [ ] 14.4 Tambahkan device-unavailable dan screenshot completeness tests untuk Phone Control
  - [ ] 14.5 Tambahkan reversibility dan clean-state tests untuk QA Lab serta report consistency tests untuk QA Matrix

- [ ] 15. Prepare Documentation and Operator Guidance
  - [ ] 15.1 Dokumentasikan env vars baru untuk semua provider dan tools low priority
  - [ ] 15.2 Dokumentasikan risk profile dan default-off policy untuk OpenShell dan Phone Control
  - [ ] 15.3 Dokumentasikan workflow penggunaan `qa/lab-runner.mjs`, `qa/matrix.mjs`, dan `skills/workshop.mjs`
  - [ ] 15.4 Tambahkan contoh konfigurasi untuk skill manifests, matrix configs, dan lab configs

- [ ] 16. Final Validation Pass
  - [ ] 16.1 Verifikasi semua extension low priority tetap opsional dan runtime utama tetap jalan tanpa mereka
  - [ ] 16.2 Jalankan `npm run check` untuk memastikan boundary, security, dan dependency checks tetap hijau
  - [ ] 16.3 Jalankan `bun test` untuk memverifikasi skill tests, contract tests, dan QA tooling tests
  - [ ] 16.4 Jalankan smoke atau integration checks yang relevan untuk extension yang benar-benar diaktifkan
