# Tasks

## Support Agent

---

## Task List

- [ ] 1. Support Agent Foundation
  - [ ] 1.1 Definisikan `Support_Agent` sebagai `AgentDefinition` valid dengan `agentType: "support"`
  - [ ] 1.2 Tambahkan `systemPrompt` yang menegaskan peran pasca-delivery, intake tiket, eskalasi, dan risk monitoring
  - [ ] 1.3 Registrasikan tool inti `ticket_create`, `ticket_update`, `knowledge_read`, `message_send`, dan `report_generate`
  - [ ] 1.4 Siapkan storage persisten untuk tiket, histori percakapan, catatan resolusi, eskalasi, dan alert

- [~] 2. Post-Delivery Lifecycle Integration
- [x] 2.1 Implementasikan validasi bahwa tiket harus terkait ke `project_id`
- [x] 2.2 Pastikan proyek yang sudah `delivered` dapat dipetakan atau dipindahkan ke `Lifecycle_State: support`
- [x] 2.3 Tambahkan pencatatan tiket pertama pasca-delivery sebagai pemicu konteks support
  - [ ] 2.4 Uji integrasi state support dengan spec induk dan dashboard terpadu

- [x] 3. Ticket Intake Workflow
- [x] 3.1 Definisikan schema `SupportTicketInput` dengan project_id, ringkasan masalah, urgensi, waktu kejadian, dan kontak pelapor
- [x] 3.2 Implementasikan `ticket_create` untuk membuat `ticket_id` unik dan histori status
- [x] 3.3 Implementasikan mekanisme pertanyaan klarifikasi bila data tiket belum cukup
- [x] 3.4 Tambahkan status awal `open` dan timestamp audit

- [x] 4. Ticket Classification and Prioritization
- [x] 4.1 Implementasikan classifier untuk kategori `question`, `bug`, `incident`, dan `change_request`
- [x] 4.2 Implementasikan prioritas `low`, `medium`, `high`, dan `critical`
- [x] 4.3 Tambahkan aturan prioritas berbasis dampak bisnis dan urgensi
- [x] 4.4 Simpan hasil klasifikasi ke histori tiket

- [x] 5. Knowledge-Based First Response
- [x] 5.1 Implementasikan `knowledge_read` untuk mengakses delivery notes, runbook, FAQ, dan histori support
- [x] 5.2 Implementasikan lookup known issue dan workaround
- [x] 5.3 Tambahkan pencatatan `Resolution_Note` untuk setiap langkah diagnosis
- [x] 5.4 Ubah status ke `waiting_clarification` atau `needs_escalation` bila resolusi dasar tidak cukup

- [~] 6. Ticket State Management
- [x] 6.1 Implementasikan lifecycle tiket `open`, `triaged`, `waiting_clarification`, `needs_escalation`, `resolved`, dan `closed`
- [x] 6.2 Pastikan `ticket_update` menyimpan histori transisi status
- [x] 6.3 Cegah status `resolved` dipakai sebelum update final dikirim ke klien
  - [ ] 6.4 Pastikan state tiket dapat dipulihkan setelah restart

- [x] 7. Escalation Routing
- [x] 7.1 Definisikan schema `TicketEscalationPayload`
- [x] 7.2 Implementasikan router untuk memilih Engineering_Agent atau Project_Manager_Agent
- [x] 7.3 Gunakan `Agent_Message` dengan `message_type: "ticket_escalation"` untuk semua eskalasi
- [x] 7.4 Sertakan ringkasan masalah, dampak bisnis, langkah reproduksi, histori percakapan, dan tindakan yang sudah dicoba
- [x] 7.5 Simpan log acknowledgment dan respons agent tujuan

- [x] 8. Engineering Escalation Flow
- [x] 8.1 Buat aturan khusus untuk bug, incident, dan investigasi teknis mendalam
- [x] 8.2 Uji bahwa Support_Agent tidak mengeskalasi tanpa konteks minimum
- [x] 8.3 Simpan hasil investigasi Engineering_Agent sebagai bagian dari `Resolution_Note`

- [x] 9. Project Manager Escalation Flow
- [x] 9.1 Buat aturan khusus untuk change request, dependency, timeline, dan koordinasi lintas agent
- [x] 9.2 Uji bahwa issue scope atau komitmen delivery diarahkan ke Project_Manager_Agent
- [x] 9.3 Simpan hasil koordinasi PM sebagai update tiket yang bisa diteruskan ke klien

- [x] 10. Client Update Translation
- [x] 10.1 Implementasikan formatter yang menerjemahkan hasil teknis menjadi update ramah klien
- [x] 10.2 Pisahkan note internal teknis dari pesan eksternal
- [x] 10.3 Pastikan setiap eskalasi diakhiri dengan update jelas ke klien atau Owner

- [x] 11. Risk Alert Workflow
- [x] 11.1 Definisikan schema `RiskAlert`
- [x] 11.2 Implementasikan deteksi `repeat_incident`, `cross_project_pattern`, `sla_breach`, dan `unresolved_escalation`
- [x] 11.3 Kirim `Agent_Message` dengan `message_type: "risk_alert"` ke CEO_Agent atau Project_Manager_Agent
- [x] 11.4 Simpan semua alert ke audit log dan histori proyek

- [~] 12. Timeout and Failure Handling
- [x] 12.1 Tambahkan timeout untuk eskalasi yang tidak direspons agent tujuan
- [x] 12.2 Implementasikan reminder internal untuk task `waiting_external_agent`
- [x] 12.3 Naikkan severity menjadi `risk_alert` untuk tiket kritis yang melewati ambang waktu
  - [ ] 12.4 Tangani kasus missing delivery context dengan eskalasi otomatis ke Project_Manager_Agent

- [x] 13. Support Reporting
- [x] 13.1 Implementasikan `report_generate` untuk laporan periodik support
- [x] 13.2 Sertakan jumlah tiket, kategori, first response time, dan average resolution time
- [x] 13.3 Tandai tiket prioritas tinggi yang belum selesai dengan `[ACTION REQUIRED]`
- [x] 13.4 Tambahkan histori support per proyek

- [x] 14. Task and Observability Integration
- [x] 14.1 Modelkan pekerjaan asinkron sebagai `Task` bertipe `ticket_triage`, `knowledge_resolution`, `ticket_escalation`, `risk_review`, dan `support_report`
- [x] 14.2 Tambahkan lifecycle task `queued`, `running`, `waiting_external_agent`, `waiting_client`, `completed`, dan `failed`
- [x] 14.3 Laporkan metrik tiket terbuka, jumlah eskalasi, jumlah risk alert, dan SLA status ke dashboard induk

- [x] 15. Validation and Contract Tests
- [x] 15.1 Uji schema `SupportTicket`, `ResolutionNote`, `TicketEscalationPayload`, dan `RiskAlert`
- [x] 15.2 Uji kontrak `Agent_Message` untuk `ticket_escalation`
- [x] 15.3 Uji kontrak `Agent_Message` untuk `risk_alert`
- [x] 15.4 Uji bahwa tiket tidak bisa ditandai `resolved` sebelum ada update final ke klien

- [x] 16. Integration Tests
- [x] 16.1 Uji alur tiket pertama setelah `delivered` yang memetakan proyek ke `support`
- [x] 16.2 Uji alur known issue yang selesai tanpa eskalasi
- [x] 16.3 Uji alur `ticket_escalation` ke Engineering_Agent
- [x] 16.4 Uji alur `ticket_escalation` ke Project_Manager_Agent
- [x] 16.5 Uji alur isu berulang yang memicu `risk_alert`
