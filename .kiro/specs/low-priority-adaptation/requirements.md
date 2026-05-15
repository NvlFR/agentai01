# Requirements Document

## Introduction

Feature **low-priority-adaptation** adalah tahap ketiga dan terakhir adaptasi dari referensi OpenClaw ke AI Company Runtime Platform. Dikerjakan setelah fondasi inti (`foundation-adaptation`) dan kapabilitas medium (`medium-priority-adaptation`) sudah stabil dan matang.

Scope adaptasi mencakup dua area:

1. **Folder `skills/`** — skill ecosystem untuk AI-assisted development, dikerjakan setelah core platform benar-benar mapan agar repo tidak melebar terlalu cepat.
2. **Extensions low priority** — advanced capabilities yang bersifat enrichment dan ekspansi ekosistem: speech providers premium (ElevenLabs, Azure Speech, Microsoft), image/video generation providers (Fal, Runway, Comfy, Vydra), search tools tambahan (Perplexity, Firecrawl, SearXNG), tool plugins lanjutan (OpenShell, Phone Control), QA tooling lanjutan (QA Lab, QA Matrix), dan skills & coding agent tools (Skill Workshop, Open Prose).

Prinsip adaptasi tetap sama: bukan copy-paste, melainkan adopsi konsep yang relevan disesuaikan dengan stack dan arsitektur yang sudah ada. Item di level ini membawa kompleksitas operasional, biaya, atau security surface yang lebih besar — sehingga lebih aman dikerjakan setelah core platform benar-benar mapan.

---

## Glossary

- **Skills_Ecosystem**: Folder `skills/` yang berisi definisi skill yang dapat digunakan oleh AI agent untuk melakukan tugas-tugas spesifik.
- **Skill_Definition**: File yang mendefinisikan satu skill: nama, deskripsi, input schema, output schema, dan implementasi.
- **Skill_Registry**: Komponen yang mengelola daftar skill yang tersedia dan memungkinkan agent untuk menemukan dan menggunakan skill.
- **Premium_TTS**: Text-to-speech provider premium dengan kualitas suara lebih tinggi (ElevenLabs, Azure Speech, Microsoft TTS).
- **Image_Gen_Provider**: Provider generasi gambar (Fal, Comfy) yang mengimplementasikan Image_Generation_Core interface.
- **Video_Gen_Provider**: Provider generasi video (Runway, Vydra) yang mengimplementasikan Video_Generation_Core interface.
- **Advanced_Search**: Search tool dengan kemampuan lebih dari basic search (Perplexity dengan AI synthesis, Firecrawl dengan crawling, SearXNG self-hosted).
- **OpenShell**: Tool yang memungkinkan agent mengeksekusi shell commands dalam sandbox yang aman.
- **Phone_Control**: Tool yang memungkinkan agent berinteraksi dengan perangkat mobile via automation.
- **QA_Lab**: Environment QA yang lebih lengkap dengan kemampuan setup/teardown environment yang kompleks.
- **QA_Matrix**: Tool untuk menjalankan QA scenarios dalam matrix kombinasi (berbagai provider, model, konfigurasi).
- **Skill_Workshop**: Tool untuk membuat, mengedit, dan menguji skill definitions secara interaktif.
- **Open_Prose**: Tool untuk generasi dan editing teks panjang (artikel, dokumentasi, laporan) dengan kontrol gaya.
- **Extension_Contract**: Interface TypeScript yang harus diimplementasikan oleh setiap extension.
- **Sandbox**: Environment eksekusi yang terisolasi untuk mencegah operasi berbahaya.
- **Operator**: Pengguna yang mengoperasikan runtime platform.
- **Runtime_Platform**: Sistem keseluruhan AI Company Runtime Platform.

---

## Requirements

### Requirement 1: Skills Ecosystem

**User Story:** As a developer, I want a skills ecosystem, so that AI agents can discover and use reusable skill definitions to perform specialized tasks without reimplementing common patterns.

