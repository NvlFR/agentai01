# Requirements Document

## Introduction

Dokumen ini mendefinisikan requirements untuk **AI Company Agents** sebagai **spec induk** dari seluruh sistem perusahaan berbasis AI agent. Spec ini menjadi penghubung utama antara semua spec agent individual:

1. **CEO Agent** — orkestrasi strategis dan alokasi prioritas
2. **Sales Agent** — prospecting, kualifikasi lead, proposal, dan handoff deal
3. **Product Agent** — discovery kebutuhan klien dan penyusunan spesifikasi teknis
4. **Engineering Agent** — implementasi solusi, testing, QA, dan delivery
5. **Marketing Agent** — positioning, campaign, dan asset untuk mendukung sales
6. **Project Manager Agent** — koordinasi timeline, milestone, risiko, dan status proyek
7. **Support Agent** — penanganan tiket dan layanan pasca-delivery

Spec ini tidak menggantikan spec masing-masing agent, tetapi mendefinisikan:

- alur bisnis utama perusahaan
- titik handoff antar agent
- aturan koordinasi lintas fungsi
- approval gate yang melibatkan Owner
- state proyek dari lead sampai support

Seluruh sistem mengacu pada arsitektur referensi di `restored-src/src/`, terutama pola `AgentDefinition`, `Tool`, `Task`, `QueryEngine`, dan format pesan terstruktur antar agent.

---

## Glossary

- **AI_Company**: Perusahaan berbasis AI agency yang dioperasikan oleh kumpulan AI agent.
- **Owner**: Pemilik manusia yang memberikan arahan strategis, menyetujui keputusan penting, dan menerima laporan.
- **CEO_Agent**: Agent orkestrator utama yang mengarahkan agent lain sesuai prioritas bisnis.
- **Sales_Agent**: Agent yang mengelola lead, outreach, proposal, dan closing.
- **Marketing_Agent**: Agent yang menghasilkan insight pasar, asset, dan campaign untuk mendukung demand generation.
- **Product_Agent**: Agent yang mengubah kebutuhan bisnis menjadi spesifikasi teknis.
- **Engineering_Agent**: Agent yang membangun deliverable klien berdasarkan Spec yang disetujui.
- **Project_Manager_Agent**: Agent yang melacak milestone, blocker, dan sinkronisasi antar agent selama proyek aktif.
- **Support_Agent**: Agent yang menangani pertanyaan, issue, dan request klien setelah delivery.
- **Lead**: Prospek calon klien yang masuk ke pipeline penjualan.
- **Project**: Unit kerja delivery untuk satu klien yang sudah disetujui.
- **Lifecycle_State**: Status global perjalanan klien atau proyek: `lead`, `qualified`, `proposal`, `won`, `discovery`, `implementation`, `qa`, `delivered`, `support`, `closed`.
- **Handoff**: Perpindahan konteks, artefak, dan tanggung jawab kerja dari satu agent ke agent lain.
- **Approval_Gate**: Titik keputusan yang membutuhkan persetujuan Owner.
- **Company_Dashboard**: Tampilan status agent, pipeline, proyek, KPI, tiket support, dan isu penting.
- **Agent_Registry**: Sistem pusat yang menyimpan identitas agent, kapabilitas, status, dan konteks proyek aktif.
- **Agent_Message**: Format pesan JSON terstruktur yang digunakan untuk komunikasi lintas agent.

---

## Requirements

### Requirement 1: Spec Induk Sebagai Orkestrasi Seluruh Agent

**User Story:** Sebagai Owner, saya ingin memiliki satu spec induk yang menjelaskan hubungan semua agent, sehingga keseluruhan perusahaan terasa nyambung dan tidak menjadi kumpulan agent yang berdiri sendiri.

#### Acceptance Criteria

1. THE AI_Company spec SHALL berfungsi sebagai referensi utama untuk lifecycle bisnis end-to-end dari lead acquisition sampai post-delivery support.
2. THE AI_Company spec SHALL mendefinisikan peran dan batas tanggung jawab untuk CEO_Agent, Sales_Agent, Marketing_Agent, Product_Agent, Engineering_Agent, Project_Manager_Agent, dan Support_Agent.
3. THE AI_Company spec SHALL mendefinisikan titik handoff wajib antar agent dan artefak minimum yang harus dibawa pada setiap handoff.
4. THE AI_Company spec SHALL menyatakan bahwa detail perilaku masing-masing agent berada pada spec agent individual, tetapi aturan alur lintas agent berada pada spec induk ini.
5. WHEN terjadi konflik interpretasi antara alur lintas agent dan spec individual, THEN AI_Company spec SHALL menjadi sumber kebenaran untuk orkestrasi antar agent.

### Requirement 2: Lifecycle Bisnis End-to-End

