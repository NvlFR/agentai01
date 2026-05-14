# Tasks

## Product Agent

---

## Task List

- [x] 1. Product Agent Foundation
  - [x] 1.1 Definisikan `Product_Agent` sebagai `AgentDefinition` dengan `agentType: "product"`
  - [x] 1.2 Hubungkan konfigurasi agent ke spec induk [ai-company-agents](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/ai-company-agents/requirements.md) dan requirements [product-agent](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/product-agent/requirements.md)
  - [x] 1.3 Siapkan namespace artefak proyek `projects/{client_id}/{project_id}/` untuk isolasi file discovery
  - [x] 1.4 Tambahkan state dasar proyek: `lifecycle_state`, `spec_version`, `discovery_status`, dan `handoff_status`

- [x] 2. Lead Handoff Intake
  - [x] 2.1 Implementasikan penerimaan `Agent_Message` dengan `message_type: "lead_handoff"` dari Sales Agent
  - [x] 2.2 Validasi field wajib `from`, `to`, `message_type`, `project_id`, `timestamp`, dan `payload`
  - [x] 2.3 Validasi kelengkapan payload handoff: ringkasan bisnis, stakeholder, proposal terakhir, scope awal, asumsi komersial, dan risiko awal
  - [x] 2.4 Ubah `Lifecycle_State` proyek ke `discovery` saat `lead_handoff` valid diterima
  - [x] 2.5 Kirim `status_update` ke Project Manager Agent bahwa discovery telah dimulai
  - [x] 2.6 Kirim `clarification_request` ke Sales Agent bila handoff belum lengkap

- [x] 3. Discovery Workflow
  - [x] 3.1 Implementasikan generator pertanyaan klarifikasi yang mencakup tujuan bisnis, persona, integrasi, batasan operasional, dan target keberhasilan
  - [x] 3.2 Simpan semua pertanyaan dan jawaban discovery ke `clarification-log.json`
  - [x] 3.3 Buat ringkasan discovery ke `discovery-notes.md`
  - [x] 3.4 Implementasikan capability map dan rekomendasi tipe agent yang sesuai
  - [x] 3.5 Implementasikan pencatatan asumsi dan konflik input ke `assumptions.md`
  - [x] 3.6 Implementasikan risk register dengan prioritas `critical`, `high`, `medium`, dan `low`

- [x] 4. Spec Authoring
  - [x] 4.1 Implementasikan `spec_write` untuk menghasilkan `spec-v{version}.md`
  - [x] 4.2 Pastikan Spec memuat ringkasan solusi, capability map, workflow utama, tools, integrasi, acceptance criteria, asumsi, risiko, dan rekomendasi MVP
  - [x] 4.3 Tambahkan section khusus untuk gap testability dan batasan teknis
  - [x] 4.4 Pertahankan version history saat Spec direvisi
  - [x] 4.5 Pastikan format Spec siap dikonsumsi Engineering Agent tanpa klarifikasi manual berulang

- [x] 5. Approval Gate Spec Final
  - [x] 5.1 Implementasikan `approval_request` ke Owner untuk Spec final
  - [x] 5.2 Sertakan ringkasan, rekomendasi, risiko, dan opsi keputusan `approve`, `reject`, `revise`
  - [x] 5.3 Simpan histori approval response per versi Spec
  - [x] 5.4 Jika Owner memilih `revise`, buat iterasi baru tanpa menimpa versi lama
  - [x] 5.5 Kirim `status_update` ke Project Manager Agent saat approval gate pending dan saat keputusan diterima

- [x] 6. Discovery Handoff to Engineering
  - [x] 6.1 Implementasikan `Agent_Message` dengan `message_type: "discovery_handoff"` ke Engineering Agent
  - [x] 6.2 Sertakan Spec final, catatan discovery, acceptance criteria, prioritas fitur, daftar tool, batasan proyek, dan risiko implementasi
  - [x] 6.3 Tunggu acknowledgment dari Engineering Agent sebelum menandai handoff selesai
  - [x] 6.4 Tandai proyek `ready_for_implementation` setelah acknowledgment diterima
  - [x] 6.5 Kirim `status_update` ke Project Manager Agent untuk milestone `discovery_handoff completed`

- [x] 7. Task Tracking and Coordination
  - [x] 7.1 Modelkan tahapan `handoff_validation`, `discovery_in_progress`, `awaiting_clarification`, `spec_drafting`, `awaiting_owner_approval`, dan `awaiting_engineering_ack` sebagai `Task`
  - [x] 7.2 Pastikan status task dapat diinspeksi oleh dashboard induk dan Project Manager Agent
  - [x] 7.3 Implementasikan reminder atau eskalasi jika klarifikasi atau acknowledgment melebihi SLA internal
  - [x] 7.4 Kirim `risk_alert` saat scope, dependency, atau data gap mengancam timeline proyek

- [x] 8. Tooling Implementation
  - [x] 8.1 Implementasikan tool minimal `brief_analyze`
  - [x] 8.2 Implementasikan tool minimal `document_read`
  - [x] 8.3 Implementasikan tool minimal `spec_write`
  - [x] 8.4 Implementasikan tool minimal `template_load`
  - [x] 8.5 Implementasikan tool minimal `message_send`
  - [x] 8.6 Pastikan setiap tool memakai pola `buildTool`, `inputSchema`, dan `checkPermissions`

- [x] 9. Validation and Tests
  - [x] 9.1 Tulis unit test untuk validasi `lead_handoff` lengkap vs tidak lengkap
  - [x] 9.2 Tulis unit test untuk versioning Spec saat approval response adalah `revise`
  - [x] 9.3 Tulis integration test untuk flow `lead_handoff -> discovery -> approval_request`
  - [x] 9.4 Tulis integration test untuk flow `approval_response approve -> discovery_handoff -> acknowledgment`
  - [x] 9.5 Tulis test bahwa Product Agent tidak memajukan proyek ke `implementation` tanpa approval gate dan acknowledgment

- [x] 10. Delivery Readiness
  - [x] 10.1 Verifikasi bahwa semua artefak discovery tersimpan pada namespace proyek yang benar
  - [x] 10.2 Verifikasi bahwa seluruh komunikasi penting tercatat untuk audit
  - [x] 10.3 Verifikasi bahwa Project Manager Agent menerima milestone dan blocker utama
  - [x] 10.4 Verifikasi kompatibilitas penuh dengan lifecycle spec induk `discovery -> implementation`
