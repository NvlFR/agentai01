# Tasks

## Sales Agent

---

## Task List

- [x] 1. Define Sales Agent Domain Model
  - [x] 1.1 Definisikan `AgentDefinition` untuk `agentType: "sales"` beserta `description`, `tools`, dan `systemPrompt`
  - [x] 1.2 Definisikan model `Lead` minimum: nama perusahaan, kontak utama, industri, sumber lead, dan kebutuhan awal
  - [x] 1.3 Definisikan enum `Pipeline_Stage`: `new`, `contacted`, `qualified`, `proposal_sent`, `negotiation`, `won`, `lost`
  - [x] 1.4 Definisikan field timeline lead dan histori perubahan stage

- [x] 2. Design Lead Intake and Qualification
  - [x] 2.1 Definisikan alur `lead_capture` untuk lead dari Owner, Marketing Agent, atau inbound campaign
  - [x] 2.2 Definisikan model scoring untuk urgency, budget fit, authority, dan use-case relevance
  - [x] 2.3 Definisikan threshold `low_priority` dan alasan yang harus dicatat saat lead tidak lolos kualifikasi
  - [x] 2.4 Definisikan generator pertanyaan klarifikasi saat data lead belum cukup lengkap
  - [x] 2.5 Definisikan sinkronisasi `Pipeline_Stage` ke `Lifecycle_State` global pada spec induk

- [x] 3. Design Outreach and Follow-Up System
  - [x] 3.1 Definisikan template outreach terpersonalisasi berdasarkan industri, pain point, dan value proposition
  - [x] 3.2 Definisikan sequence minimal tiga langkah: kontak awal, follow-up nilai tambah, dan penutupan loop
  - [x] 3.3 Definisikan jadwal follow-up terstruktur sebagai `Task` asinkron yang bisa dipantau
  - [x] 3.4 Definisikan penggunaan preferensi gaya komunikasi Owner dan insight segment dari Marketing Agent
  - [x] 3.5 Definisikan penyimpanan seluruh draft outreach dan follow-up ke timeline lead

- [x] 4. Design Proposal Lifecycle
  - [x] 4.1 Definisikan generator proposal untuk lead `qualified` dengan ringkasan kebutuhan, outcome bisnis, scope awal, timeline, harga, asumsi, dan tag `[NEEDS_SCOPING]`
  - [x] 4.2 Definisikan versioning proposal di path `{lead_id}/proposal-v{version}.md`
  - [x] 4.3 Definisikan alur revisi proposal tanpa menghapus versi sebelumnya
  - [x] 4.4 Definisikan transisi stage ke `proposal_sent` dan pencatatan timestamp saat proposal dikirim ke klien
  - [x] 4.5 Definisikan `Approval_Gate` proposal final sebelum pengiriman ke klien

- [~] 5. Implement Approval Gate Integration
  - [x] 5.1 Definisikan payload `approval_request` untuk proposal final beserta ringkasan, risiko, dan rekomendasi
  - [x] 5.2 Definisikan respons `approve`, `reject`, dan `revise` dari Owner
  - [ ] 5.3 Definisikan bagaimana approval pending tampil di `Company_Dashboard` agar dapat dipantau CEO Agent
  - [x] 5.4 Definisikan bagaimana revisi proposal memulai ulang approval cycle tanpa kehilangan histori versi

- [~] 6. Design Won Deal Handoff
  - [ ] 6.1 Definisikan pembentukan `project_id` saat lead menjadi `won` atau discovery berbayar disetujui
  - [x] 6.2 Definisikan payload `lead_handoff` ke Product Agent dengan ringkasan bisnis, pain points, stakeholder, catatan percakapan, proposal terakhir, dan risiko komersial
  - [x] 6.3 Definisikan notifikasi atau `status_update` ke Project Manager Agent saat proyek dibentuk
  - [x] 6.4 Definisikan acknowledgment Product Agent dan status `handoff_completed`
  - [x] 6.5 Definisikan eskalasi ke CEO Agent atau Owner jika `lead_handoff` gagal

- [~] 7. Design Tooling and Persistence
  - [x] 7.1 Definisikan tool `lead_capture`, `lead_score`, `proposal_write`, `message_send`, dan `pipeline_update`
  - [ ] 7.2 Definisikan penggunaan `buildTool`, `inputSchema`, dan `checkPermissions` yang relevan
  - [x] 7.3 Definisikan penyimpanan persisten untuk pipeline, proposal, timeline lead, dan task follow-up
  - [x] 7.4 Definisikan pemulihan state Sales Agent setelah restart sistem

- [~] 8. Validate Cross-Spec Dependencies
  - [x] 8.1 Verifikasi bahwa lifecycle sales selaras dengan spec induk
  - [ ] 8.2 Verifikasi bahwa `Approval_Gate` proposal terhubung ke Owner dan terlihat di dashboard untuk CEO Agent
  - [x] 8.3 Verifikasi bahwa `lead_handoff` memakai kontrak `Agent_Message` dari spec induk
  - [x] 8.4 Rancang pengujian integrasi end-to-end lead -> qualified -> proposal -> approval -> won -> `lead_handoff`