**User Story:** Sebagai Owner, saya ingin semua agent bekerja dalam satu alur bisnis yang jelas, sehingga dari marketing sampai support semuanya mengikuti perjalanan klien yang sama.

#### Acceptance Criteria

1. THE AI_Company SHALL memodelkan lifecycle bisnis dengan state minimum: `lead`, `qualified`, `proposal`, `won`, `discovery`, `implementation`, `qa`, `delivered`, `support`, dan `closed`.
2. WHEN sebuah lead baru masuk, THE default Lifecycle_State SHALL dimulai pada `lead`.
3. WHEN Sales_Agent menyatakan lead memenuhi syarat, THEN Lifecycle_State SHALL berubah menjadi `qualified`.
4. WHEN proposal dikirim ke klien, THEN Lifecycle_State SHALL berubah menjadi `proposal`.
5. WHEN klien menyetujui proposal, THEN Lifecycle_State SHALL berubah menjadi `won` dan proyek delivery SHALL dibuat.
6. WHEN Product_Agent memulai discovery, THEN Lifecycle_State proyek SHALL berubah menjadi `discovery`.
7. WHEN Engineering_Agent memulai implementasi, THEN Lifecycle_State proyek SHALL berubah menjadi `implementation`.
8. WHEN deliverable memasuki validasi akhir, THEN Lifecycle_State proyek SHALL berubah menjadi `qa`.
9. WHEN Owner menyetujui delivery final, THEN Lifecycle_State proyek SHALL berubah menjadi `delivered`.
10. WHEN klien mengirim pertanyaan atau issue pasca-delivery, THEN Lifecycle_State SHALL dapat berpindah ke `support` tanpa menghapus histori delivery.

### Requirement 3: Alur Marketing ke Sales

**User Story:** Sebagai Owner, saya ingin Marketing_Agent dan Sales_Agent tersambung, sehingga insight pasar dan asset kampanye benar-benar membantu proses closing.

#### Acceptance Criteria

1. THE Marketing_Agent SHALL menghasilkan asset, pain point insight, dan messaging yang dapat dikonsumsi langsung oleh Sales_Agent.
2. WHEN Marketing_Agent membuat campaign yang menargetkan segmen tertentu, THE Sales_Agent SHALL dapat mengakses segment insight tersebut untuk outreach.
3. WHEN campaign menghasilkan lead inbound, THEN lead tersebut SHALL didaftarkan ke pipeline Sales_Agent dengan metadata sumber campaign.
4. IF Sales_Agent melaporkan objection atau pola respons baru dari pasar, THEN Marketing_Agent SHALL dapat menggunakan feedback itu untuk memperbarui messaging.
5. THE AI_Company spec SHALL mendefinisikan bahwa hubungan Marketing_Agent ke Sales_Agent adalah loop dua arah, bukan handoff satu kali.

### Requirement 4: Alur Sales ke Product

**User Story:** Sebagai Owner, saya ingin hasil closing dari Sales_Agent bisa langsung diteruskan ke Product_Agent tanpa kehilangan konteks bisnis, sehingga discovery tidak mengulang dari nol.

#### Acceptance Criteria

1. WHEN Sales_Agent menandai lead sebagai `won`, THE system SHALL membuat `project_id` baru yang terkait dengan `lead_id`.
2. THE Sales_Agent SHALL mengirim Handoff ke Product_Agent yang memuat ringkasan bisnis klien, stakeholder, proposal terakhir, ruang lingkup awal, asumsi komersial, dan risiko awal.
3. THE Product_Agent SHALL mengonfirmasi penerimaan handoff dalam waktu tidak lebih dari 30 detik.
4. WHEN Product_Agent menerima handoff lengkap, THEN Lifecycle_State proyek SHALL berubah menjadi `discovery`.
5. IF artefak handoff dari Sales_Agent tidak lengkap, THEN Product_Agent SHALL meminta klarifikasi sebelum discovery berlanjut.

### Requirement 5: Alur Product ke Engineering

**User Story:** Sebagai Owner, saya ingin spesifikasi dari Product_Agent mengalir rapi ke Engineering_Agent, sehingga implementasi tidak terputus atau bergantung pada penjelasan manual.

#### Acceptance Criteria

1. WHEN Owner menyetujui Spec dari Product_Agent, THE Product_Agent SHALL mengirim Handoff formal ke Engineering_Agent.
2. THE handoff SHALL memuat Spec final, scope MVP, daftar tool, acceptance criteria, batasan teknis, dan risiko implementasi.
3. THE Engineering_Agent SHALL mengonfirmasi penerimaan handoff dan membuat Implementation_Plan awal.
4. IF Engineering_Agent menemukan ambiguitas, THEN Engineering_Agent SHALL mengirim permintaan klarifikasi ke Product_Agent tanpa mengubah spec secara diam-diam.
5. THE AI_Company spec SHALL mendefinisikan bahwa Product_Agent tetap menjadi pemilik interpretasi scope selama proyek belum masuk status `delivered`.