#### Acceptance Criteria

1. THE Skills_Ecosystem SHALL menyediakan `skills/` directory dengan struktur yang konsisten: setiap skill dalam subdirektori sendiri dengan `skill.json` manifest dan implementasi.
2. SETIAP Skill_Definition SHALL mengandung: `name`, `version`, `description`, `inputSchema`, `outputSchema`, dan referensi ke implementasi.
3. THE Skill_Registry SHALL dapat memuat skill dari `skills/` directory dan mengeksposnya ke agent via interface yang konsisten.
4. KETIKA agent meminta skill yang tidak ada, THE Skill_Registry SHALL mengembalikan error yang deskriptif dengan daftar skill yang tersedia.
5. THE Skills_Ecosystem SHALL mendukung versioning skill sehingga multiple versi skill dapat koeksistensi.
6. SETIAP skill SHALL dapat diuji secara independen via `bun test` tanpa memerlukan runtime yang berjalan.
7. THE Skill_Registry SHALL memvalidasi `inputSchema` sebelum mengeksekusi skill dan mengembalikan validation error yang deskriptif jika input tidak valid.
8. UNTUK SEMUA skill yang valid, mengeksekusi skill dengan input yang sama SHALL menghasilkan output yang deterministik (determinism property) kecuali skill secara eksplisit bersifat non-deterministic (misalnya LLM-based).
9. THE Skills_Ecosystem SHALL menyediakan `skills/README.md` yang menjelaskan cara membuat skill baru.
10. SETIAP skill SHALL mendokumentasikan apakah ia bersifat deterministic atau non-deterministic dalam manifestnya.

---

### Requirement 2: Premium TTS Providers

**User Story:** As a developer, I want premium TTS provider adapters (ElevenLabs, Azure Speech, Microsoft TTS), so that voice interfaces can use higher-quality voices when needed.

#### Acceptance Criteria

1. THE `elevenlabs` adapter SHALL mengimplementasikan TTS interface yang sama dengan `tts-local-cli` dari `medium-priority-adaptation`.
2. THE `elevenlabs` adapter SHALL dikonfigurasi via `ELEVENLABS_API_KEY` dan `ELEVENLABS_VOICE_ID` environment variables.
3. THE `azure-speech` adapter SHALL dikonfigurasi via `AZURE_SPEECH_KEY` dan `AZURE_SPEECH_REGION` environment variables.
4. THE `microsoft` adapter SHALL mendukung Microsoft Cognitive Services TTS dengan konfigurasi via `MICROSOFT_TTS_KEY`.
5. SETIAP premium TTS adapter SHALL menangani rate limiting dan quota errors dengan retry logic yang dapat dikonfigurasi.
6. KETIKA API key tidak valid atau quota habis, adapter SHALL mengembalikan error yang deskriptif tanpa mengekspos raw API response.
7. UNTUK SEMUA input teks yang valid, setiap TTS adapter SHALL menghasilkan audio output atau error — tidak pernah hang tanpa timeout (liveness property).
8. SETIAP adapter SHALL menerapkan timeout yang dapat dikonfigurasi via `<PROVIDER>_TTS_TIMEOUT_MS`.
9. THE premium TTS adapters SHALL tidak menyimpan audio ke disk kecuali secara eksplisit diminta.

---

### Requirement 3: Advanced Image Generation Providers

**User Story:** As a developer, I want advanced image generation providers (Fal, Comfy), so that agents can generate higher-quality or more customizable images.

#### Acceptance Criteria

