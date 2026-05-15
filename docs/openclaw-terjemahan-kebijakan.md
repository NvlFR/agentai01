# OpenClaw — Terjemahan `CLAUDE.md`, `SECURITY.md`, dan `VISION.md`

Dokumen ini adalah terjemahan dan penjelasan berbahasa Indonesia dari file kebijakan utama di `referensi/openclaw/`.

Catatan penting:

- `referensi/openclaw/CLAUDE.md` bukan file terpisah, tetapi symlink ke `AGENTS.md`
- karena itu, bagian `CLAUDE.md` di bawah pada praktiknya adalah terjemahan isi `AGENTS.md`

## 1. Terjemahan `CLAUDE.md` / `AGENTS.md`

### Tujuan dokumen

Dokumen ini adalah aturan kerja untuk AI agent yang mengubah, meninjau, atau memelihara repo OpenClaw. Isinya bukan panduan produk untuk user akhir, tetapi panduan operasi engineering untuk agent.

### Prinsip utama

- Gunakan referensi file relatif dari root repo, bukan path absolut.
- Sebelum bekerja di subtree tertentu, baca `AGENTS.md` yang scoped di area itu jika ada.
- Jangan menebak perilaku dependency, default, error, atau timing API. Baca docs, source, atau type upstream dulu.
- Jangan pernah mencetak secret.
- Jika dependency hilang, jalankan install lalu retry satu kali; kalau masih gagal, laporkan error pertama yang paling actionable.
- Untuk wording publik, gunakan istilah "plugin", sedangkan `extensions/` dianggap nama internal struktur repo.

### Peta repo menurut dokumen ini

Dokumen memetakan area utama seperti:

- `src/`, `ui/`, `packages/` sebagai core TypeScript surface
- `extensions/` sebagai plugins
- `src/plugin-sdk/*` sebagai seam resmi plugin ke core
- `src/channels/*` untuk channel runtime
- `src/plugins/*` untuk loader plugin
- `src/gateway/protocol/*` untuk protocol gateway
- `docs/` dan `apps/` untuk documentation dan companion apps

### Aturan arsitektur

Ini bagian paling penting dari `AGENTS.md`.

- Core harus tetap plugin-agnostic.
- Plugin hanya boleh masuk ke core melalui surface resmi seperti `openclaw/plugin-sdk/*`, metadata manifest, helper runtime yang didokumentasikan, atau barrel exports yang disetujui.
- Kode produksi plugin tidak boleh mengimpor langsung `src/**` milik core, `src/plugin-sdk-internal/**`, atau source plugin lain.
- Core dan test juga tidak boleh bergantung pada internal source plugin secara dalam.
- Owner-specific logic sebaiknya hidup di plugin milik owner tersebut, bukan di core umum.
- Dependency ownership harus mengikuti runtime ownership. Dependency yang hanya dipakai plugin harus tetap hidup di plugin, bukan dinaikkan ke root tanpa alasan kuat.
- Setiap seam baru harus backward-compatible, terdokumentasi, dan layak dipakai plugin pihak ketiga.

Intinya: OpenClaw ingin core yang stabil dan generik, sedangkan perilaku opsional atau vendor-specific didorong ke plugin.

### Aturan command dan workflow

- Runtime target adalah Node 22+.
- Gunakan `pnpm` sesuai standar repo.
- Jalankan CLI lewat `pnpm openclaw ...` atau `pnpm dev`.
- Untuk test di checkout normal, gunakan wrapper repo seperti `pnpm test ...`, bukan `vitest` mentah.
- Dalam worktree Codex, hindari `pnpm test*` langsung; pakai `node scripts/run-vitest.mjs`.
- Untuk check besar di worktree Codex, gunakan Crabbox/Testbox.
- Untuk formatting, gunakan `oxfmt`, bukan Prettier.
- Untuk lint, gunakan wrapper repo seperti `scripts/run-oxlint.mjs`.

### Aturan validasi

