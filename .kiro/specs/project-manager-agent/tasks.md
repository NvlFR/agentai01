# Tasks

## Project Manager Agent

---

## Task List

- [ ] 1. Project Manager Agent Foundation
  - [ ] 1.1 Definisikan `Project_Manager_Agent` sebagai `AgentDefinition` dengan `agentType: "project_manager"`
  - [ ] 1.2 Hubungkan implementasi ke spec induk [ai-company-agents](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/ai-company-agents/requirements.md) dan requirements [project-manager-agent](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/project-manager-agent/requirements.md)
  - [ ] 1.3 Siapkan persistence untuk state proyek aktif, timeline, blocker, dan history
- [x] 1.4 Tambahkan model dasar `current_milestone`, `pending_approvals`, `milestone_status`, dan `open_blockers`

- [x] 2. Project Intake and Baseline Timeline
- [x] 2.1 Implementasikan pembentukan `Project_Timeline` saat proyek masuk state `won`
- [x] 2.2 Masukkan milestone wajib `project_created`, `lead_handoff_sent`, `discovery_started`, `spec_approval_pending`, `discovery_handoff_sent`, `implementation_started`, `qa_started`, `delivery_approval_pending`, dan `delivered`
- [x] 2.3 Tetapkan owner agent, deadline, dependency, dan approval gate per milestone
- [x] 2.4 Simpan baseline timeline versi pertama untuk audit perubahan
- [x] 2.5 Tandai deadline yang tidak realistis sebagai risiko awal

- [~] 3. Lifecycle Tracking
- [x] 3.1 Implementasikan Lifecycle Tracker untuk state `won`, `discovery`, `implementation`, `qa`, `delivered`, dan `support`
- [x] 3.2 Validasi legalitas transisi state sesuai spec induk
- [x] 3.3 Perbarui `current_milestone` berdasarkan `status_update` dari agent pelaksana
- [x] 3.4 Simpan histori perubahan state tanpa menghapus state sebelumnya
  - [ ] 3.5 Tolak transisi tidak valid dan catat audit log

- [x] 4. Handoff Monitoring
- [x] 4.1 Implementasikan pencatatan `lead_handoff` dari Sales Agent ke Product Agent sebagai milestone eksplisit
- [x] 4.2 Implementasikan pencatatan `discovery_handoff` dari Product Agent ke Engineering Agent sebagai milestone eksplisit
- [x] 4.3 Simpan timestamp pengiriman, penerima, acknowledgment status, dan SLA acknowledgment
- [x] 4.4 Kirim reminder jika acknowledgment belum diterima dalam SLA
- [x] 4.5 Tandai milestone `at_risk` dan buka blocker jika handoff macet

- [x] 5. Approval Gate Tracking
- [x] 5.1 Implementasikan pencatatan approval gate `spec_final` dari Product Agent
- [x] 5.2 Implementasikan pencatatan approval gate `delivery_final` dari Engineering Agent
- [x] 5.3 Tandai status proyek dengan `[ACTION REQUIRED]` saat approval pending
- [x] 5.4 Tutup atau buka ulang approval gate berdasarkan `approval_response` dari Owner
- [x] 5.5 Eskalasi ke CEO Agent atau Owner jika approval gate tertahan terlalu lama

- [x] 6. Blocker and Risk Registry
- [x] 6.1 Implementasikan `blocker_log` untuk mencatat penyebab, agent terdampak, severity, dan rekomendasi tindakan
- [x] 6.2 Implementasikan penanda `at_risk` saat milestone terlambat atau dependency tertahan
- [x] 6.3 Implementasikan ambang eskalasi blocker yang dapat dikonfigurasi
- [x] 6.4 Kirim `risk_alert` ke CEO Agent atau Owner untuk blocker berat
- [x] 6.5 Pastikan blocker dapat ditutup dengan jejak resolusi yang persisten

- [~] 7. Status Reporting
- [x] 7.1 Implementasikan perintah `status <project_id>` yang menampilkan fase, milestone aktif, blocker, risiko, approval pending, dan next step
- [x] 7.2 Implementasikan perintah `history <project_id>` untuk timeline kejadian penting proyek
- [x] 7.3 Implementasikan laporan periodik ke Owner dengan format konsisten
- [x] 7.4 Implementasikan laporan eskalasi ke CEO Agent untuk proyek `at_risk`
  - [ ] 7.5 Pastikan laporan menggabungkan konteks dari Sales, Product, Engineering, dan Support bila relevan

- [x] 8. Coordination Task Engine
- [x] 8.1 Modelkan reminder status, pengecekan SLA, dan eskalasi sebagai `Task`
- [x] 8.2 Pastikan status task koordinasi dapat diinspeksi
- [x] 8.3 Implementasikan recovery state task setelah restart
- [x] 8.4 Pastikan Project Manager Agent dapat melanjutkan monitoring tanpa kehilangan history proyek aktif

- [ ] 9. Tooling Implementation
  - [ ] 9.1 Implementasikan tool minimal `timeline_plan`
  - [ ] 9.2 Implementasikan tool minimal `status_update`
  - [ ] 9.3 Implementasikan tool minimal `blocker_log`
  - [ ] 9.4 Implementasikan tool minimal `message_send`
  - [ ] 9.5 Implementasikan tool minimal `report_generate`
  - [ ] 9.6 Pastikan semua tool mengikuti pola `buildTool`

- [x] 10. Validation and Tests
- [x] 10.1 Tulis unit test untuk legalitas transisi lifecycle
- [x] 10.2 Tulis unit test untuk pencatatan `lead_handoff` dan `discovery_handoff`
- [x] 10.3 Tulis unit test untuk approval gate tracking `spec_final` dan `delivery_final`
- [x] 10.4 Tulis integration test untuk flow `won -> discovery -> implementation -> qa -> delivered`
- [x] 10.5 Tulis integration test untuk flow handoff tanpa acknowledgment yang menghasilkan blocker dan eskalasi
- [x] 10.6 Tulis integration test untuk laporan `[ACTION REQUIRED]` saat approval gate pending

- [ ] 11. Cross-Agent Coordination Readiness
  - [ ] 11.1 Verifikasi bahwa status dari Sales, Product, dan Engineering dapat dipetakan ke timeline yang sama
  - [ ] 11.2 Verifikasi bahwa dashboard induk dapat membaca milestone aktif, approval pending, dan blocker
  - [ ] 11.3 Verifikasi bahwa eskalasi ke CEO Agent dan Owner hanya terjadi pada severity yang sesuai
  - [ ] 11.4 Verifikasi kompatibilitas penuh dengan lifecycle induk `discovery -> implementation -> qa -> delivered`
