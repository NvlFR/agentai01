# OpenClaw — Struktur Lengkap `referensi/openclaw`

Dokumen ini menjelaskan struktur nyata folder `referensi/openclaw` berdasarkan isi repo yang ada saat ini, bukan sekadar asumsi.

## Gambaran Umum Root

Folder `referensi/openclaw/` adalah monorepo besar yang menggabungkan:

- core runtime OpenClaw berbasis TypeScript
- kumpulan extension/plugin
- aplikasi native macOS, iOS, dan Android
- dashboard web
- dokumentasi Mintlify
- script build, release, QA, dan security tooling

Selain folder utama yang Anda minta, di root juga ada beberapa folder pendukung:

- `.agents/`: catatan dan skill internal untuk agent
- `.github/`: workflow CI, template issue/PR, labeler, CodeQL, dependabot
- `.vscode/`: task dan launch config untuk editor
- `.git/`: metadata Git repository
- `extensions/`: paket extension/plugin OpenClaw

## File-File Penting di Root

### File kebijakan dan dokumentasi utama

- `AGENTS.md`: panduan utama untuk AI agent yang bekerja di repo OpenClaw
- `CLAUDE.md`: symlink ke `AGENTS.md`, dipakai untuk kompatibilitas tooling/agent tertentu
- `SECURITY.md`: kebijakan security disclosure, trust model, scope laporan, dan boundary keamanan
- `VISION.md`: arah produk, prioritas, dan hal-hal yang belum akan di-merge
- `CONTRIBUTING.md`: panduan kontribusi
- `README.md`: dokumentasi utama project
- `CHANGELOG.md`: changelog utama repo
- `LICENSE`: lisensi project

### File build, package, dan workspace

- `package.json`: definisi scripts, dependencies, dan metadata package root
- `pnpm-workspace.yaml`: daftar workspace monorepo
- `pnpm-lock.yaml`: lockfile dependency
- `openclaw.mjs`: entry point CLI
- `tsconfig.core.projects.json`: pengaturan project TypeScript core

### File deployment dan lingkungan

- `Dockerfile`: image build untuk OpenClaw
- `docker-compose.yml`: compose untuk local/dev/deploy
- `fly.toml`: deploy config Fly.io
- `render.yaml`: deploy config Render
- `.env.example`: template environment variables
- `.crabbox.yaml`: konfigurasi Crabbox/Testbox

### File lint, format, dan quality gates

- `.oxlintrc.json`: konfigurasi oxlint
- `.oxfmtrc.jsonc`: konfigurasi oxfmt
- `.pre-commit-config.yaml`: pre-commit hooks
- `.semgrepignore`: ignore list untuk scanning
- `.npmrc`, `.gitignore`, `.dockerignore`, `.gitattributes`: konfigurasi repo standar

### File distribusi dan update

- `appcast.xml`: feed update aplikasi macOS

## Folder `apps/`

Folder `apps/` berisi aplikasi klien/native dan library Swift pendukung.

### `apps/android/`

Ini adalah aplikasi Android berbasis Kotlin + Jetpack Compose.

Isi pentingnya:

- `app/`: aplikasi utama Android
- `app/src/`: source utama app
- `benchmark/`: benchmark performa
- `gradle/libs.versions.toml`: version catalog dependency
- `scripts/`: script untuk release AAB dan benchmark performa
- `build.gradle.kts`, `settings.gradle.kts`, `gradle.properties`: konfigurasi build Gradle
- `README.md`: panduan app Android
- `style.md`: pedoman style/implementasi UI
- `THIRD_PARTY_LICENSES/`: lisensi third-party asset/dependency

### `apps/ios/`

Ini adalah aplikasi iOS berbasis SwiftUI, cukup besar dan dibagi per domain fitur.

Isi penting:

