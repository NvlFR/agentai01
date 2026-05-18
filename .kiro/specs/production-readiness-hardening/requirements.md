# Requirements Document

## Introduction

Dokumen ini mendefinisikan requirements untuk membawa `agentai01` dari kondisi saat ini sebagai **advanced prototype / local runtime sandbox** menjadi **candidate production runtime platform**.

Saat ini project sudah memiliki fondasi yang berguna:

- agent hierarchy dan sub-agent registry
- runtime app server, worker, scheduler, dan terminal UI
- agent creation flow
- approval model
- MCP bootstrap dan project config
- simulasi workflow end-to-end

Namun, project masih memiliki gap besar terhadap production readiness, terutama pada:

- security boundary
- persistent runtime backbone
- real integration layer
- observability
- delivery pipeline
- product/runtime governance

Spec ini merumuskan requirement formal untuk menutup gap tersebut.

---

## Glossary

- **Production_Runtime**: Versi runtime yang aman, durable, observable, dan layak dioperasikan pada environment live.
- **Security_Boundary**: Kumpulan kontrol auth, authorization, webhook verification, rate limit, network boundary, dan audit yang melindungi surface mutasi.
- **Durable_Runtime_State**: State runtime yang tetap ada setelah process restart dan bisa dipulihkan tanpa kehilangan workflow penting.
- **Durable_Queue**: Sistem antrian yang menyimpan job secara persisten dan dapat melanjutkan processing setelah crash atau restart.
- **Immutable_Audit_Trail**: Log audit yang tidak bisa diubah sembarangan dan dapat dipakai untuk forensik operasional.
- **Replay_Protection**: Mekanisme untuk mencegah request webhook atau event yang sama diproses berulang secara tidak sah.
- **Dead_Letter_Queue**: Tempat menampung job gagal permanen yang tidak boleh terus diretry tanpa intervensi.
- **Side_Effect**: Aksi nyata yang berdampak pada sistem eksternal, data klien, channel komunikasi, atau artefak operasional.
- **Production_Governance**: Aturan peran, kebijakan, approval gates, data retention, PII, masking, dan compliance untuk operasi live.

---

## Requirements

### Requirement 1: Security Boundary

**User Story:** Sebagai owner dan operator, saya ingin semua surface mutasi runtime dilindungi boundary keamanan yang konsisten, sehingga runtime tidak bisa dimanipulasi secara tidak sah.

#### Acceptance Criteria

1. THE system SHALL mewajibkan auth yang konsisten untuk semua endpoint mutasi.
2. THE system SHALL menghapus fallback `dev-owner-token` dari jalur runtime live.
3. THE system SHALL memisahkan role minimal menjadi:
   - `observer` untuk read-only
   - `operator` untuk operasi harian
   - `owner` atau `approver` untuk approval gate dan aksi tingkat tinggi
4. THE system SHALL memverifikasi signed webhook untuk Telegram, WhatsApp, dan provider eksternal lain sebelum memproses payload mutasi.
5. THE system SHALL menerapkan rate limiting pada surface yang relevan.
6. THE system SHALL mendukung IP allowlist atau boundary setara melalui API gateway atau reverse proxy untuk endpoint sensitif.
7. THE system SHALL menghasilkan immutable audit trail untuk directive, approval, retry, webhook processing, dan side effect penting.
8. IF sebuah request mutasi datang tanpa auth atau verification yang valid, THEN THE system SHALL menolak request tersebut dengan error terstruktur.

### Requirement 2: Persistent Runtime Backbone

**User Story:** Sebagai operator, saya ingin runtime memiliki backbone persistence nyata, sehingga restart process tidak merusak state operasional yang sedang berjalan.

#### Acceptance Criteria

1. THE system SHALL mengganti seeded in-memory runtime state dengan persistence nyata.
2. THE system SHALL menggunakan Postgres sebagai storage utama untuk state runtime production.
3. THE system SHALL menyimpan minimal:
   - projects
   - approvals
   - runtime jobs
   - message log
   - audit log
   - artifacts metadata
   - recovery snapshots
