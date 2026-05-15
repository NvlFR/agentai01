# Tasks

## AI Company Runtime Platform

---

## Task List

- [x] 1. Runtime App Bootstrap
  - [x] 1.1 Buat entrypoint aplikasi lokal yang me-boot HTTP server, runtime orchestrator, dan dependency dasar
  - [x] 1.2 Definisikan struktur folder runtime app untuk `server`, `config`, `providers`, `storage`, `queue`, `workers`, dan `ui`
  - [x] 1.3 Tambahkan mode startup minimal `development`, `test`, dan `production`
  - [x] 1.4 Tambahkan shutdown hook yang menutup worker, scheduler, dan koneksi persistence dengan aman

- [x] 2. HTTP Server and API
  - [x] 2.1 Implementasikan endpoint `GET /health`
  - [x] 2.2 Implementasikan endpoint `GET /ready`
  - [x] 2.3 Implementasikan endpoint dashboard, agents, projects, approvals, messages, dan runtime jobs
  - [x] 2.4 Implementasikan endpoint untuk submit directive Owner dan approval response
  - [x] 2.5 Tambahkan structured error response dan correlation ID per request

- [x] 3. Environment and Config Layer
  - [x] 3.1 Implementasikan config loader untuk `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `APP_PORT`, dan storage config
  - [x] 3.2 Tambahkan dukungan `.env.local` untuk development
  - [x] 3.3 Tambahkan validasi startup untuk env wajib
  - [x] 3.4 Tambahkan redaction/masking untuk secret pada log dan debug output

- [x] 4. AI Provider Adapter
  - [x] 4.1 Implementasikan adapter OpenAI-compatible client
  - [x] 4.2 Tambahkan dukungan `baseURL`, `apiKey`, `model`, `timeout`, dan retry policy
  - [x] 4.3 Tambahkan smoke test untuk local proxy `http://127.0.0.1:8045/v1`
  - [x] 4.4 Tambahkan normalisasi response agar agent tidak tergantung ke format provider mentah
  - [x] 4.5 Tambahkan pencatatan latency, failure, dan retry provider call

- [x] 5. Persistence Architecture
  - [x] 5.1 Definisikan repository interface untuk agent state, project state, approval queue, job state, message log, dan audit log
  - [x] 5.2 Implementasikan backend persistence development yang nyata
  - [x] 5.3 Implementasikan artifact store untuk namespace `projects/{client_id}/{project_id}/`
  - [x] 5.4 Pisahkan data operasional runtime dari artefak klien
  - [x] 5.5 Tambahkan recovery load saat runtime restart

- [x] 6. Message Bus Runtime
  - [x] 6.1 Implementasikan publisher untuk `Agent_Message`
  - [x] 6.2 Integrasikan validasi kontrak dan akses proyek sebelum dispatch
  - [x] 6.3 Simpan event `publish`, `dispatch`, `ack`, `reject`, `timeout`, dan `retry`
  - [x] 6.4 Tambahkan handler untuk escalation bila message gagal berulang kali
  - [x] 6.5 Hubungkan message bus ke queue atau worker handler agent

- [x] 7. Queue and Job Model
  - [x] 7.1 Definisikan model job untuk `message_dispatch`, `handoff_retry`, `approval_followup`, `sla_scan`, `heartbeat_scan`, dan `report_generate`
  - [x] 7.2 Implementasikan queue backend dengan retry policy yang bisa dikonfigurasi
  - [x] 7.3 Tambahkan job lifecycle `queued`, `running`, `completed`, `failed`, dan `retrying`
  - [x] 7.4 Tambahkan persistence untuk job state
  - [x] 7.5 Tambahkan manual retry endpoint untuk failed job