- `Sources/`: source utama iOS app
- `Sources/Chat/`: UI dan transport chat
- `Sources/Gateway/`: koneksi ke Gateway OpenClaw
- `Sources/Voice/`: fitur voice
- `Sources/Camera/`: akses kamera
- `Sources/Location/`: layanan lokasi
- `Sources/Media/`: media handling
- `Sources/Onboarding/`: alur setup pertama
- `Sources/Settings/`: pengaturan aplikasi
- `Sources/Status/`: status gateway dan indikator UI
- `Sources/Screen/`: screen record/screen tab
- `Sources/Push/`: push relay dan background beacon
- `Sources/Permissions/`: bridge izin sistem
- `Sources/Calendar/`, `Contacts/`, `Reminders/`, `Motion/`: integrasi native Apple
- `Sources/Model/`: state/model aplikasi
- `ActivityWidget/`: Live Activity widget
- `ShareExtension/`: share sheet extension
- `WatchApp/` dan `WatchExtension/`: Apple Watch companion
- `Tests/`: banyak unit test dan smoke test SwiftUI
- `fastlane/`: otomasi App Store/TestFlight
- `project.yml`: konfigurasi XcodeGen
- `VERSIONING.md`, `version.json`: pengelolaan versi
- `Config/`: signing dan version xcconfig
- `screenshots/`: screenshot app

### `apps/macos/`

Ini adalah companion app macOS berbasis Swift Package / SwiftUI.

Isi penting:

- `Sources/OpenClaw/`: aplikasi utama macOS
- `Sources/OpenClawDiscovery/`: discovery gateway lokal, kemungkinan via Bonjour/mDNS
- `Sources/OpenClawIPC/`: komunikasi IPC
- `Sources/OpenClawMacCLI/`: helper CLI untuk macOS
- `Tests/OpenClawIPCTests/`: test untuk layer IPC
- `Package.swift`, `Package.resolved`: konfigurasi Swift Package Manager
- `Icon.icon/`: aset ikon
- `Packaging/`: asset packaging seperti background DMG
- `README.md`: dokumentasi app macOS

### `apps/macos-mlx-tts/`

Helper TTS lokal untuk macOS berbasis MLX.

Isi penting:

- `Sources/OpenClawMLXTTSHelper/`: entry point helper
- `Package.swift`, `Package.resolved`: build config Swift package

### `apps/shared/OpenClawKit/`

Library Swift shared antara platform Apple.

Isi penting:

- `Sources/`: shared implementation
- `Tests/`: test library
- `Package.swift`: konfigurasi package

### `apps/swabble/`

Sub-project Swift terpisah bernama Swabble, berupa antarmuka/chat web-style atau service Swift.

Isi penting:

- `Sources/swabble/`: CLI entry point
- `Sources/SwabbleCore/`: logic inti
- `Sources/SwabbleKit/`: library reusable
- `Tests/SwabbleKitTests/`, `Tests/swabbleTests/`: test suite
- `docs/spec.md`: spesifikasi
- `scripts/format.sh`, `scripts/lint.sh`: tooling lokal
- `.github/workflows/`: workflow Swabble
- `Package.swift`, `README.md`, `CHANGELOG.md`, `LICENSE`

## Folder `changelog/`

Folder ini dipakai untuk changelog fragments sebelum digabung ke `CHANGELOG.md` root.

Isi saat ini:

- `fragments/`: folder potongan changelog
- `fragments/pr-signal-container-mode.md`: fragment changelog yang sudah ada

Fungsinya:

- setiap PR/fix bisa menambahkan satu file kecil di sini
- saat release, fragment digabung ke changelog utama
- ini membantu menjaga changelog tetap rapi dan bisa diaudit per perubahan

## Folder `config/`

Folder ini berisi konfigurasi tooling development, bukan runtime config OpenClaw.

Isi:

- `knip.config.ts`: konfigurasi Knip untuk mendeteksi dead code/unused exports
- `markdownlint-cli2.jsonc`: lint rule untuk Markdown
- `shellcheckrc`: aturan ShellCheck untuk bash script
- `swiftformat`: aturan format kode Swift
- `swiftlint.yml`: lint rules untuk Swift
- `tsconfig/oxlint.json`: basis konfigurasi oxlint
- `tsconfig/oxlint.core.json`: oxlint khusus area core
- `tsconfig/oxlint.extensions.json`: oxlint khusus extension
- `tsconfig/oxlint.scripts.json`: oxlint khusus scripts