1. THE `fal` adapter SHALL mengimplementasikan Image_Generation_Core interface dengan konfigurasi via `FAL_API_KEY`.
2. THE `comfy` adapter SHALL mendukung ComfyUI local instance dengan konfigurasi via `COMFY_BASE_URL`.
3. SETIAP image generation adapter SHALL mendukung konfigurasi: model, ukuran, steps, dan seed untuk reproducibility.
4. KETIKA seed yang sama digunakan dengan model dan parameter yang sama, `comfy` adapter SHALL menghasilkan gambar yang identik (reproducibility property).
5. SETIAP adapter SHALL menerapkan timeout yang dapat dikonfigurasi via `<PROVIDER>_IMAGE_TIMEOUT_MS`.
6. KETIKA generation gagal, adapter SHALL mengembalikan error yang deskriptif dengan informasi tentang penyebab kegagalan.
7. THE adapters SHALL tidak menyimpan gambar yang dihasilkan ke disk kecuali secara eksplisit diminta via konfigurasi.

---

### Requirement 4: Advanced Video Generation Providers

**User Story:** As a developer, I want advanced video generation providers (Runway, Vydra), so that agents can generate video content for richer deliverables.

#### Acceptance Criteria

1. THE `runway` adapter SHALL mengimplementasikan Video_Generation_Core interface dengan konfigurasi via `RUNWAY_API_KEY`.
2. THE `vydra` adapter SHALL mengimplementasikan Video_Generation_Core interface dengan konfigurasi yang sesuai.
3. SETIAP video generation adapter SHALL mendukung konfigurasi: model, durasi, resolusi, dan format output.
4. SETIAP adapter SHALL menerapkan timeout yang dapat dikonfigurasi — video generation bisa memakan waktu lama.
5. THE adapters SHALL mendukung polling status untuk generation yang berjalan async (submit → poll → retrieve).
6. KETIKA generation gagal atau timeout, adapter SHALL mengembalikan error yang deskriptif dan membersihkan resource yang dialokasikan.
7. UNTUK SEMUA generation yang berhasil, adapter SHALL mengembalikan URL atau path ke video yang dihasilkan (completeness property).

---

### Requirement 5: Advanced Search Tools

**User Story:** As a developer, I want advanced search tools (Perplexity, Firecrawl, SearXNG), so that agents have access to AI-synthesized search results, deep web crawling, and self-hosted search options.

#### Acceptance Criteria

1. THE `perplexity` tool SHALL mengimplementasikan Search_Tool interface dengan konfigurasi via `PERPLEXITY_API_KEY`.
2. THE `perplexity` tool SHALL mendukung mode AI-synthesized answer di samping raw search results.
3. THE `firecrawl` tool SHALL mendukung crawling website secara rekursif dengan konfigurasi depth dan domain restrictions.
4. THE `firecrawl` tool SHALL dikonfigurasi via `FIRECRAWL_API_KEY` atau self-hosted instance via `FIRECRAWL_BASE_URL`.
5. THE `searxng` tool SHALL mendukung self-hosted SearXNG instance dengan konfigurasi via `SEARXNG_BASE_URL`.
6. KETIKA crawling dengan `firecrawl`, tool SHALL menghormati `robots.txt` dan rate limiting.
7. UNTUK SEMUA query yang valid, setiap advanced search tool SHALL mengembalikan hasil atau error — tidak pernah `undefined` (completeness property).
8. THE `firecrawl` tool SHALL membatasi kedalaman crawl maksimum via `FIRECRAWL_MAX_DEPTH` untuk mencegah runaway crawling.
9. SETIAP `SearchResult` dari advanced tools SHALL mengandung minimal: `title`, `url`, `snippet`, dan `source` (nama tool yang menghasilkan).

---

### Requirement 6: OpenShell Tool

**User Story:** As a developer, I want an OpenShell tool, so that agents can execute shell commands in a controlled sandbox when needed for automation tasks.

#### Acceptance Criteria

