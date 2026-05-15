# Tasks

## AI Company Agents

---

## Task List

- [x] 1. Define Cross-Agent Domain Model
  - [x] 1.1 Definisikan enum `Lifecycle_State` global: `lead`, `qualified`, `proposal`, `won`, `discovery`, `implementation`, `qa`, `delivered`, `support`, `closed`
  - [x] 1.2 Definisikan mapping antara event pipeline sales dan transisi lifecycle global
  - [x] 1.3 Definisikan model `Approval_Gate`, `Approval_Request`, dan `Approval_Response` yang dipakai lintas agent
  - [x] 1.4 Definisikan namespace artefak proyek `projects/{client_id}/{project_id}/` beserta aturan isolasinya

- [x] 2. Design Agent Registry Contract
  - [x] 2.1 Definisikan schema state agent minimum: `agent_id`, `agent_type`, `status`, `current_project_id`, `last_activity_timestamp`
  - [x] 2.2 Definisikan schema state proyek minimum: `project_id`, `client_id`, `lifecycle_state`, `active_agent_ids`, `current_milestone`, `updated_at`
  - [x] 2.3 Definisikan aturan validasi akses agent terhadap `project_id` sebelum pesan atau handoff diteruskan
  - [x] 2.4 Definisikan histori state agar dashboard dapat menampilkan perubahan tanpa menghapus record lama

- [x] 3. Design Agent Message Bus Contract
  - [x] 3.1 Definisikan schema `Agent_Message` dengan field wajib `from`, `to`, `message_type`, `project_id`, `timestamp`, dan `payload`
  - [x] 3.2 Definisikan daftar `message_type` minimum: `lead_handoff`, `discovery_handoff`, `implementation_handoff`, `status_update`, `clarification_request`, `clarification_response`, `approval_request`, `approval_response`, `ticket_escalation`, dan `risk_alert`
  - [x] 3.3 Definisikan perilaku penolakan pesan yang tidak valid atau kehilangan field wajib
  - [x] 3.4 Definisikan audit log untuk seluruh komunikasi penting lintas agent

- [x] 4. Define Company Dashboard Read Model
  - [x] 4.1 Definisikan panel status agent, pipeline lead, proyek aktif, approval pending, blocker delivery, KPI, dan tiket support
  - [x] 4.2 Definisikan sumber data dashboard dari `Agent_Registry` dan audit/event log
  - [x] 4.3 Definisikan indikator isu operasional untuk status `stale`, `offline`, dan `error`
  - [x] 4.4 Definisikan refresh/update behavior dashboard terhadap perubahan state proyek dan agent

- [x] 5. Specify End-to-End Handoff Flows
  - [x] 5.1 Definisikan artefak minimum untuk handoff Marketing ke Sales
  - [x] 5.2 Definisikan artefak minimum untuk `lead_handoff` dari Sales Agent ke Product Agent
  - [x] 5.3 Definisikan artefak minimum untuk `discovery_handoff` dari Product Agent ke Engineering Agent
  - [x] 5.4 Definisikan artefak minimum untuk eskalasi support dan blocker lintas fungsi
  - [x] 5.5 Definisikan SLA acknowledgment handoff agar agent penerima wajib mengonfirmasi penerimaan

- [ ] 6. Align Parent Spec with Individual Agent Specs
  - [ ] 6.1 Tambahkan referensi eksplisit ke spec CEO Agent untuk orkestrasi, dashboard, registry, dan delegasi
  - [ ] 6.2 Tambahkan referensi eksplisit ke spec Sales Agent untuk lifecycle sales, proposal, approval, dan `lead_handoff`
  - [ ] 6.3 Tambahkan referensi ke Product, Engineering, Project Manager, Marketing, dan Support sebagai implementasi detail agent
  - [x] 6.4 Verifikasi bahwa semua spec individual kompatibel dengan kontrak lifecycle, handoff, `Agent_Message`, dan approval gate dari spec induk

- [x] 7. Prepare Integration and Validation Plan
  - [x] 7.1 Rancang validasi transisi lifecycle agar perubahan state ilegal dapat ditolak
  - [x] 7.2 Rancang validasi hak akses lintas proyek pada registry dan message routing
  - [x] 7.3 Rancang pengujian end-to-end lead -> proposal -> won -> discovery -> implementation -> delivered -> support
  - [x] 7.4 Rancang pengujian auditability untuk approval, handoff, dan escalations