## Folder `deploy/`

Folder ini kecil, khusus menyimpan file deploy tambahan yang tidak diletakkan di root.

Isi:

- `fly.private.toml`: konfigurasi Fly.io untuk instance private atau varian deployment tertentu

Perannya:

- memisahkan deploy profile tambahan dari `fly.toml` root
- berguna untuk skenario internal/private environment

## Folder `docs/`

Folder dokumentasi utama yang dipublish ke docs site OpenClaw. Struktur ini besar dan cukup matang.

### File penting di root `docs/`

- `index.md`: landing page docs
- `docs.json`: konfigurasi Mintlify/navigation
- `AGENTS.md`: panduan agent yang bekerja di area docs
- `CLAUDE.md`: symlink/pendamping untuk agent docs
- `ci.md`, `logging.md`, `network.md`, `pi.md`, `pi-dev.md`, `tts.md`, `vps.md`: dokumen tematik penting
- `style.css`, `nav-tabs-underline.js`: asset styling/customization docs
- `auth-credential-semantics.md`, `brave-search.md`, `date-time.md`, `perplexity.md`, `prose.md`: dokumen topik spesifik

### Subfolder utama `docs/`

- `.generated/`: baseline SHA dan artefak generated
- `.i18n/`: file glossary dan navigation untuk banyak bahasa
- `announcements/`: pengumuman fitur
- `assets/`: logo, install illustration, sponsor asset, showcase asset
- `automation/`: cron, hooks, taskflow, standing orders, webhook
- `channels/`: dokumentasi per channel seperti Telegram, Slack, Matrix, Signal, WhatsApp, Zalo, dan lain-lain
- `clawhub/`: dokumentasi publishing ke ClawHub
- `cli/`: referensi command CLI OpenClaw
- `concepts/`: konsep arsitektur dan runtime seperti agent loop, memory, queue, session, multi-agent
- `debug/`: panduan debug spesifik
- `diagnostics/`: flag/diagnostic docs
- `gateway/`: dokumentasi gateway, auth, network, sandboxing, protocol, secrets
- `help/`: FAQ, testing, troubleshooting
- `images/`: screenshot/diagram
- `install/`: panduan install di banyak platform dan provider
- `nodes/`: node audio, camera, images, location, talk, voice wake
- `plan/`: dokumen planning
- `platforms/`: panduan per platform seperti Android, iOS, Linux, Windows, Raspberry Pi
- `plugins/`: arsitektur plugin, SDK, compatibility, extension building
- `providers/`: dokumentasi provider model
- `refactor/`: catatan refactor internal
- `reference/`: referensi teknis
- `security/`: incident response, trust, proxy, dan topik security docs
- `snippets/`: potongan contoh untuk docs
- `start/`: getting started
- `superpowers/`: fitur advanced
- `tools/`: dokumentasi tools yang dipakai agent
- `web/`: control UI / web dashboard docs

### Folder `.i18n/`

Berisi:

- file `*-navigation.json` untuk menu docs per bahasa
- file `glossary.*.json` untuk glosarium istilah
- `translation-workflow.md`: alur penerjemahan docs

### Folder `.generated/`

Berisi:

- `config-baseline.sha256`
- `plugin-sdk-api-baseline.sha256`
- `README.md`

Artinya ada proses validasi/generated baseline yang dijaga sebagai bagian dari quality checks.

## Folder `git-hooks/`

Folder kecil yang menyimpan hook Git custom.

Isi:

- `pre-commit`: hook yang dijalankan sebelum commit

Fungsi:

- kemungkinan menjalankan validasi ringan sebelum commit
- menjaga format/lint/check minimum sebelum perubahan masuk ke repo

## Folder `packages/`

Folder ini berisi package internal/public yang dipisah dari `src/` agar bisa dipakai ulang atau dipublish.