- Test kecil dan sempit boleh dijalankan lokal.
- Test besar, full suite, Docker E2E, cross-OS, atau live verification diarahkan ke Crabbox/Testbox.
- Sebelum handoff atau push, perubahan harus dibuktikan dengan test/check yang relevan.
- Jika proof terblokir, agent harus menjelaskan dengan spesifik apa yang gagal dan kenapa.
- Jangan membiarkan format/lint/type/build/test yang relevan tetap gagal.

### Aturan GitHub dan PR

- Gunakan tooling GitHub/CLI, bukan web search, untuk melihat PR atau issue.
- Referensi issue/PR tanpa instruksi eksplisit berarti cukup review dan laporkan, bukan langsung mutasi.
- Jangan memberi komentar, label, retitle, rebase, merge, atau close tanpa diminta.
- Jika suatu issue memang sudah diputuskan tidak akan ditindaklanjuti, maintainer diminta menutup semua issue/PR terkait dengan alasan yang jelas.
- Jawaban review harus fokus pada bug, perilaku, surface terdampak, evidence kode/test/CI, dan status current behavior.
- Landing PR yang mengubah perilaku biasanya butuh changelog.

### Aturan coding

- TypeScript ESM, strict.
- Hindari `any`; lebih baik gunakan type riil atau `unknown` dengan narrowing.
- Jangan pakai `@ts-nocheck`.
- Validasi external boundary sebaiknya memakai `zod` atau schema helper yang sudah ada.
- Hindari branching longgar berbasis string bebas kalau bisa pakai discriminated union.
- Jaga dynamic import boundary dengan benar.
- Hindari import cycle.
- Komentar kode harus pendek dan hanya untuk logika yang rumit atau rawan bug.

### Aturan testing

- Gunakan Vitest.
- Test diutamakan berbasis perilaku, bukan sekadar grep string.
- Test harus membersihkan timer, env, global, mock, socket, temp dir, dan module state.
- Jangan mengubah baseline/snapshot/ignore hanya untuk membungkam test tanpa izin eksplisit.
- Jangan menjalankan banyak command Vitest independen bersamaan di worktree yang sama.

### Aturan docs dan changelog

- Perubahan perilaku atau API harus diikuti perubahan docs.
- Changelog satu baris per bullet.
- Kontributor manusia yang dikreditkan boleh disebut, tetapi bot tidak.
- Untuk upgrade harness tertentu, dokumen terkait juga harus ikut diperbarui.

### Aturan Git

- Commit dilakukan lewat `scripts/committer`, bukan `git commit` manual.
- Stage hanya file yang memang dimaksud.
- Jangan stash, ganti branch, atau ganti worktree tanpa diminta.
- Pada branch `main`, tidak boleh membuat merge commit.
- Jika user berkata "commit", commit hanya perubahan yang Anda buat.
- Jika user berkata "ship it", lakukan changelog jika perlu, commit, rebase, lalu push.

### Aturan security dan release

- Jangan commit phone number nyata, video rahasia, credential, atau config live.
- Dependency patch/override/vendor change butuh approval eksplisit.
- Release, publish, dan version bump juga butuh approval eksplisit.

### Makna praktis `CLAUDE.md` / `AGENTS.md`

Dokumen ini pada dasarnya mengatakan:

- OpenClaw sangat ketat soal boundary arsitektur
- workflow test dan release harus lewat wrapper resmi
- plugin adalah titik ekstensi utama, bukan modifikasi core sembarangan
- agent tidak boleh improvisasi liar pada repo sebesar ini

## 2. Terjemahan `SECURITY.md`

### Pesan pembuka

Kalau seseorang menemukan isu keamanan di OpenClaw, laporkan secara privat terlebih dahulu.

Dokumen ini menegaskan dua hal:

- jalur disclosure yang benar
- trust model yang dipakai maintainer saat menilai apakah sesuatu benar-benar vulnerability

OpenClaw diposisikan sebagai infrastruktur agent local-first untuk operator terpercaya, bukan sistem multi-tenant untuk user yang saling bermusuhan dalam satu gateway.

