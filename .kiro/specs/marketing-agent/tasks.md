# Tasks

## Marketing Agent

---

## Task List

- [x] 1. Marketing Agent Foundation
  - [x] 1.1 Definisikan `Marketing_Agent` sebagai `AgentDefinition` valid dengan `agentType: "marketing"`
  - [x] 1.2 Tambahkan `systemPrompt` yang menegaskan peran demand generation, lead routing, dan feedback loop ke Sales_Agent
  - [x] 1.3 Registrasikan tool inti `campaign_plan`, `content_write`, `market_research`, `asset_store`, dan `message_send`
  - [x] 1.4 Siapkan konfigurasi penyimpanan persisten untuk campaign, asset, insight, dan handoff lead

- [x] 2. Campaign Planning Workflow
  - [x] 2.1 Implementasikan input schema `CampaignPlanInput` dengan objective, target segment, channel, timeline, dan success metrics
  - [x] 2.2 Implementasikan `createCampaignPlan()` yang menghasilkan plan versioned
  - [x] 2.3 Implementasikan `reviseCampaignPlan()` tanpa menghapus versi sebelumnya
  - [x] 2.4 Buat `Task` bertipe `campaign_planning` untuk pekerjaan campaign bertahap

- [ ] 3. Market Research and Positioning
  - [ ] 3.1 Implementasikan tool `market_research` untuk merangkum tren pasar, pain point, dan buying trigger
  - [ ] 3.2 Tambahkan output `positioning_statement` dan `recommended_messaging` per segmen
  - [x] 3.3 Simpan hasil research sebagai artefak yang dapat dipakai ulang oleh campaign lain
  - [x] 3.4 Tambahkan deteksi perubahan insight yang memicu rekomendasi revisi messaging

- [ ] 4. Asset Generation
  - [ ] 4.1 Implementasikan `content_write` untuk menghasilkan draft artikel, landing copy, email sequence, dan social post
  - [x] 4.2 Tambahkan mode asset sales enablement untuk one-pager, case-study summary, dan objection-handling copy
  - [x] 4.3 Pastikan setiap asset membawa `campaign_id`, `segment_id`, `cta`, dan `version`
  - [x] 4.4 Tambahkan status asset `draft`, `ready`, `revised`, dan `requires_validation`

- [ ] 5. Technical Claim Validation
  - [x] 5.1 Tambahkan aturan bahwa klaim teknis harus ditandai bila belum tervalidasi
  - [ ] 5.2 Integrasikan input dari Product_Agent atau Engineering_Agent untuk asset yang menyebut capability teknis
  - [x] 5.3 Cegah asset `requires_validation` dikirim sebagai materi final ke Sales_Agent

- [x] 6. Persistent Asset Store
  - [x] 6.1 Implementasikan `asset_store.saveCampaign()`
  - [x] 6.2 Implementasikan `asset_store.saveAsset()`
  - [x] 6.3 Implementasikan `asset_store.recordSalesUsage()` untuk memetakan asset ke segmen dan campaign
  - [x] 6.4 Implementasikan query untuk mengambil asset terbaru per segmen

- [x] 7. Marketing to Sales Asset Delivery
  - [x] 7.1 Definisikan payload `AssetPackage` untuk pengiriman asset ke Sales_Agent
  - [x] 7.2 Implementasikan pengiriman asset via `Agent_Message`
  - [x] 7.3 Gunakan `message_type: "status_update"` atau payload lain yang kompatibel untuk distribusi non-lead
  - [x] 7.4 Catat acknowledgment penggunaan asset oleh Sales_Agent

- [x] 8. Lead Generation and Handoff
  - [x] 8.1 Definisikan schema `InboundLeadPacket` dengan metadata campaign lengkap
  - [x] 8.2 Implementasikan `campaign_lead_router.registerInboundLead()`
  - [x] 8.3 Kirim lead inbound ke Sales_Agent menggunakan `Agent_Message` dengan `message_type: "lead_handoff"`
  - [x] 8.4 Pastikan `project_id` dapat bernilai `null` untuk lead yang belum menjadi proyek
  - [x] 8.5 Simpan log handoff dan status acknowledgment dari Sales_Agent

- [ ] 9. Lead Handoff Reliability
  - [x] 9.1 Tambahkan retry idempoten untuk `lead_handoff` yang belum di-ack
  - [x] 9.2 Tandai lead `pending_sales_ack` bila pengiriman belum terkonfirmasi
  - [x] 9.3 Eskalasikan kegagalan berulang ke CEO_Agent melalui `status_update`
  - [ ] 9.4 Simpan audit log untuk semua kegagalan handoff

- [x] 10. Sales Feedback Loop
  - [x] 10.1 Definisikan schema `SalesFeedbackPacket` untuk objection, lost reason, dan response pattern
  - [x] 10.2 Implementasikan `sales_feedback_loop.ingestSalesFeedback()`
  - [x] 10.3 Implementasikan `generateMessagingRevision()` per segmen
  - [x] 10.4 Otomatis buat `messaging_revision` task saat mismatch pesan terdeteksi

- [ ] 11. Task and State Management
  - [x] 11.1 Tambahkan lifecycle task `queued`, `running`, `waiting_feedback`, `completed`, `failed`
  - [x] 11.2 Pastikan task marketing dapat dipulihkan setelah restart
  - [ ] 11.3 Sinkronkan status task penting ke dashboard induk

- [x] 12. Observability and Reporting
  - [x] 12.1 Laporkan jumlah campaign aktif, asset per segmen, dan lead inbound per campaign
  - [x] 12.2 Tambahkan metrik acknowledgment rate dari Sales_Agent
  - [x] 12.3 Tambahkan metrik conversion feedback per source channel
  - [x] 12.4 Tandai campaign `at_risk` bila messaging drift tinggi

- [x] 13. Validation and Contract Tests
  - [x] 13.1 Uji validasi schema `CampaignPlan`, `MarketInsight`, `MarketingAsset`, dan `InboundLeadPacket`
  - [x] 13.2 Uji kontrak `Agent_Message` Marketing ke Sales agar kompatibel dengan spec induk
  - [x] 13.3 Uji bahwa `lead_handoff` selalu membawa metadata campaign minimum
  - [x] 13.4 Uji versioning asset dan campaign agar revisi tidak menimpa histori

- [x] 14. Integration Tests
  - [x] 14.1 Uji alur objective ke campaign plan ke asset delivery
  - [x] 14.2 Uji alur inbound campaign lead sampai tercatat di Sales_Agent
  - [x] 14.3 Uji feedback objection dari Sales_Agent yang memicu revisi messaging
  - [x] 14.4 Uji kegagalan acknowledgment yang memicu retry dan eskalasi
