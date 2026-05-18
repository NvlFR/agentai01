# Production Readiness Audit And Roadmap

## Ringkasan

Project `agentai01` saat ini memiliki fondasi yang cukup kuat untuk:

- eksperimen agent hierarchy
- local runtime orchestration
- terminal UI operator
- channel bridge awal
- MCP bootstrap dan wiring
- simulasi alur proyek end-to-end

Namun, project ini **belum siap live production**. Status saat ini lebih tepat disebut sebagai:

- advanced prototype
- local operations sandbox
- pre-production orchestration lab

Gap paling besar ada pada:

1. security boundary
2. persistent runtime backbone
3. real integration layer
4. observability
5. delivery pipeline
6. product/runtime governance

Dokumen ini merangkum apa saja yang harus disiapkan agar project bisa bergerak dari kondisi saat ini menuju runtime production yang layak.

---

## 1. Security Boundary

Semua endpoint mutasi wajib pakai auth yang konsisten.

Yang harus disiapkan:

- hapus fallback `dev-owner-token`
- semua endpoint mutasi wajib pakai auth yang setara `OperatorApiServer`
- pisahkan role:
  - read-only observer
  - operator
  - owner/approver
- tambahkan signed webhook verification untuk Telegram, WhatsApp, dan provider lain
- tambahkan rate limiting
- tambahkan IP allowlist atau API gateway di depan surface sensitif
- tambahkan audit trail yang immutable untuk directive, approval, retry, webhook, dan side effect penting

Implikasi:

- server utama tidak boleh lagi menerima directive, approval response, retry, atau webhook mutasi tanpa boundary auth
- auth tidak boleh hanya memeriksa “token ada”, tapi harus benar-benar memverifikasi role dan izin
- pemisahan surface demo dan live harus eksplisit

---

## 2. Persistent Runtime Backbone

Runtime tidak bisa production bila masih bergantung pada shell seeded dan state in-memory.

Yang harus disiapkan:

- ganti in-memory shell/seed dengan persistence nyata
- gunakan Postgres untuk state utama runtime
- job queue wajib durable:
  - Postgres-backed queue
  - atau Redis/BullMQ
- semua approval, job retry, message retry, dan audit event harus idempotent
- recovery setelah restart harus otomatis bisa reconstruct state
- artifacts, logs, dan operational state harus dipisah tapi tetap saling terhubung

State yang wajib durable:

- projects
- approvals
- runtime jobs
- message log
- audit log
- artifacts
- recovery snapshots

---

## 3. Real Integration Layer

Integrasi channel dan provider harus benar-benar nyata, bukan hanya simulasi atau logging.

Yang harus disiapkan:

- `/api/telegram/send` harus benar-benar kirim message atau document
- `/api/whatsapp/send` harus benar-benar kirim message
- channel webhook harus punya:
  - deduplication
  - replay protection
  - verification signature/provider authenticity
- provider AI harus punya:
  - quota handling
  - fallback model policy
  - circuit breaker
  - timeout budget yang konsisten
  - retry policy yang tidak membabi buta

Implikasi:

- channel bridge harus bisa dibedakan jelas antara mode local simulation dan mode live
- provider failure tidak boleh membuat workflow masuk ke state tak jelas

---

## 4. Observability

Production runtime tanpa observability akan sangat sulit dioperasikan dan di-debug.

Yang harus disiapkan:

- structured logs terpusat
- metrics minimum:
  - request latency
  - provider latency
  - failed approvals
  - retry counts
  - queue lag
- distributed tracing untuk flow:
  - directive
  - head agent
  - specialist
  - tool
  - approval
- alerting minimum:
  - provider down
  - webhook failure spike
  - queue stuck
  - auth failure spike

Tambahan yang penting:

- correlation id harus konsisten lintas HTTP, queue, provider, dan channel
- severity level harus jelas untuk audit dan operational issue

---

## 5. Delivery Pipeline

Project tidak bisa live production tanpa jalur delivery yang disiplin.

Yang harus disiapkan:

- staging environment yang benar-benar mirip production
- CI wajib menjalankan:
  - `check`
  - `test`
  - integration tests
  - smoke tests ke service nyata atau stub terkontrol
- containerization yang repeatable
- secrets manager
- deployment strategy
- rollback plan
- backup/restore procedure
- disaster recovery drill

Tambahan penting:

- harus ada environment separation yang tegas: dev, test, staging, production
- harus ada release gate sebelum mutasi surface live

---

## 6. Product And Runtime Governance

Runtime multi-agent production butuh aturan perilaku, bukan hanya aturan teknis.

Yang harus disiapkan:

- definisikan agent mana yang boleh melakukan side effect nyata
- tambahkan approval gates untuk aksi berisiko tinggi
- tentukan data retention policy
- tentukan PII policy
- tentukan masking policy
- untuk target healthcare atau banking, compliance tidak boleh ditunda

Contoh side effect nyata yang wajib di-govern:

- kirim pesan ke channel customer
- menjalankan workspace action destruktif
- memicu job retry massal
- update artefak klien
- menulis dokumen keputusan final

---

## Roadmap Yang Paling Realistis

### Phase 0: Hardening Minimum

Fokus:

- pindahkan server utama ke auth yang setara `OperatorApiServer`
- hapus default operator token
- matikan webhook dan directive mutasi tanpa auth atau verification
- tandai jelas surface demo vs live

Hasil yang diharapkan:

- tidak ada mutasi sensitif tanpa boundary auth
- tidak ada fallback token development di jalur live

### Phase 1: Durable Runtime

Fokus:

- ganti `RuntimeAppState` seeded jadi state yang load dari DB
- simpan approvals, messages, audit, jobs, dan artifacts ke persistence nyata
- tambahkan resume/recovery test

Hasil yang diharapkan:

- restart runtime tidak merusak workflow yang sedang berjalan
- approval dan audit tidak hilang setelah process restart

### Phase 2: Production Channels And Workers

Fokus:

- real Telegram/WhatsApp delivery
- durable worker queue
- retry policy
- dead-letter queue

Hasil yang diharapkan:

- channel dan worker punya perilaku operasional yang dapat diandalkan
- failure tidak silently disappear

### Phase 3: Ops And Scale

Fokus:

- metrics
- tracing
- alerting
- SLO
- load test
- security review
- penetration test ringan
- staging soak test minimal beberapa hari

Hasil yang diharapkan:

- runtime layak diuji sebagai kandidat production
- bottleneck utama, risk surface, dan operational noise sudah terlihat jelas

---

## Kesimpulan

Target production untuk `agentai01` itu realistis, tetapi butuh perubahan arsitektural dan operasional yang signifikan. Kunci utamanya bukan sekadar “menambah fitur”, melainkan:

- mengeraskan boundary keamanan
- membuat runtime durable
- mengubah integrasi simulatif menjadi integrasi nyata
- menyediakan observability dan governance yang cukup

Dokumen ini menjadi dasar audit dan arah implementasi untuk fase hardening berikutnya.