1. THE OpenShell tool SHALL mengeksekusi shell commands dalam sandbox yang terisolasi dari host system.
2. THE OpenShell tool SHALL membatasi akses filesystem ke direktori yang dikonfigurasi via `OPENSHELL_ALLOWED_DIRS`.
3. THE OpenShell tool SHALL menerapkan timeout per command via `OPENSHELL_COMMAND_TIMEOUT_MS`.
4. THE OpenShell tool SHALL memblokir commands yang berpotensi berbahaya: `rm -rf /`, akses ke `/etc/passwd`, network calls ke luar allowlist, dll.
5. KETIKA command melebihi timeout, THE OpenShell tool SHALL menghentikan proses dan mengembalikan timeout error.
6. THE OpenShell tool SHALL mencatat setiap command yang dieksekusi ke audit log beserta: command, working directory, exit code, dan timestamp.
7. UNTUK SEMUA command yang dieksekusi, output SHALL dikembalikan sebagai string (stdout + stderr) atau error — tidak pernah hang tanpa timeout (liveness property).
8. THE OpenShell tool SHALL memerlukan `OPENSHELL_ENABLED=true` environment variable untuk aktif — disabled by default karena security surface yang besar.
9. SETIAP eksekusi command SHALL memerlukan validasi bahwa command tidak mengandung path traversal atau injection patterns (security property).

---

### Requirement 7: Phone Control Tool

**User Story:** As a developer, I want a phone control tool, so that agents can automate mobile device interactions for testing or automation workflows.

#### Acceptance Criteria

1. THE Phone_Control tool SHALL mendukung koneksi ke perangkat Android via ADB dan iOS via xcrun/libimobiledevice.
2. THE Phone_Control tool SHALL mendukung operasi dasar: tap, swipe, type text, screenshot, dan launch app.
3. THE Phone_Control tool SHALL dikonfigurasi via `PHONE_CONTROL_DEVICE_ID` untuk menentukan target device.
4. KETIKA device tidak tersedia atau tidak terhubung, tool SHALL mengembalikan error yang deskriptif.
5. THE Phone_Control tool SHALL mencatat setiap aksi ke audit log beserta: aksi, device ID, dan timestamp.
6. THE Phone_Control tool SHALL memerlukan `PHONE_CONTROL_ENABLED=true` environment variable untuk aktif — disabled by default.
7. UNTUK SEMUA screenshot yang diambil, tool SHALL mengembalikan image data atau path ke file — tidak pernah empty response (completeness property).

---

### Requirement 8: QA Lab

**User Story:** As a developer, I want a QA Lab environment, so that I can run complex QA scenarios that require full environment setup and teardown, including database seeding and service mocking.

#### Acceptance Criteria

1. THE QA_Lab SHALL menyediakan kemampuan setup environment yang kompleks: database seeding, service mocking, dan konfigurasi runtime yang terisolasi.
2. THE QA_Lab SHALL mendukung definisi lab environment via file konfigurasi di `qa/labs/`.
3. SETIAP lab environment SHALL dapat di-setup dan di-teardown secara programmatic via `qa/lab-runner.mjs`.
4. THE QA_Lab SHALL memastikan setiap lab run dimulai dari state yang bersih (clean state property).
5. KETIKA setup gagal, THE QA_Lab SHALL melakukan teardown parsial dan melaporkan langkah mana yang gagal.
6. THE QA_Lab SHALL mendukung paralel execution dari multiple lab environments yang terisolasi satu sama lain.
7. UNTUK SEMUA lab environments yang valid, setup-then-teardown SHALL mengembalikan sistem ke state sebelum setup (reversibility property).

---

### Requirement 9: QA Matrix

**User Story:** As a developer, I want a QA Matrix runner, so that I can run the same QA scenarios across multiple combinations of providers, models, and configurations to ensure consistent behavior.

#### Acceptance Criteria