4. THE system SHALL menggunakan durable job queue berbasis Postgres-backed queue atau Redis/BullMQ.
5. THE system SHALL membuat approval, job retry, message retry, dan audit event bersifat idempotent.
6. WHEN runtime restart, THEN THE system SHALL dapat merekonstruksi state operasional tanpa kehilangan workflow penting.
7. THE system SHALL menyediakan recovery path yang dapat diuji untuk runtime, queue, dan artifact references.

### Requirement 3: Real Integration Layer

**User Story:** Sebagai operator, saya ingin integrasi channel dan provider bekerja sungguhan, sehingga runtime dapat menjalankan operasi live tanpa bergantung pada logging simulatif.

#### Acceptance Criteria

1. THE endpoint `/api/telegram/send` SHALL benar-benar mengirim pesan atau dokumen ke Telegram.
2. THE endpoint `/api/whatsapp/send` SHALL benar-benar mengirim pesan ke WhatsApp.
3. THE system SHALL menerapkan deduplication untuk channel webhook yang masuk.
4. THE system SHALL menerapkan replay protection untuk webhook dan event eksternal.
5. THE AI provider layer SHALL memiliki quota handling yang jelas.
6. THE AI provider layer SHALL memiliki fallback model policy yang eksplisit.
7. THE AI provider layer SHALL memiliki circuit breaker untuk kegagalan upstream berulang.
8. THE AI provider layer SHALL memiliki timeout budget yang konsisten untuk tiap class of request.
9. IF channel delivery gagal, THEN THE system SHALL mencatat failure terstruktur dan meneruskan ke retry policy atau dead-letter queue sesuai severity.

### Requirement 4: Observability

**User Story:** Sebagai operator, saya ingin runtime production memiliki observability yang nyata, sehingga saya dapat mendeteksi, menganalisis, dan merespons masalah operasional dengan cepat.

#### Acceptance Criteria

1. THE system SHALL mengeluarkan structured logs terpusat.
2. THE system SHALL menghasilkan metrics minimum:
   - request latency
   - provider latency
   - failed approvals
   - retry counts
   - queue lag
3. THE system SHALL mendukung distributed tracing untuk flow:
   - directive
   - head agent
   - specialist
   - tool execution
   - approval
4. THE system SHALL menyediakan alerting minimum untuk:
   - provider down
   - webhook failure spike
   - queue stuck
   - auth failure spike
5. THE system SHALL menggunakan correlation id yang konsisten di surface HTTP, queue, provider, dan channel.
6. THE system SHALL memisahkan operational telemetry dari artefak bisnis klien.

### Requirement 5: Delivery Pipeline

**User Story:** Sebagai tim engineering, saya ingin jalur delivery yang disiplin dan repeatable, sehingga perubahan runtime bisa diuji dan dirilis dengan aman.

#### Acceptance Criteria

1. THE system SHALL memiliki staging environment yang semirip mungkin dengan production.
2. THE CI pipeline SHALL menjalankan:
   - typecheck
   - test
   - integration tests
   - smoke tests ke service nyata atau stub terkontrol
3. THE project SHALL memiliki containerization yang repeatable untuk deployment runtime.
4. THE project SHALL menggunakan secrets manager atau mekanisme setara untuk credential production.
5. THE delivery process SHALL memiliki deployment strategy dan rollback plan yang terdokumentasi.
6. THE system SHALL memiliki backup dan restore procedure untuk state penting.
7. THE team SHALL memiliki disaster recovery drill yang dapat dijalankan secara periodik.

### Requirement 6: Product And Runtime Governance

**User Story:** Sebagai owner, saya ingin runtime production memiliki governance yang jelas, sehingga agent tidak melakukan side effect berisiko tanpa kontrol yang memadai.