### Requirement 6: Peran Project Manager Dalam Delivery

**User Story:** Sebagai Owner, saya ingin Project_Manager_Agent menghubungkan Sales, Product, Engineering, dan Support selama proyek berjalan, sehingga timeline dan dependency tetap terkendali.

#### Acceptance Criteria

1. WHEN proyek dibuat setelah deal `won`, THE Project_Manager_Agent SHALL membuat Project_Timeline awal.
2. THE Project_Manager_Agent SHALL mulai memantau milestone aktif sejak state `discovery`.
3. THE Project_Manager_Agent SHALL melacak handoff Sales_Agent ke Product_Agent dan Product_Agent ke Engineering_Agent sebagai milestone eksplisit.
4. WHEN milestone terlambat atau blocker muncul, THE Project_Manager_Agent SHALL mengeskalasi ke CEO_Agent atau Owner sesuai severity.
5. THE Project_Manager_Agent SHALL menyediakan status proyek lintas fungsi yang menggabungkan konteks komersial, produk, engineering, dan support.

### Requirement 7: Peran CEO Dalam Orkestrasi

**User Story:** Sebagai Owner, saya ingin CEO_Agent menjadi penghubung utama seluruh sistem, sehingga saya dapat mengelola perusahaan lewat satu pintu koordinasi.

#### Acceptance Criteria

1. THE CEO_Agent SHALL menjadi titik masuk utama untuk arahan strategis Owner.
2. THE CEO_Agent SHALL dapat mendelegasikan objective ke Marketing_Agent, Sales_Agent, Product_Agent, Engineering_Agent, Project_Manager_Agent, dan Support_Agent.
3. THE CEO_Agent SHALL memantau Company_Dashboard yang menggabungkan pipeline sales, proyek delivery, KPI marketing, utilisasi agent, dan tiket support.
4. WHEN ada konflik prioritas antar proyek atau antar agent, THE CEO_Agent SHALL menjadi pengambil keputusan operasional default sebelum eskalasi ke Owner.
5. THE AI_Company spec SHALL mendefinisikan CEO_Agent sebagai orkestrator lintas agent, bukan pelaksana delivery teknis utama.

### Requirement 8: Approval Gate Owner

**User Story:** Sebagai Owner, saya ingin hanya terlibat di titik-titik keputusan penting, sehingga saya tetap memegang kontrol tanpa harus ikut mengerjakan semua detail.

#### Acceptance Criteria

1. THE AI_Company SHALL memiliki Approval_Gate minimum pada tahap: proposal final, Spec final, delivery final, dan keputusan strategis lintas proyek yang berdampak tinggi.
2. WHEN Approval_Gate tercapai, THE agent yang mengajukan SHALL mengirim ringkasan, rekomendasi, risiko, dan opsi keputusan kepada Owner.
3. THE Owner SHALL dapat merespons dengan `approve`, `reject`, atau `revise`.
4. IF Owner memilih `revise`, THEN agent terkait SHALL melanjutkan iterasi tanpa menghilangkan versi artefak sebelumnya.
5. THE Company_Dashboard SHALL menampilkan Approval_Gate yang sedang menunggu keputusan Owner.

### Requirement 9: Komunikasi Antar Agent Yang Seragam

**User Story:** Sebagai sistem, saya ingin semua agent berkomunikasi dengan format yang seragam, sehingga handoff dan koordinasi dapat divalidasi dan dilacak.

#### Acceptance Criteria

1. THE AI_Company SHALL menggunakan format `Agent_Message` JSON dengan field wajib: `from`, `to`, `message_type`, `project_id`, `timestamp`, dan `payload`.
2. THE `message_type` minimum SHALL mendukung: `lead_handoff`, `discovery_handoff`, `implementation_handoff`, `status_update`, `clarification_request`, `clarification_response`, `approval_request`, `approval_response`, `ticket_escalation`, dan `risk_alert`.
3. WHEN pesan tidak valid atau kehilangan field wajib, THEN sistem SHALL menolak pesan tersebut dan mencatat error.
4. THE Agent_Registry SHALL memvalidasi hak akses agent terhadap `project_id` sebelum pesan diteruskan.
5. THE AI_Company SHALL menyimpan log seluruh komunikasi penting untuk audit dan debugging.

### Requirement 10: Dashboard dan State Terpadu

**User Story:** Sebagai Owner, saya ingin satu dashboard terpadu yang menampilkan kondisi seluruh perusahaan, sehingga saya tidak perlu mengecek agent satu per satu.

#### Acceptance Criteria