### `packages/plugin-sdk/`

Public SDK untuk developer plugin.

Isi penting:

- `src/plugin-entry.ts`: contract entry plugin
- `src/plugin-runtime.ts`: runtime helpers
- `src/provider-auth.ts`, `provider-http.ts`, `provider-tools.ts`: API provider/plugin
- `src/security-runtime.ts`: helper security runtime
- `src/testing.ts`: util testing
- `src/video-generation.ts`, `text-runtime.ts`, `runtime-doctor.ts`: util domain-specific
- `package.json`, `tsconfig.json`

### `packages/sdk/`

SDK umum untuk integrasi eksternal.

Isi penting:

- `src/client.ts`: client utama
- `src/transport.ts`: transport abstraction
- `src/event-hub.ts`: event/hub logic
- `src/types.ts`: type publik
- `src/index.ts`: export utama
- `src/*.test.ts`, `*.e2e.test.ts`: test SDK

### `packages/plugin-package-contract/`

Type contract untuk manifest/plugin package.

Isi:

- `src/index.ts`: definisi contract
- `src/index.test.ts`: validasi contract
- `package.json`

### `packages/memory-host-sdk/`

SDK/interface untuk memory host dan runtime memory integration.

Isi penting:

- `src/engine.ts`, `engine-foundation.ts`, `engine-embeddings.ts`, `engine-qmd.ts`, `engine-storage.ts`: engine memory
- `src/query.ts`, `multimodal.ts`, `runtime.ts`: runtime/query API
- `src/runtime-cli.ts`, `runtime-core.ts`, `runtime-files.ts`: adapter runtime
- `src/host/`: implementasi detail seperti embeddings, batch upload, sqlite, SSRF policy, auth, config, file session
- `package.json`

Perbedaan penting:

- `packages/*` adalah paket yang bisa dikonsumsi dari luar
- `src/plugin-sdk/` dan `src/memory-host-sdk/` adalah implementasi internal core

## Folder `patches/`

Folder ini menyimpan patch dependency yang di-apply melalui pnpm patch.

Isi:

- `@agentclientprotocol__claude-agent-acp@0.33.1.patch`
- `baileys@7.0.0-rc11.patch`
- `.gitkeep`

Fungsi:

- memperbaiki dependency upstream tanpa menunggu release resmi
- memastikan build tetap reproducible karena patch ikut disimpan di repo

## Folder `qa/`

Folder ini berisi skenario QA manual/live dan utilitas credential broker untuk pengujian.

### File root

- `README.md`: panduan QA
- `scenarios.md`: daftar/indeks skenario QA
- `frontier-harness-plan.md`: rencana test frontier model/harness
- `new-scenarios-2026-04.md`: daftar skenario baru

### `qa/scenarios/`

Berisi skenario yang dikelompokkan per area:

- `agents/`: skenario subagent, forked context, handoff
- `channels/`: DM, group behavior, reactions, reconnect
- `character/`: uji persona/karakter
- `config/`: apply/restart/hot patch setup
- `media/`: image generation dan image understanding
- `memory/`: recall, isolation, active memory, dreaming
- `models/`: provider/model switching, Codex harness, OpenAI web search live
- `plugins/`: lifecycle plugin, MCP tools, skill visibility/install
- `runtime/`: approvals, retry, restart, streaming integrity, metrics
- `scheduling/`: cron behavior
- `security/`: redaction secret di logs
- `ui/`: control UI scenario
- `workspace/`: tugas agent di workspace/proyek
- `index.md`: entry point skenario

### `qa/convex-credential-broker/`

Mini-project Convex untuk menyediakan credential sementara saat QA live.

Isi:

- `README.md`
- `package.json`
- `convex.json`
- `convex/schema.ts`
- `convex/credentials.ts`
- `convex/crons.ts`
- `convex/http.ts`
- `convex/payload-validation.ts`
- `convex/tsconfig.json`

## Folder `scripts/`

