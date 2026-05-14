# Tasks

## Engineering Agent

---

## Task List

- [x] 1. Engineering Agent Foundation
  - [x] 1.1 Definisikan `Engineering_Agent` sebagai `AgentDefinition` dengan `agentType: "engineering"`
  - [x] 1.2 Hubungkan implementasi ke spec induk [ai-company-agents](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/ai-company-agents/requirements.md) dan requirements [engineering-agent](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/engineering-agent/requirements.md)
  - [x] 1.3 Siapkan `Client_Workspace` terisolasi per proyek
  - [x] 1.4 Tambahkan state dasar `implementation_status`, `qa_status`, `delivery_version`, dan `owner_review_status`

- [x] 2. Discovery Handoff Intake
  - [x] 2.1 Implementasikan penerimaan `Agent_Message` dengan `message_type: "discovery_handoff"` dari Product Agent
  - [x] 2.2 Validasi field wajib pesan dan hak akses `project_id`
  - [x] 2.3 Validasi payload handoff mencakup Spec final, acceptance criteria, prioritas fitur, daftar tool, batasan proyek, risiko implementasi, dan histori approval
  - [x] 2.4 Kirim acknowledgment penerimaan handoff ke Product Agent
  - [x] 2.5 Ubah `Lifecycle_State` proyek ke `implementation` saat handoff valid diterima
  - [x] 2.6 Kirim `status_update` ke Project Manager Agent bahwa implementasi dimulai

- [x] 3. Implementation Planning
  - [x] 3.1 Hasilkan `implementation-plan.md` dari Spec yang disetujui
  - [x] 3.2 Petakan setiap capability ke komponen implementasi konkret
  - [x] 3.3 Catat dependensi, risiko teknis, output tahap, dan strategi testing
  - [x] 3.4 Kirim `clarification_request` ke Product Agent bila ada bagian Spec yang ambigu
  - [x] 3.5 Simpan perubahan status tiap tahap Implementation Plan agar dapat dipantau

- [x] 4. Tooling and Execution Layer
  - [x] 4.1 Implementasikan tool minimal `code_read`
  - [x] 4.2 Implementasikan tool minimal `code_write`
  - [x] 4.3 Implementasikan tool minimal `test_run`
  - [x] 4.4 Implementasikan tool minimal `bash_exec`
  - [x] 4.5 Implementasikan tool minimal `deliverable_package`
  - [x] 4.6 Implementasikan tool minimal `message_send`
  - [x] 4.7 Pastikan `bash_exec` dibatasi pada allowlist command dan workspace proyek aktif

- [~] 5. Implementation Workflow
  - [x] 5.1 Bangun struktur folder proyek klien yang konsisten
  - [ ] 5.2 Implementasikan source code dan konfigurasi sesuai Spec
  - [ ] 5.3 Bungkus integrasi eksternal dalam modul terpisah dan terdokumentasi
  - [ ] 5.4 Catat semua penyimpangan dari Spec beserta alasannya
  - [x] 5.5 Kirim `risk_alert` jika penyimpangan atau dependency mengubah scope, kualitas, atau timeline

- [~] 6. QA Workflow
  - [x] 6.1 Implementasikan unit test untuk komponen atau tool yang dibangun
  - [x] 6.2 Implementasikan integration test untuk workflow utama berdasarkan acceptance criteria Spec
  - [x] 6.3 Implementasikan static checks minimal untuk syntax atau type safety
  - [x] 6.4 Hasilkan `qa-report.md` yang memuat hasil test, known limitations, dan catatan deployment
  - [x] 6.5 Ubah `Lifecycle_State` proyek ke `qa` saat validasi akhir dimulai
  - [ ] 6.6 Kembalikan pekerjaan ke `implementation` jika defect mayor ditemukan saat QA

- [x] 7. Delivery Packaging
  - [x] 7.1 Paketkan source code, konfigurasi, dokumentasi penggunaan, dan instruksi deployment ke `deliverable-v{version}/`
  - [x] 7.2 Pertahankan `changelog.md` untuk setiap revisi delivery
  - [x] 7.3 Tandai delivery sebagai `ready_for_owner_review` sebelum approval gate final
  - [x] 7.4 Pastikan versi lama deliverable tidak tertimpa saat ada revisi

- [x] 8. Approval Gate Delivery Final
  - [x] 8.1 Implementasikan `approval_request` ke Owner untuk delivery final
  - [x] 8.2 Sertakan ringkasan implementasi, hasil QA, risiko residual, dan instruksi deployment
  - [x] 8.3 Tangani response `approve`, `reject`, dan `revise` tanpa menghapus histori versi sebelumnya
  - [x] 8.4 Ubah `Lifecycle_State` proyek ke `delivered` hanya setelah Owner menyetujui delivery final
  - [x] 8.5 Kirim `status_update` ke Project Manager Agent dan Support Agent setelah delivery disetujui

- [x] 9. State Recovery and Auditability
  - [x] 9.1 Simpan konteks kerja terakhir agar dapat dipulihkan setelah restart
  - [x] 9.2 Pastikan log command, test, approval, dan handoff tersimpan untuk audit
  - [x] 9.3 Pastikan artefak hanya dapat diakses dalam konteks proyek aktif
  - [x] 9.4 Verifikasi bahwa error yang tidak dapat dipulihkan memicu eskalasi ke Owner dan Project Manager Agent

- [x] 10. Validation and Tests
  - [x] 10.1 Tulis unit test untuk validasi `discovery_handoff`
  - [x] 10.2 Tulis unit test bahwa acknowledgment dikirim sebelum workflow implementasi dilanjutkan
  - [x] 10.3 Tulis integration test untuk flow `discovery_handoff -> implementation_plan -> qa`
  - [x] 10.4 Tulis integration test untuk flow `ready_for_owner_review -> approval_response approve -> delivered`
  - [x] 10.5 Tulis integration test untuk flow `approval_response revise -> deliverable-v2`
  - [x] 10.6 Tulis test bahwa proyek tidak berpindah ke `delivered` tanpa approval gate final

- [x] 11. Cross-Agent Coordination Readiness
  - [x] 11.1 Verifikasi bahwa Product Agent menerima `clarification_request` dan dapat merespons dalam satu siklus revisi
  - [x] 11.2 Verifikasi bahwa Project Manager Agent menerima milestone `implementation_started`, `qa_started`, `ready_for_owner_review`, dan `delivered`
  - [x] 11.3 Verifikasi bahwa Support Agent menerima context package setelah delivery final disetujui
  - [x] 11.4 Verifikasi kompatibilitas penuh dengan lifecycle induk `implementation -> qa -> delivered`
