# Requirements Document

## Introduction

Dokumen ini mendefinisikan requirements untuk **AI Company Runtime Platform**, yaitu lapisan aplikasi nyata yang menjalankan semua agent perusahaan di atas fondasi domain yang sudah ada.

Saat ini codebase sudah memiliki:

- domain model lintas agent
- kontrak message, approval, dan lifecycle
- registry, dashboard snapshot, dan orchestrator shell
- flow logic per agent
- test suite untuk simulasi perilaku agent

Namun, sistem belum memiliki:

- runtime server/API/UI yang benar-benar berjalan
- integrasi AI provider nyata
- konfigurasi environment untuk `API key`, `baseURL`, dan model
- persistence nyata ke database atau file store operasional
- message bus, queue, scheduler, dan worker process
- aplikasi end-to-end yang dapat dioperasikan lewat UI

Spec ini menutup gap tersebut dan menjadi jembatan dari **library + tests** menjadi **aplikasi operasional yang dapat dipakai**.

---

## Glossary

- **Runtime Platform**: Lapisan aplikasi yang menjalankan seluruh agent, API, worker, queue, persistence, dan UI.
- **Provider Adapter**: Lapisan abstraksi untuk menghubungkan runtime ke model AI melalui OpenAI-compatible API atau provider lain.
- **Operator UI**: Antarmuka manusia untuk memantau agent, proyek, queue, approval, dan logs.
- **Worker Process**: Proses background yang menjalankan task agent, queue consumer, scheduler, atau retry jobs.
- **Scheduler**: Komponen yang menjalankan pekerjaan periodik seperti report generation, heartbeat check, SLA scan, dan retry loop.
- **Message Bus**: Sistem internal untuk mengirim dan melacak `Agent_Message` antar agent.
- **Persistence Store**: Database dan/atau filesystem terstruktur untuk state, artefak, logs, dan audit trail.
- **Local Proxy Provider**: OpenAI-compatible endpoint lokal seperti `http://127.0.0.1:8045/v1` yang meneruskan request ke model sebenarnya.

---

## Requirements

### Requirement 1: Runtime Server and API

**User Story:** Sebagai Owner atau operator, saya ingin aplikasi memiliki server dan API nyata, sehingga seluruh sistem agent bisa dijalankan, dipantau, dan diintegrasikan dari satu runtime.

#### Acceptance Criteria

1. THE Runtime Platform SHALL menyediakan HTTP server utama untuk API internal dan operator UI.
2. THE server SHALL menyediakan endpoint health, readiness, dashboard snapshot, project status, approval queue, dan runtime metrics.
3. THE server SHALL menyediakan endpoint untuk menjalankan directive Owner, membuat delegation task, mengirim broadcast, dan memicu flow operasional.
4. THE server SHALL memisahkan route minimal menjadi `health`, `agents`, `projects`, `approvals`, `dashboard`, `messages`, dan `runtime`.
5. IF dependency runtime penting belum siap, THEN readiness endpoint SHALL menandai status `degraded` atau `not_ready` dengan alasan yang jelas.

### Requirement 2: Real AI Provider Integration

**User Story:** Sebagai developer, saya ingin runtime terhubung ke provider AI nyata, sehingga agent dapat memakai model sungguhan alih-alih hanya flow simulasi.

#### Acceptance Criteria

1. THE Runtime Platform SHALL mendukung provider adapter berbasis OpenAI-compatible API.
2. THE provider adapter SHALL mendukung konfigurasi `baseURL`, `apiKey`, `model`, `timeout`, dan opsi retry.
3. THE provider adapter SHALL dapat diarahkan ke local proxy seperti `http://127.0.0.1:8045/v1`.
4. THE system SHALL memisahkan `provider configuration` dari logic agent agar model dapat diganti tanpa mengubah flow agent.
5. IF request ke provider gagal, THEN sistem SHALL mengembalikan error terstruktur, mencatat audit log, dan memicu retry atau escalation sesuai severity.

### Requirement 3: Environment Configuration

**User Story:** Sebagai operator, saya ingin konfigurasi runtime dikelola via environment variables dan config file aman, sehingga deployment lokal maupun production tetap konsisten.

#### Acceptance Criteria

1. THE Runtime Platform SHALL membaca konfigurasi minimal dari environment variables:
   - `AI_BASE_URL`
   - `AI_API_KEY`
   - `AI_MODEL`
   - `APP_PORT`
   - `DATABASE_URL` atau path persistence setara
2. THE sistem SHALL mendukung file `.env.local` untuk development lokal.
3. THE sistem SHALL melakukan validasi startup terhadap env wajib dan gagal start bila konfigurasi kritis tidak tersedia.
4. THE sistem SHALL memisahkan konfigurasi development, test, dan production secara eksplisit.
5. THE sistem SHALL melarang nilai secret sensitif ditulis ke log plaintext.

### Requirement 4: Persistent Storage

**User Story:** Sebagai operator, saya ingin state runtime tersimpan secara persisten, sehingga proses restart tidak menghilangkan project state, task, artefak, atau audit trail.

#### Acceptance Criteria

1. THE Runtime Platform SHALL memiliki persistence nyata untuk agent state, project state, approval queue, message log, audit log, dan worker state.
2. THE sistem SHALL menyimpan artefak proyek di namespace `projects/{client_id}/{project_id}/`.
3. THE sistem SHALL memisahkan data operasional runtime dari artefak delivery klien.
4. WHEN runtime restart, THEN state agent, queue, approval pending, dan worker recovery context SHALL dapat dipulihkan.
5. THE sistem SHALL menyediakan abstraction repository agar implementasi database dapat diganti tanpa mengubah domain logic utama.