1. THE QA_Matrix SHALL mendefinisikan matrix kombinasi via file konfigurasi: daftar provider, model, dan parameter yang akan dikombinasikan.
2. THE QA_Matrix SHALL menjalankan setiap skenario QA untuk setiap kombinasi dalam matrix.
3. THE QA_Matrix SHALL menghasilkan laporan yang menunjukkan hasil per kombinasi: pass/fail, durasi, dan error jika ada.
4. THE QA_Matrix SHALL mendukung flag `--fail-fast` untuk berhenti pada kegagalan pertama.
5. KETIKA sebuah kombinasi gagal, THE QA_Matrix SHALL melanjutkan ke kombinasi berikutnya kecuali `--fail-fast` aktif.
6. THE QA_Matrix SHALL dapat dijalankan via `node qa/matrix.mjs` dengan konfigurasi matrix dari file.
7. UNTUK SEMUA kombinasi yang valid, hasil SHALL konsisten dengan menjalankan skenario secara manual dengan konfigurasi yang sama (equivalence property).

---

### Requirement 10: Skill Workshop

**User Story:** As a developer, I want a Skill Workshop tool, so that I can create, edit, test, and iterate on skill definitions interactively without manually editing JSON files.

#### Acceptance Criteria

1. THE Skill_Workshop SHALL menyediakan interface untuk membuat skill baru dari template.
2. THE Skill_Workshop SHALL memvalidasi skill definition secara real-time saat diedit.
3. THE Skill_Workshop SHALL memungkinkan testing skill dengan input sample tanpa deploy ke runtime.
4. THE Skill_Workshop SHALL dapat dijalankan via `node skills/workshop.mjs` atau `bun skills/workshop.mjs`.
5. KETIKA skill definition tidak valid, THE Skill_Workshop SHALL menampilkan error yang spesifik dengan lokasi masalah.
6. THE Skill_Workshop SHALL menghasilkan skill definition yang kompatibel dengan Skill_Registry.
7. UNTUK SEMUA skill yang dibuat via Skill_Workshop, skill SHALL dapat langsung digunakan oleh Skill_Registry tanpa modifikasi manual (compatibility property).

---

### Requirement 11: Open Prose Tool

**User Story:** As a developer, I want an Open Prose tool, so that agents can generate and edit long-form text content (articles, documentation, reports) with style control.

#### Acceptance Criteria

1. THE Open_Prose tool SHALL mendukung generasi teks panjang dari outline atau brief yang diberikan.
2. THE Open_Prose tool SHALL mendukung konfigurasi gaya penulisan: tone (formal/informal), panjang target, dan format output (Markdown, plain text).
3. THE Open_Prose tool SHALL mendukung editing teks yang sudah ada: expand, condense, rewrite, dan proofread.
4. THE Open_Prose tool SHALL menggunakan LLM provider yang aktif via interface yang sudah ada — tidak hardcode provider.
5. KETIKA output melebihi panjang target yang dikonfigurasi, tool SHALL memotong atau meringkas dengan graceful degradation.
6. THE Open_Prose tool SHALL tidak menyimpan konten yang dihasilkan ke disk kecuali secara eksplisit diminta.
7. UNTUK SEMUA input outline yang valid, tool SHALL menghasilkan teks atau error — tidak pernah empty string tanpa penjelasan (completeness property).

---

## Out of Scope

Item berikut secara eksplisit **tidak** termasuk dalam scope feature ini:

- **High priority items** — sudah dicakup di `foundation-adaptation`.
- **Medium priority items** — sudah dicakup di `medium-priority-adaptation`.
- **CI/CD workflows** — GitHub Actions setup adalah feature terpisah.
- **Docker/deployment** — containerization adalah feature terpisah.
- **Perubahan pada `src/domain/types.ts`** — domain contract tidak diubah dalam adaptasi ini.
- **Perubahan pada agent implementations** (`src/agents/`) — agent logic tidak disentuh kecuali untuk integrasi extension yang diperlukan.
- **Multi-tenant boundary** — runtime app tetap single-operator shell untuk fase ini.
- **Monetization atau billing** — bukan bagian dari adaptasi OpenClaw.
- **Mobile apps** (selain `apps/swabble/` yang sudah di medium) — di luar scope adaptasi ini.