### Cara melaporkan isu keamanan

Laporan diarahkan ke repo yang relevan:

- core CLI dan gateway: repo `openclaw/openclaw`
- macOS, iOS, Android app: masih di repo yang sama, tapi area `apps/...`
- ClawHub: repo `openclaw/clawhub`
- trust/threat model: repo `openclaw/trust`

Jika ragu, email ke `security@openclaw.ai`.

Untuk isu OpenClaw core:

- gunakan GitHub Security Advisory yang privat
- jangan buat public issue atau PR yang mengungkap vulnerability yang belum dipatch

Maintainer berhak menutup atau menyembunyikan issue/PR publik yang membuka exploit path, secret, atau proof of concept sensitif.

### Jenis laporan yang diprioritaskan

Laporan akan lebih cepat ditangani jika:

- masalahnya reproducible
- ada dampak nyata
- ada bukti boundary keamanan yang benar-benar terlewati
- ada detail versi atau commit SHA
- ada saran remedi atau patch fokus

OpenClaw menekankan bahwa laporan hasil scanner tanpa reproduksi, tanpa impact, atau hanya berupa AI-generated finding biasanya diprioritaskan rendah.

### Yang biasanya bukan security bug

Beberapa contoh yang secara eksplisit dianggap bukan vulnerability:

- prompt injection tanpa bypass policy, auth, approval, sandbox, atau tool boundary
- operator terpercaya memakai fitur lokal yang memang sengaja disediakan, seperti shell access atau browser/script execution
- plugin jahat setelah operator terpercaya sendiri meng-install atau mengaktifkannya
- banyak user yang saling bermusuhan berbagi satu gateway lalu berharap ada isolasi per-user
- scanner-only report atau dependency-only report tanpa PoC dan tanpa dampak terhadap boundary OpenClaw
- deployment publik atau risky setup yang sebenarnya sudah diperingatkan oleh dokumentasi

### Acceptance gate untuk laporan

Untuk triage tercepat, OpenClaw meminta laporan menyertakan:

- path file/fungsi/line yang rentan
- versi atau commit SHA yang diuji
- PoC terhadap `main` terbaru atau rilis terbaru
- bila menyasar versi rilis, bukti dari tag/artefak yang benar-benar dirilis
- untuk dependency CVE, bukti versi dependency yang terkena plus dampak nyata melalui OpenClaw
- bukti impact yang sesuai dengan trust boundary OpenClaw
- untuk laporan exposed secret, bukti bahwa credential itu benar-benar milik infrastruktur OpenClaw
- penjelasan bahwa laporan tidak bergantung pada model multi-tenant yang memang di luar trust model OpenClaw

Kalau syarat ini tidak ada, laporan bisa ditutup sebagai `invalid` atau `no-action`.

### False positive patterns yang sering muncul

Dokumen ini sangat rinci. Beberapa pola false positive yang sering disebut antara lain:

- prompt injection murni
- fitur operator-lokal yang dipresentasikan seolah remote exploit
- penggunaan `canvas.eval`, browser evaluate, atau `node.invoke` tanpa bukti bypass boundary
- plugin yang memang sudah dipercaya lalu bertindak dengan privilege host
- asumsi adanya scoped auth pada endpoint compatibility HTTP padahal yang dipakai adalah shared operator secret
- claim SSRF terhadap fitur proxy routing yang sebenarnya operator-managed
- DoS/ReDoS yang hanya mungkin lewat konfigurasi yang memang diisi operator terpercaya
- test harness, QA lab, benchmark rig, atau debug tooling yang bukan production surface

Intinya, OpenClaw sangat membedakan antara:

- perilaku kuat tapi disengaja dalam trust boundary operator
- dan vulnerability sungguhan yang menembus boundary tersebut

### Trust model operator

Ini inti filosofinya:

- satu gateway tidak dianggap sebagai boundary multi-tenant
- caller yang berhasil auth ke Gateway diperlakukan sebagai operator terpercaya untuk instance itu
- localhost Control UI dan WebSocket yang auth dengan shared secret juga masuk bucket operator terpercaya yang sama
- endpoint HTTP compatibility seperti `/v1/chat/completions`, `/v1/responses`, dan `/tools/invoke` juga diperlakukan sebagai surface operator penuh jika memakai shared-secret auth
- `sessionKey`, session ID, atau label session adalah routing control, bukan authorization boundary
- kalau satu operator bisa melihat data operator lain pada gateway yang sama, itu dianggap expected behavior dalam trust model ini

Rekomendasi operasional yang mereka berikan:

- satu user per mesin atau VPS
- satu gateway per user
- kalau perlu banyak user, pisahkan host atau boundary OS-user

Mereka juga menegaskan bahwa:

- exec default bersifat host-first
- sandbox isolation harus diaktifkan secara eksplisit jika memang dibutuhkan

### Trust pada plugin

Plugin dan extension dianggap bagian dari trusted computing base.

Artinya:

- memasang plugin berarti memberi plugin level trust yang setara dengan code lokal di host gateway
- plugin boleh membaca env/file atau menjalankan command dalam boundary itu
- laporan security tentang plugin harus menunjukkan bypass boundary, misalnya plugin bisa dimuat tanpa auth, menembus allowlist, atau menembus sandbox

Jadi, "plugin jahat bisa melakukan hal berbahaya" sendiri bukan bug, karena plugin memang dianggap code terpercaya setelah diinstal operator.

### Hal-hal yang out of scope

Dokumen menyebut banyak item out of scope, contohnya:

- public internet exposure
- deployment yang bertentangan dengan rekomendasi docs
- test-only code dan maintainer harness
- skenario multi-user adversarial dalam satu gateway host/config
- prompt injection murni
- serangan yang butuh write access ke trusted local state
- exploit yang bergantung pada symlink/hardlink state yang sudah lebih dulu ditanam di local path tepercaya
- perilaku dari plugin yang memang sudah trusted-installed
- heuristic drift atau parity drift tanpa boundary bypass nyata

### Makna praktis `SECURITY.md`

OpenClaw memosisikan keamanan secara realistis:

- ini adalah personal/trusted-operator platform
- bukan SaaS multi-tenant
- karena itu banyak hal yang di sistem lain mungkin dianggap privilege escalation, di sini dianggap expected behavior jika dilakukan oleh operator yang sah

Security bug yang benar menurut dokumen ini adalah bug yang menembus auth, allowlist, approval, sandbox, atau trust boundary yang memang didokumentasikan.

## 3. Terjemahan `VISION.md`

### Gagasan utama

OpenClaw ingin menjadi AI yang benar-benar melakukan sesuatu, bukan hanya menjawab chat.

Dia berjalan:

- di perangkat atau environment milik user
- di channel yang dipakai user
- dengan aturan yang dikontrol user sendiri

### Asal-usul

Visi ini lahir dari project pribadi untuk belajar AI, lalu berevolusi:

- Warelay
- Clawdbot
- Moltbot
- OpenClaw

Ini menunjukkan OpenClaw berkembang dari eksperimen personal menjadi platform agent yang lebih serius.

### Tujuan produk

Tujuan intinya:

- menjadi asisten personal yang benar-benar berguna
- mudah dipakai
- mendukung banyak platform
- tetap menghormati privasi dan keamanan

### Prioritas saat ini

Prioritas yang ditekankan dokumen:

- keamanan dan default yang aman
- bug fixes dan stabilitas
- reliability setup
- UX first-run/onboarding

Ini berarti fase sekarang lebih fokus pada fondasi dan keandalan daripada ekspansi fitur liar.

### Prioritas berikutnya

Setelah fondasi makin matang, fokus berikutnya adalah:

- dukungan semua provider model utama
- lebih banyak channel messaging
- performa dan infrastruktur testing
- kemampuan computer-use dan harness agent yang lebih baik
- ergonomi CLI dan frontend web
- companion apps macOS, iOS, Android, Windows, dan Linux

### Sikap terhadap plugin dan memory

Dokumen visi juga menegaskan bahwa:

- core sebaiknya tetap lean
- capability opsional sebaiknya hidup sebagai plugin
- jika sesuatu belum bisa dibangun sebagai plugin, lebih baik memperluas plugin API daripada menumpuk core dengan behavior khusus

Ada dua gaya plugin yang dibahas:

- code plugins: cocok untuk runtime hooks yang dalam
- bundle-style plugins: cocok untuk skill, MCP server, dan surface stabil lain

Preferensi mereka condong ke bundle-style plugin jika kebutuhan bisa dipenuhi di sana, karena boundary-nya lebih kecil dan lebih aman.

### Pandangan terhadap skills

OpenClaw masih membundel beberapa skill dasar untuk UX minimum.

Namun arah jangka panjangnya:

- skill baru sebaiknya dipublikasikan lewat ClawHub
- bukan langsung ditambahkan ke core

Promosi menjadi bundled/offical skill harus punya alasan product, security, atau maintainer ownership yang jelas.

### Pandangan terhadap MCP

OpenClaw mendukung MCP sebagai:

- server
- surface integrasi runtime

Tetapi mereka ingin dukungan MCP yang pragmatis, bukan duplikasi dari jalur lain seperti plugin, ACPX, atau ClawHub.

### Pandangan terhadap setup

Saat ini OpenClaw sengaja terminal-first.

Alasannya:

- setup jadi eksplisit
- user melihat docs, auth, permission, dan security posture sejak awal

Mereka ingin onboarding jadi lebih mudah di masa depan, tetapi tidak ingin convenience wrapper yang menyembunyikan keputusan keamanan penting.

### Mengapa TypeScript

OpenClaw dipilih berbasis TypeScript karena:

- sifatnya adalah sistem orkestrasi prompt, tools, protocol, dan integrasi
- TypeScript lebih mudah di-hack, dibaca, dan diperluas
- iterasinya cepat dan basis penggunanya luas

### Hal-hal yang tidak akan di-merge untuk saat ini

Dokumen ini cukup tegas soal guardrail roadmap. Yang tidak ingin mereka merge dulu antara lain:

- skill core baru yang sebenarnya bisa hidup di ClawHub
- full-doc translation set untuk semua docs
- integrasi layanan komersial yang bukan kategori model provider
- wrapper channel di atas channel yang sebenarnya sudah didukung
- pekerjaan MCP yang cuma menduplikasi jalur plugin, ACPX, atau ClawHub
- framework agent-hierarchy berat seperti manager-of-managers
- orchestration layer berat yang menduplikasi infrastruktur agent/tool yang sudah ada

Pernyataan ini penting karena menunjukkan OpenClaw tidak ingin menjadi framework yang terlalu gemuk dan terlalu abstrak.

### Makna praktis `VISION.md`

Visi OpenClaw bisa diringkas begini:

- bangun asisten pribadi yang benar-benar bisa bekerja
- utamakan keamanan, stabilitas, dan kontrol user
- pertahankan core yang ramping
- dorong ekosistem capability ke plugin
- hindari kompleksitas arsitektur yang mewah tapi tidak benar-benar membantu user

## Ringkasan Akhir

Kalau tiga dokumen ini dibaca bersama, pesan besarnya sangat konsisten:

- `CLAUDE.md` / `AGENTS.md` menjelaskan cara engineer/agent bekerja dengan disiplin
- `SECURITY.md` menjelaskan batas trust dan definisi vulnerability menurut OpenClaw
- `VISION.md` menjelaskan arah produk: personal agent yang kuat, aman, modular, dan tidak terlalu gemuk

Dengan kata lain, OpenClaw dibangun di atas tiga prinsip besar:

- operator trust yang jelas
- plugin-first extensibility
- engineering discipline yang ketat