### Requirement 5: Message Bus and Queue

**User Story:** Sebagai sistem, saya ingin komunikasi agent berjalan lewat message bus dan queue nyata, sehingga handoff, retry, dan observability bisa dikelola dengan andal.

#### Acceptance Criteria

1. THE Runtime Platform SHALL memiliki internal message bus yang menerima `Agent_Message`, memvalidasi kontrak, dan meneruskan ke target agent.
2. THE message bus SHALL mencatat seluruh event penting seperti publish, delivery, ack, reject, timeout, dan retry.
3. THE sistem SHALL memiliki queue untuk task asynchronous minimal: handoff retry, approval follow-up, SLA scan, report generation, dan broadcast ack timeout.
4. THE queue SHALL mendukung retry policy yang dapat dikonfigurasi.
5. IF sebuah message gagal terkirim berulang kali, THEN sistem SHALL membuat escalation event ke CEO Agent atau operator.

### Requirement 6: Scheduler and Workers

**User Story:** Sebagai operator, saya ingin task periodik dijalankan otomatis, sehingga runtime tetap aktif memantau KPI, approvals, retry, dan state recovery tanpa intervensi manual.

#### Acceptance Criteria

1. THE Runtime Platform SHALL menyediakan scheduler untuk heartbeat check, SLA scan, pending approval scan, periodic report, dan retry queue.
2. THE sistem SHALL memiliki worker process terpisah atau logical worker pool untuk menjalankan task asynchronous.
3. THE worker SHALL mencatat job lifecycle minimal: `queued`, `running`, `completed`, `failed`, `retrying`.
4. THE sistem SHALL mendukung restart-safe recovery untuk job yang sedang berjalan atau tertunda.
5. THE operator SHALL dapat melihat status scheduler dan worker melalui API atau dashboard.

### Requirement 7: Operator UI

**User Story:** Sebagai Owner atau operator, saya ingin aplikasi memiliki UI yang bisa diklik, sehingga saya dapat memantau agent, proyek, logs, approvals, dan queue tanpa harus memakai test atau script manual.

#### Acceptance Criteria

1. THE Runtime Platform SHALL menyediakan Operator UI berbasis web.
2. THE UI SHALL menampilkan minimal:
   - dashboard perusahaan
   - daftar agent dan statusnya
   - daftar proyek dan lifecycle state
   - approval pending
   - queue/jobs
   - message/audit log
3. THE UI SHALL memungkinkan operator menjalankan aksi minimum:
   - submit owner directive
   - approve/reject/revise approval request
   - retry failed message/job
   - lihat detail satu proyek
4. THE UI SHALL memisahkan tampilan read-only dan aksi operasional berisiko.
5. IF runtime berada pada status degraded, THEN UI SHALL menampilkannya secara jelas dengan penyebab.

### Requirement 8: End-to-End Executable Application

**User Story:** Sebagai developer, saya ingin satu entrypoint aplikasi yang benar-benar bisa dijalankan, sehingga sistem tidak lagi hanya berupa koleksi helper dan unit test.

#### Acceptance Criteria

1. THE Runtime Platform SHALL menyediakan entrypoint untuk menjalankan app secara lokal.
2. THE app SHALL dapat di-start dengan satu command development yang jelas.
3. THE app SHALL menghubungkan server, provider adapter, storage, message bus, scheduler, dan worker pada saat boot.
4. THE app SHALL dapat menjalankan minimal satu skenario end-to-end dari directive atau lead intake sampai update dashboard.
5. THE app SHALL mendukung smoke test terhadap local AI proxy untuk validasi koneksi provider.

### Requirement 9: Security and Secrets Handling

**User Story:** Sebagai operator, saya ingin secret dan akses runtime dikelola aman, sehingga API key, approval action, dan operasi sensitif tidak mudah bocor atau disalahgunakan.

#### Acceptance Criteria

1. THE Runtime Platform SHALL menyimpan API key provider hanya melalui environment atau secret store yang sesuai.
2. THE sistem SHALL menyamarkan secret saat menampilkan config di log atau UI.
3. THE sistem SHALL menerapkan auth minimal untuk endpoint operator yang menjalankan aksi destruktif atau berdampak luas.
4. THE sistem SHALL mencatat audit log untuk approval action, broadcast, retry paksa, dan config mutation.
5. IF pola penggunaan runtime terlihat mencurigakan, THEN sistem SHALL dapat menandai event tersebut sebagai security alert operasional.

### Requirement 10: Production Observability

**User Story:** Sebagai operator, saya ingin runtime punya observability nyata, sehingga masalah provider, queue, worker, atau agent bisa didiagnosis cepat.

#### Acceptance Criteria

1. THE Runtime Platform SHALL mengeluarkan structured log untuk request API, provider call, queue event, job execution, dan error runtime.
2. THE sistem SHALL memiliki metrik minimal: request count, provider latency, failed jobs, queue depth, active workers, dan approval backlog.
3. THE sistem SHALL menyediakan trace sederhana atau correlation ID untuk menghubungkan event lintas agent dan runtime.
4. THE sistem SHALL memisahkan log operasional dari artefak bisnis klien.
5. THE dashboard atau API observability SHALL menampilkan isu aktif dengan severity yang bisa diprioritaskan.

---

## Scope Summary

Spec ini menjadi tahap lanjutan setelah fondasi domain-agent selesai. Target dari spec ini adalah mengubah sistem menjadi:

- runnable locally
- terhubung ke provider AI nyata
- persisten
- observable
- operator-friendly

Spec ini tidak menggantikan spec agent individual, tetapi menyediakan lapisan aplikasi yang membuat semua spec agent dapat dijalankan sebagai sistem operasional utuh.