- [x] 8. Scheduler and Workers
  - [x] 8.1 Implementasikan scheduler untuk heartbeat scan, SLA scan, approval scan, dan daily report
  - [x] 8.2 Implementasikan worker process atau worker pool untuk menjalankan queue
  - [x] 8.3 Tambahkan worker heartbeat dan status monitoring
  - [x] 8.4 Tambahkan recovery flow untuk job yang terputus saat restart
  - [x] 8.5 Tambahkan observability untuk queue depth, active workers, dan failed jobs

- [x] 9. Runtime Integration with Existing Agents
  - [x] 9.1 Hubungkan runtime ke CEO Agent
  - [x] 9.2 Hubungkan runtime ke Sales, Marketing, Product, Engineering, Project Manager, dan Support
  - [x] 9.3 Definisikan adapter eksekusi agent agar flow helper dapat dijalankan oleh worker nyata
  - [x] 9.4 Tambahkan boot sequence untuk mendaftarkan semua agent ke runtime registry
  - [x] 9.5 Pastikan semua agent dapat memakai provider adapter tanpa melanggar kontrak domain

- [x] 10. Operator UI Foundation
  - [x] 10.1 Buat shell UI web untuk operator
  - [x] 10.2 Implementasikan halaman dashboard perusahaan
  - [x] 10.3 Implementasikan halaman detail proyek
  - [x] 10.4 Implementasikan halaman approval queue dan runtime jobs
  - [x] 10.5 Implementasikan halaman message log dan audit log

- [x] 11. Operator Actions
  - [x] 11.1 Tambahkan form untuk submit directive Owner
  - [x] 11.2 Tambahkan aksi approve/reject/revise dari UI
  - [x] 11.3 Tambahkan aksi retry failed message atau failed job
  - [x] 11.4 Tambahkan tampilan status degraded/not-ready yang jelas di UI
  - [x] 11.5 Tambahkan guard atau confirmation untuk aksi operasional berisiko

- [x] 12. Security and Secrets
  - [x] 12.1 Tambahkan auth minimal untuk endpoint operator
  - [x] 12.2 Tambahkan secret redaction pada log dan response debug
  - [x] 12.3 Tambahkan audit log untuk approval, broadcast, retry paksa, dan config mutation
  - [x] 12.4 Tambahkan detector event operasional mencurigakan untuk provider/key/runtime usage
  - [x] 12.5 Pastikan UI tidak pernah menampilkan raw `AI_API_KEY`

- [x] 13. Observability and Diagnostics
  - [x] 13.1 Tambahkan structured logging untuk request API, provider call, queue event, dan worker execution
  - [x] 13.2 Tambahkan metrics untuk request count, provider latency, failed jobs, queue depth, active workers, dan approval backlog
  - [x] 13.3 Tambahkan correlation ID agar satu flow bisa ditelusuri lintas komponen
  - [x] 13.4 Tambahkan API atau halaman runtime diagnostics
  - [x] 13.5 Tambahkan indikator isu aktif dan severity untuk operator

- [x] 14. End-to-End Runtime Scenarios
  - [x] 14.1 Implementasikan smoke test startup aplikasi
  - [x] 14.2 Implementasikan smoke test koneksi AI provider via local proxy
  - [x] 14.3 Implementasikan skenario end-to-end directive Owner -> delegation -> update dashboard
  - [x] 14.4 Implementasikan skenario end-to-end lead intake -> proposal -> discovery -> implementation -> delivered
  - [x] 14.5 Implementasikan skenario recovery setelah restart dengan queue dan approval pending

- [x] 15. Deployment Readiness
  - [x] 15.1 Dokumentasikan cara menjalankan runtime secara lokal
  - [x] 15.2 Dokumentasikan env dan dependency yang dibutuhkan
  - [x] 15.3 Tambahkan command development tunggal untuk menyalakan app
  - [x] 15.4 Tambahkan command untuk worker dan scheduler bila dijalankan terpisah
  - [x] 15.5 Tambahkan checklist readiness sebelum runtime dipakai untuk operasi nyata