Ini salah satu folder paling penting di repo. Fungsinya sebagai mesin otomasi untuk build, test, CI, release, docs, QA, dan maintainer workflow.

### File root scripts yang sangat penting

- `build-all.mjs`: build semua package penting
- `check.mjs`: menjalankan berbagai check utama
- `changelog-add-unreleased.ts`: menambah entry changelog
- `committer`: helper commit sesuai policy repo
- `docker-e2e.mjs`: jalankan E2E via Docker
- `install.sh`, `install.ps1`, `install-cli.sh`: installer
- `openclaw-prepack.ts`: persiapan publish package
- `release-check.ts`, `release-preflight.mjs`: validasi release
- `plugin-npm-publish.sh`, `plugin-clawhub-publish.sh`: publish plugin
- `protocol-gen.ts`, `protocol-gen-swift.ts`: generate protocol contract
- `generate-*.ts`: generate schema, metadata, baseline, inventory
- `check-*.mjs/ts/py`: berbagai boundary check, policy check, dependency check, docs check

### Subfolder penting

- `clawdock/`: helper script untuk ClawDock
- `dev/`: script development seperti smoke test dan realtime tooling
- `docker/`: helper Docker dan sandboxing
- `docs-i18n/`: tooling translasi docs
- `e2e/`: orchestrasi E2E test
- `github/`: otomasi GitHub
- `k8s/`: manifest/deploy Kubernetes
- `lib/`: shared library untuk scripts lain
- `mantis/`: automation internal CI/bot evidence
- `perf/`: profiling dan performance scripts
- `podman/`: alternatif Docker via Podman
- `pr-lib/`: library untuk PR workflow
- `pre-commit/`: script hook pre-commit
- `repro/`: script reproduksi bug
- `systemd/`: service/unit Linux
- `test-planner/`: tooling perencanaan test

Karakter folder `scripts/`:

- sangat banyak file validasi
- repository ini sangat menjaga architecture boundaries
- banyak script dibuat untuk menghindari regressions lintas plugin, runtime, docs, dan release surface

## Folder `security/`

Folder ini adalah tempat rule dan tooling scanning keamanan repo.

Isi:

- `README.md`: panduan penggunaan tooling security
- `opengrep/README.md`: panduan rule opengrep/semgrep custom
- `opengrep/precise.yml`: kumpulan rule presisi tinggi
- `opengrep/check-rule-metadata.mjs`: validasi metadata rules
- `opengrep/compile-rules.mjs`: compile rule set
- `opengrep/rules/openclaw-policy/`: rule custom policy OpenClaw

Fungsinya:

- mendeteksi pattern berbahaya atau antipattern keamanan
- memaksa metadata rule tetap konsisten
- menjadi guardrail khusus yang lebih spesifik daripada scanner generik

## Folder `skills/`

Folder ini berisi bundled skills yang bisa dipanggil agent. Setiap skill minimal memiliki `SKILL.md`.

### Pola isi folder skill

Umumnya satu skill berisi:

- `SKILL.md`: instruksi penggunaan skill
- `references/`: referensi tambahan jika perlu
- `scripts/`: helper script untuk skill tertentu
- `examples/` atau `bin/`: aset tambahan untuk skill tertentu

### Skill yang ada saat ini

Daftar skill di repo meliputi:

- `1password`
- `apple-notes`
- `apple-reminders`
- `bear-notes`
- `blogwatcher`
- `blucli`
- `camsnap`
- `canvas`
- `clawhub`
- `coding-agent`
- `discord`
- `eightctl`
- `gemini`
- `gh-issues`
- `gifgrep`
- `github`
- `gog`
- `goplaces`
- `healthcheck`
- `himalaya`
- `imsg`
- `mcporter`
- `model-usage`
- `nano-pdf`
- `node-connect`
- `notion`
- `obsidian`
- `openai-whisper`
- `openai-whisper-api`
- `openhue`
- `oracle`
- `ordercli`
- `peekaboo`
- `sag`
- `session-logs`
- `sherpa-onnx-tts`
- `skill-creator`
- `slack`
- `songsee`
- `sonoscli`
- `spotify-player`
- `summarize`
- `taskflow`
- `taskflow-inbox-triage`
- `things-mac`
- `tmux`
- `trello`
- `video-frames`
- `voice-call`
- `wacli`
- `weather`
- `xurl`