#### Acceptance Criteria

1. THE system SHALL mendefinisikan agent mana yang boleh melakukan side effect nyata.
2. THE system SHALL menambahkan approval gates untuk aksi berisiko tinggi.
3. THE system SHALL memiliki data retention policy untuk logs, artifacts, approvals, dan message history.
4. THE system SHALL memiliki PII policy yang jelas.
5. THE system SHALL memiliki masking policy untuk data sensitif di UI, logs, dan audit exports.
6. IF runtime ditargetkan untuk domain healthcare atau banking, THEN compliance requirements SHALL diperlakukan sebagai scope wajib, bukan backlog opsional.

### Requirement 7: Phase 0 Hardening Minimum

**User Story:** Sebagai tim platform, saya ingin ada fase hardening minimum yang kecil namun berdampak besar, sehingga surface paling rawan bisa diamankan lebih dulu.

#### Acceptance Criteria

1. THE main runtime server SHALL menggunakan auth boundary yang setara dengan `OperatorApiServer` untuk seluruh endpoint mutasi.
2. THE runtime SHALL menghapus default operator token dari jalur live.
3. THE runtime SHALL menolak webhook dan directive mutasi tanpa auth atau verification yang valid.
4. THE runtime SHALL menandai surface demo dan live secara eksplisit di config, docs, dan operator surface.

### Requirement 8: Phase 1 Durable Runtime

**User Story:** Sebagai tim platform, saya ingin fase durable runtime terdefinisi jelas, sehingga transisi dari seeded state menuju runtime persistence bisa dilakukan bertahap dan terukur.

#### Acceptance Criteria

1. THE system SHALL mengganti seeded `RuntimeAppState` menjadi state yang dimuat dari database.
2. THE system SHALL menyimpan approvals, messages, audit, jobs, dan artifacts ke persistence nyata.
3. THE system SHALL memiliki resume dan recovery test untuk runtime restart.
4. THE system SHALL membuktikan bahwa approval dan job state tidak hilang setelah process restart.

### Requirement 9: Phase 2 Production Channels And Workers

**User Story:** Sebagai operator, saya ingin channel dan worker production punya perilaku yang andal, sehingga failure operasional tidak hilang diam-diam.

#### Acceptance Criteria

1. THE system SHALL menyediakan real Telegram delivery.
2. THE system SHALL menyediakan real WhatsApp delivery.
3. THE system SHALL menjalankan durable worker queue.
4. THE system SHALL menerapkan retry policy yang eksplisit dan terukur.
5. THE system SHALL memiliki dead-letter queue untuk job gagal permanen.
6. IF sebuah delivery atau job gagal melebihi retry budget, THEN THE system SHALL memindahkannya ke dead-letter queue dan mengeluarkan alert.

### Requirement 10: Phase 3 Ops And Scale

**User Story:** Sebagai tim engineering dan operasi, saya ingin fase ops and scale terdefinisi, sehingga runtime dapat diuji sebagai kandidat production pada beban dan risiko yang lebih realistis.

#### Acceptance Criteria

1. THE system SHALL memiliki metrics, tracing, alerting, dan SLO yang terdokumentasi.
2. THE team SHALL menjalankan load test terhadap surface utama runtime.
3. THE team SHALL menjalankan security review dan penetration test ringan.
4. THE team SHALL menjalankan staging soak test minimal beberapa hari sebelum rollout production.
5. THE hasil dari load test, security review, dan soak test SHALL menghasilkan daftar temuan dan remediation yang bisa dilacak.

---

## Scope Summary

Spec ini mendefinisikan peta kerja untuk:

- mengeraskan security boundary
- menjadikan runtime durable
- mengaktifkan integrasi nyata
- menyediakan observability production
- membangun delivery pipeline yang aman
- menetapkan governance runtime multi-agent

Spec ini bukan implementasi langsung, tetapi menjadi baseline formal untuk seluruh fase hardening production berikutnya.
