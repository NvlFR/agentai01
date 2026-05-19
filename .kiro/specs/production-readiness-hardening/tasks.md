# Tasks

## Production Readiness Hardening

---

## Task List

- [x] 1. Phase 0: Security Boundary Hardening
  - [x] 1.1 Audit semua endpoint mutasi di `src/runtime-app/server.ts` dan kelompokkan berdasarkan risk level
  - [x] 1.2 Samakan auth boundary server utama dengan pola `OperatorApiServer`
  - [x] 1.3 Hapus fallback `dev-owner-token` dari jalur runtime live
  - [x] 1.4 Tambahkan role minimal `observer`, `operator`, dan `owner`
  - [x] 1.5 Pastikan approval, retry, directive, dan save draft memerlukan auth yang konsisten
  - [x] 1.6 Lindungi webhook Telegram dan WhatsApp dengan verification sebelum mutasi runtime
  - [x] 1.7 Tambahkan audit event immutable untuk semua aksi mutasi sensitif
  - [x] 1.8 Tambahkan rate limiting atau guard setara pada surface mutasi utama
  - [x] 1.9 Tandai secara eksplisit mana surface `demo` dan mana surface `live`

- [x] 2. Phase 0: Webhook And Channel Guardrails
  - [x] 2.1 Definisikan struktur signature verification untuk Telegram, WhatsApp, dan provider channel lain
  - [x] 2.2 Tambahkan replay protection berbasis timestamp dan event id
  - [x] 2.3 Tambahkan deduplication store untuk inbound webhook
  - [x] 2.4 Pastikan inbound webhook gagal verification tidak bisa submit directive
  - [x] 2.5 Tambahkan metrics dan audit khusus untuk webhook accepted, rejected, dan replayed

- [x] 3. Phase 1: Durable Runtime State
  - [x] 3.1 Rancang schema persistence untuk projects, approvals, jobs, messages, audit, dan artifact references
  - [x] 3.2 Tambahkan repository abstraction berbasis Postgres untuk runtime state utama
  - [x] 3.3 Migrasikan `RuntimeAppState` dari `createSeed()` ke load dari persistence
  - [x] 3.4 Tambahkan write path persistence untuk approval response, message retry, job retry, dan operator actions
  - [x] 3.5 Tambahkan checkpoint dan recovery snapshot yang bisa dipakai saat restart
  - [x] 3.6 Pastikan startup runtime dapat me-reconstruct state pending
  - [x] 3.7 Tambahkan integration test untuk restart recovery

- [x] 4. Phase 1: Durable Queue
  - [x] 4.1 Pilih backend queue production: Postgres-backed queue atau Redis/BullMQ
  - [x] 4.2 Definisikan job model durable untuk directive execution, delivery, retry, follow-up, dan recovery replay
  - [x] 4.3 Tambahkan state machine job `queued`, `running`, `completed`, `failed`, `retrying`, dan `dead_lettered`
  - [x] 4.4 Tambahkan retry budget per job type
  - [x] 4.5 Tambahkan dead-letter queue dan surface observability-nya
  - [x] 4.6 Tambahkan worker heartbeat dan stuck-job detector
  - [x] 4.7 Tambahkan recovery untuk job yang tertinggal saat process mati

- [~] 5. Phase 2: Real Telegram Integration
  - [x] 5.1 Ubah `/api/telegram/send` agar benar-benar mengirim via Telegram client
  - [x] 5.2 Tambahkan adapter delivery result yang terstruktur
  - [ ] 5.3 Tambahkan retry policy untuk Telegram delivery failure
  - [ ] 5.4 Tambahkan audit dan metrics untuk success, failure, dan retry
  - [ ] 5.5 Tambahkan integration test untuk outbound Telegram flow