### Contoh skill yang punya isi tambahan

- `1password/`: punya `references/`
- `himalaya/`: punya `references/`
- `model-usage/`: punya `references/` dan `scripts/`
- `openai-whisper-api/`: punya `scripts/`
- `sherpa-onnx-tts/`: punya `bin/`
- `skill-creator/`: punya `scripts/` dan `license.txt`
- `taskflow/`: punya `examples/`
- `tmux/`: punya `scripts/`
- `video-frames/`: punya `scripts/`
- root `skills/pyproject.toml`: menandakan ada basis tooling Python untuk skill ecosystem ini

## Folder `src/`

Ini adalah jantung OpenClaw: core runtime TypeScript.

### File root di `src/`

- `entry.ts`: entry point utama
- `runtime.ts`: bootstrap runtime
- `index.ts`: export publik core

### Subfolder utama dan fungsinya

- `acp/`: Agent Communication Protocol
- `agents/`: engine eksekusi agent, tool use, sandbox, subagent, compaction
- `auto-reply/`: auto reply, command detection, heartbeat, thinking behavior
- `bindings/`: binding records
- `bootstrap/`: startup Node/env
- `channels/`: abstraction layer untuk semua channel
- `chat/`: render dan payload chat
- `cli/`: perintah CLI
- `commands/`: implementasi command seperti doctor, onboard, status, channels, backup
- `commitments/`: sistem commitments/tugas yang dijanjikan agent
- `compat/`: compatibility layer lama
- `config/`: schema, validation, loading, typing
- `context-engine/`: manajemen context window
- `crestodian/`: assistant setup/rescue
- `cron/`: scheduler dan isolated run
- `daemon/`: launchd/systemd/schtasks management
- `docs/`: test atau util terkait examples docs
- `flows/`: setup flows dan guided configuration
- `gateway/`: HTTP/WebSocket gateway, auth, tools, MCP, sessions
- `hooks/`: hook system
- `i18n/`: internationalization registry
- `image-generation/`: runtime image generation
- `infra/`: util file/network/process/heartbeat/update
- `interactive/`: interactive payload handling
- `link-understanding/`: pemahaman URL/link
- `logging/`: logging dan redaction
- `markdown/`: parsing/render Markdown
- `mcp/`: Model Context Protocol server/client
- `media/`: audio/video/image/PDF/QR handling
- `media-generation/`: runtime generasi media
- `media-understanding/`: image/audio/video understanding
- `memory/`: sistem memory inti
- `memory-host-sdk/`: implementasi internal memory host
- `model-catalog/`: discovery, normalisasi, index provider/model
- `music-generation/`: runtime musik
- `node-host/`: invoke system run dan exec policy
- `pairing/`: pairing device
- `plugin-sdk/`: implementasi internal plugin SDK
- `plugin-state/`: state store plugin, kemungkinan SQLite-backed
- `plugins/`: plugin loader, registry, manifest, install, hooks
- `process/`: spawn/kill/process management
- `provider-runtime/`: runtime provider dan retry
- `proxy-capture/`: HTTP proxy capture
- `realtime-transcription/`: transkripsi realtime
- `routing/`: routing pesan dan session lookup
- `scripts/`: test/logic tertentu untuk script surface
- `secrets/`: secrets resolution dan auth profile helpers
- `security/`: audit dan policy boundary security
- `sessions/`: lifecycle dan transcript sesi
- `shared/`: util bersama
- `status/`: status system
- `talk/`: talk/voice session
- `tasks/`: task registry dan store
- `terminal/`: util terminal
- `test-helpers/`: helper testing core
- `test-utils/`: util testing
- `tools/`: tool system
- `trajectory/`: export session/trajectory history
- `tts/`: text-to-speech
- `tui/`: terminal UI
- `types/`: deklarasi type untuk external libs
- `utils/`: util umum
- `video-generation/`: runtime video
- `web/`: runtime provider web
- `web-fetch/`: content extraction/fetch
- `web-search/`: search runtime
- `wizard/`: setup wizard

