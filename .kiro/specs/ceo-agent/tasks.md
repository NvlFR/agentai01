# Tasks

## CEO Agent

---

## Task List

- [x] 1. Define CEO Agent Runtime Skeleton
  - [x] 1.1 Definisikan `AgentDefinition` untuk `agentType: "ceo"` beserta `description`, `tools`, dan `systemPrompt`
  - [x] 1.2 Konfigurasikan `QueryEngine` sebagai mesin eksekusi utama directive Owner
  - [x] 1.3 Definisikan struktur konfigurasi runtime untuk jadwal laporan, threshold KPI alert, dan grup broadcast
  - [x] 1.4 Definisikan state startup, shutdown, heartbeat, dan recovery lifecycle CEO Agent

- [x] 2. Implement Owner Command Handling Design
  - [x] 2.1 Definisikan schema `OwnerCommand` untuk mode `structured` dan `natural`
  - [x] 2.2 Definisikan parser untuk perintah minimum: `status`, `history --last N`, dan `report --type daily`
  - [x] 2.3 Definisikan alur klarifikasi saat directive ambigu dengan batas maksimal tiga pertanyaan
  - [x] 2.4 Definisikan format serialisasi respons yang konsisten dan mudah dibaca Owner

- [x] 3. Design Delegation Manager
  - [x] 3.1 Definisikan schema `Delegation_Task` dengan `task_id`, `target_agent`, `instructions`, `priority`, `deadline`, `context`, dan `success_criteria`
  - [x] 3.2 Definisikan aturan pemilihan target agent berdasarkan `Agent_Registry`
  - [x] 3.3 Definisikan lifecycle task: `draft` -> `delegated` -> `completed` / `failed` / `escalated`
  - [x] 3.4 Definisikan mekanisme validasi hasil agent terhadap `success_criteria`
  - [x] 3.5 Definisikan alur redelegasi, instruksi tambahan, dan eskalasi ke Owner saat task gagal

- [x] 4. Integrate Company Dashboard and Agent Registry
  - [x] 4.1 Definisikan adapter `company_dashboard` untuk membaca snapshot perusahaan terpadu
  - [x] 4.2 Definisikan adapter pembacaan `Agent_Registry` untuk roster agent, project context, dan availability
  - [x] 4.3 Definisikan monitoring cadence: setiap 5 menit saat ada proyek aktif, setiap 30 menit saat idle
  - [x] 4.4 Definisikan deteksi isu operasional: agent `error`, `offline`, `stale`, blocker proyek, dan KPI drop >20%
  - [x] 4.5 Definisikan keterkaitan dashboard dengan approval pending, termasuk proposal final dari Sales dan approval lain lintas proyek

- [x] 5. Design Strategic Decision and Reporting
  - [x] 5.1 Definisikan schema `Strategic_Decision` beserta `context`, `options_considered`, `chosen_option`, dan `rationale`
  - [x] 5.2 Definisikan penyimpanan persisten untuk directive Owner, decision log, dan laporan perusahaan
  - [x] 5.3 Definisikan format `Company_Report` minimum: proyek aktif, KPI, isu, approval pending, dan rekomendasi
  - [x] 5.4 Definisikan perintah `history` untuk membaca directive dan status eksekusinya

- [x] 6. Design Broadcast and Coordination Controls
  - [x] 6.1 Definisikan tool `message_broadcast` untuk grup `all`, `delivery_team`, `client_facing`, atau daftar agent eksplisit
  - [x] 6.2 Definisikan acknowledgment timeout 30 detik untuk pesan broadcast
  - [x] 6.3 Definisikan aturan `checkPermissions` untuk broadcast berisiko tinggi atau perubahan prioritas berdampak luas
  - [x] 6.4 Definisikan audit log untuk pesan broadcast dan status konfirmasi tiap agent

- [~] 7. Design Security and Recovery
  - [x] 7.1 Definisikan validasi identitas Owner untuk setiap `Strategic_Directive`
  - [x] 7.2 Definisikan audit log immutable untuk semua aksi CEO Agent
  - [x] 7.3 Definisikan mekanisme temporary lock saat pola autentikasi mencurigakan terdeteksi
  - [x] 7.4 Definisikan pemulihan state setelah restart: proyek aktif, delegasi berjalan, dan antrian pesan belum selesai
  - [ ] 7.5 Definisikan endpoint `GET /health` dengan `status`, `uptime_seconds`, `active_tasks`, dan `last_activity_timestamp`

- [x] 8. Validate Cross-Spec Dependencies
  - [x] 8.1 Verifikasi bahwa CEO Agent mereferensikan `Company_Dashboard` dan `Agent_Registry` dari spec induk
  - [x] 8.2 Verifikasi bahwa CEO Agent dapat memantau proposal approval dari Sales Agent
  - [x] 8.3 Verifikasi bahwa CEO Agent dapat memantau `lead_handoff`, `discovery_handoff`, dan blocker delivery sebagai peristiwa lintas fungsi
  - [x] 8.4 Rancang pengujian integrasi untuk directive -> delegation -> status update -> report