- [~] 6. Phase 2: Real WhatsApp Integration
  - [x] 6.1 Ubah `/api/whatsapp/send` agar benar-benar mengirim via provider WhatsApp aktif
  - [~] 6.2 Tambahkan adapter untuk delivery result dan provider error normalization
  - [ ] 6.3 Tambahkan retry policy dan dead-letter behavior untuk delivery gagal
  - [ ] 6.4 Tambahkan audit dan metrics untuk outbound WhatsApp
  - [ ] 6.5 Tambahkan integration test untuk outbound WhatsApp flow

- [~] 7. Phase 2: Provider Reliability Controls
  - [x] 7.1 Kelompokkan timeout budget berdasarkan jenis request runtime
  - [x] 7.2 Tambahkan quota handling dan rate-limit classification pada provider layer
  - [ ] 7.3 Tambahkan fallback model policy yang eksplisit dan teraudit
  - [x] 7.4 Tambahkan circuit breaker untuk upstream failure spike
  - [~] 7.5 Tambahkan metrics untuk attempts, fallback usage, timeout, dan auth failure
  - [~] 7.6 Tambahkan tests untuk timeout, retry, fallback, dan circuit breaker

- [~] 8. Phase 3: Observability Backbone
  - [x] 8.1 Pastikan semua HTTP mutation memiliki correlation id yang konsisten
  - [~] 8.2 Tambahkan structured logs terpusat untuk API, queue, provider, worker, dan channel
  - [~] 8.3 Tambahkan metrics minimum: request latency, provider latency, failed approvals, retry counts, queue lag
  - [ ] 8.4 Tambahkan distributed tracing untuk flow directive -> head -> specialist -> tool -> approval
  - [ ] 8.5 Tambahkan alerting minimum: provider down, webhook failure spike, queue stuck, auth failure spike
  - [ ] 8.6 Tambahkan operational dashboards atau diagnostics endpoint yang membaca telemetry production

- [~] 9. Phase 3: Delivery Pipeline
  - [x] 9.1 Definisikan environment separation: dev, test, staging, production
  - [ ] 9.2 Tambahkan containerization yang repeatable untuk runtime app, worker, dan scheduler
  - [ ] 9.3 Pastikan CI menjalankan `check`, `test`, integration tests, dan smoke tests
  - [ ] 9.4 Tambahkan staging smoke scenario yang menyerupai runtime production
  - [ ] 9.5 Dokumentasikan deployment strategy dan rollback plan
  - [ ] 9.6 Tambahkan backup/restore procedure untuk state operasional
  - [ ] 9.7 Jalankan disaster recovery drill minimal pada staging

- [x] 10. Phase 3: Product And Runtime Governance
  - [x] 10.1 Definisikan daftar agent yang boleh melakukan side effect nyata
  - [x] 10.2 Tambahkan approval gates untuk aksi high-risk
  - [x] 10.3 Dokumentasikan data retention policy untuk logs, messages, approvals, dan artifacts
  - [x] 10.4 Dokumentasikan PII policy dan masking policy
  - [x] 10.5 Tambahkan guard untuk client-facing mutation dan workspace actions destruktif
  - [x] 10.6 Tambahkan checklist compliance readiness untuk target healthcare atau banking

- [~] 11. Validation And Exit Criteria
  - [x] 11.1 Buktikan tidak ada endpoint mutasi tanpa auth di jalur live
  - [x] 11.2 Buktikan runtime restart tidak menghilangkan approvals dan jobs pending
  - [x] 11.3 Buktikan queue dead-letter bekerja pada failure permanen
  - [~] 11.4 Buktikan outbound Telegram dan WhatsApp benar-benar mengirim, bukan hanya log
  - [ ] 11.5 Buktikan provider fallback dan circuit breaker tercatat di observability
  - [ ] 11.6 Jalankan load test dasar pada surface utama runtime
  - [ ] 11.7 Jalankan security review dan penetration test ringan
  - [ ] 11.8 Jalankan staging soak test minimal beberapa hari