Intinya, `src/` memisahkan concern secara cukup disiplin: runtime, protocol, channel, plugin, security, media, memory, dan UI terminal.

## Folder `test/`

Folder ini adalah infrastruktur testing lintas area, terpisah dari unit test yang colocated di `src/`.

### File root penting

- `setup.ts`: global test setup
- `setup.extensions.ts`, `setup.shared.ts`: setup per scope
- `setup-openclaw-runtime.ts`: helper bootstrap runtime test
- `test-env.ts`, `test-env.test.ts`: test environment helpers
- banyak `*.test.ts` untuk release, package, boundary, launcher, publish, SDK, plugin, web boundary

### Subfolder

- `fixtures/`: fixture JSON, config, sample package, contract input
- `helpers/`: helper harness seperti gateway E2E, temp repo, wizard prompter, plugin helpers
- `mocks/`: mock modul seperti `baileys.ts`
- `scripts/`: test khusus untuk semua script tooling di repo
- `tsconfig/`: konfigurasi TypeScript untuk berbagai suite test
- `vitest/`: file konfigurasi Vitest per area/subsuite

### Karakteristik `test/vitest/`

Folder ini sangat besar dan granular. Ada config terpisah untuk:

- `agents`
- `auto-reply`
- `channels`
- `cli`
- `commands`
- `contracts`
- `cron`
- `daemon`
- `gateway`
- `hooks`
- `infra`
- `logging`
- `media`
- `plugin-sdk`
- `plugins`
- `process`
- `secrets`
- `tasks`
- `tui`
- `ui`
- `wizard`
- extension per-channel/per-provider
- full suites dan unit-fast suites

Artinya, OpenClaw memakai strategi test matrix yang sangat detail, bukan satu konfigurasi Vitest tunggal.

## Folder `ui/`

Folder ini berisi Control UI berbasis web.

### File root penting

- `AGENTS.md`: panduan AI untuk area UI
- `CLAUDE.md`: pasangan/symlink untuk agent compatibility
- `index.html`: entry HTML
- `package.json`: dependency dan scripts UI
- `vite.config.ts`: konfigurasi build Vite
- `vitest.config.ts`, `vitest.node.config.ts`: konfigurasi test UI

### `ui/public/`

Berisi static asset:

- `favicon.ico`
- `favicon.svg`
- `favicon-32.png`
- `apple-touch-icon.png`
- `manifest.webmanifest`
- `sw.js`

### `ui/src/`

Berisi source utama UI:

- `main.ts`: entry point client app
- `styles.css`: global stylesheet
- `local-storage.ts`: helper local storage
- `css.d.ts`, `markdown-it-task-lists.d.ts`: type declarations
- `i18n/`: internasionalisasi UI
- `styles/`: CSS modules/style slices
- `test-helpers/`: helper test UI
- `types/`: type declarations
- `ui/`: komponen dan view utama dashboard

## Ringkasan Arsitektur

Kalau dilihat dari struktur foldernya, `referensi/openclaw` tersusun ke dalam lapisan besar berikut:

- `src/`: core runtime dan protocol
- `extensions/`: capability/plugin pack
- `packages/`: SDK dan contract yang bisa dipakai ulang
- `apps/`: client native
- `ui/`: dashboard web
- `docs/`: dokumentasi publik
- `scripts/`: otomasi engineering
- `test/` dan `qa/`: validasi otomatis dan manual
- `security/`: rule dan scanning policy
- `skills/`: skill bundle untuk agent

Struktur ini menunjukkan bahwa OpenClaw bukan sekadar chatbot CLI, tetapi platform agent lengkap dengan runtime, gateway, plugin system, apps, docs, dan operational tooling yang sangat luas.