1. THE Company_Dashboard SHALL menampilkan minimal: status semua agent, pipeline lead, proyek aktif, approval yang menunggu, KPI utama, blocker delivery, dan tiket support terbuka.
2. THE Agent_Registry SHALL menyimpan state tiap agent dengan field minimum: `agent_id`, `agent_type`, `status`, `current_project_id`, dan `last_activity_timestamp`.
3. THE Agent_Registry SHALL menyimpan state tiap proyek dengan field minimum: `project_id`, `client_id`, `lifecycle_state`, `active_agent_ids`, `current_milestone`, dan `updated_at`.
4. WHEN state proyek berubah, THEN Company_Dashboard SHALL diperbarui tanpa menghapus histori state sebelumnya.
5. IF agent menjadi `stale`, `offline`, atau `error`, THEN Company_Dashboard SHALL menandainya sebagai isu operasional aktif.

### Requirement 11: Keamanan dan Isolasi Lintas Proyek

**User Story:** Sebagai Owner, saya ingin seluruh alur perusahaan aman terhadap kebocoran data klien, sehingga setiap proyek tetap terisolasi meskipun dikerjakan oleh banyak agent.

#### Acceptance Criteria

1. THE AI_Company SHALL mengisolasi artefak per klien dan per proyek menggunakan namespace `projects/{client_id}/{project_id}/`.
2. THE Sales_Agent, Product_Agent, Engineering_Agent, Project_Manager_Agent, dan Support_Agent SHALL hanya dapat mengakses proyek yang sedang menjadi konteks aktifnya.
3. WHEN agent mencoba mengakses artefak proyek lain tanpa otorisasi, THEN sistem SHALL menolak akses dan mencatat audit log.
4. THE AI_Company SHALL melarang penyimpanan credential klien secara langsung di Spec, proposal, atau source code delivery.
5. THE Agent_Registry SHALL memvalidasi setiap handoff dan pesan lintas agent terhadap hak akses proyek yang berlaku.

### Requirement 12: Hubungan Dengan Spec Agent Individual

**User Story:** Sebagai developer, saya ingin spec induk ini terhubung jelas ke spec tiap agent, sehingga implementasi nanti bisa dipecah per agent tanpa kehilangan konteks sistem.

#### Acceptance Criteria

1. THE AI_Company spec SHALL mereferensikan spec individual untuk detail perilaku CEO_Agent, Sales_Agent, Product_Agent, Engineering_Agent, Marketing_Agent, Project_Manager_Agent, dan Support_Agent.
2. THE AI_Company spec SHALL mendefinisikan bahwa setiap spec individual wajib kompatibel dengan lifecycle, handoff, dan `Agent_Message` yang didefinisikan di spec induk.
3. WHEN spec individual diperbarui dengan perubahan yang memengaruhi alur lintas agent, THEN AI_Company spec SHALL ikut diperbarui agar tetap sinkron.
4. THE AI_Company spec SHALL menjadi dasar untuk pembuatan `design.md` dan `tasks.md` lintas agent di tahap berikutnya.
5. THE AI_Company spec SHALL memungkinkan implementasi bertahap per agent, selama kontrak lintas agent tetap dipatuhi.

---

## Agent Flow Summary

Alur utama perusahaan SHALL mengikuti urutan berikut:

1. Marketing_Agent membangun demand, insight pasar, dan asset untuk Sales_Agent.
2. Sales_Agent mengelola lead, melakukan kualifikasi, menyiapkan proposal, dan menutup deal.
3. Setelah deal `won`, Sales_Agent melakukan handoff ke Product_Agent dan Project_Manager_Agent.
4. Product_Agent menjalankan discovery dan menghasilkan Spec untuk disetujui Owner.
5. Setelah Spec disetujui, Product_Agent melakukan handoff ke Engineering_Agent.
6. Engineering_Agent membangun deliverable dan berkoordinasi dengan Project_Manager_Agent selama implementasi dan QA.
7. Setelah delivery disetujui Owner, hasil diserahkan ke klien dan proyek memasuki fase support.
8. Support_Agent menangani ticket pasca-delivery dan mengeskalasi issue ke Engineering_Agent atau Project_Manager_Agent bila diperlukan.
9. CEO_Agent memantau, memprioritaskan, dan mengorkestrasi seluruh alur tersebut untuk Owner.

---

## Spec Mapping

- Detail orkestrasi strategis: [ceo-agent](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/ceo-agent/requirements.md)
- Detail pipeline penjualan: [sales-agent](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/sales-agent/requirements.md)
- Detail discovery dan spesifikasi: [product-agent](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/product-agent/requirements.md)
- Detail implementasi dan QA: [engineering-agent](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/engineering-agent/requirements.md)
- Detail campaign dan asset: [marketing-agent](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/marketing-agent/requirements.md)
- Detail timeline dan koordinasi proyek: [project-manager-agent](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/project-manager-agent/requirements.md)
- Detail layanan pasca-delivery: [support-agent](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/support-agent/requirements.md)
