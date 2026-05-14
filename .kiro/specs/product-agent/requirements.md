# Requirements Document

## Introduction

Dokumen ini mendefinisikan requirements untuk **Product Agent** dalam AI Company. Product Agent bertanggung jawab menerjemahkan kebutuhan bisnis klien menjadi spesifikasi teknis yang siap diimplementasikan oleh Engineering Agent.

Product Agent menjadi penghubung utama antara konteks bisnis dari Sales Agent atau Owner dengan konteks delivery teknis. Implementasinya mengikuti arsitektur referensi di `restored-src/src/`.

Spec ini harus kompatibel dengan spec induk [ai-company-agents](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/ai-company-agents/requirements.md), terutama untuk transisi `Lifecycle_State` dari `discovery` ke `implementation`, kontrak handoff, dan `Agent_Message`.

---

## Glossary

- **Product_Agent**: AI agent yang menjalankan discovery, analisis kebutuhan, dan penulisan spesifikasi.
- **Client_Brief**: Dokumen atau catatan awal berisi kebutuhan dan konteks klien.
- **Spec**: Spesifikasi teknis yang menjadi dasar implementasi.
- **Capability_Map**: Daftar kemampuan yang harus dimiliki agent untuk memenuhi tujuan klien.
- **Acceptance_Criteria**: Kriteria terukur yang menjadi acuan validasi delivery.
- **Technical_Risk**: Ketidakpastian teknis yang dapat memengaruhi implementasi.
- **Lifecycle_State**: State global proyek yang pada fase Product_Agent minimal mencakup `discovery`.
- **Agent_Message**: Format pesan JSON terstruktur lintas agent yang didefinisikan di spec induk.

---

## Requirements

### Requirement 1: Discovery Kebutuhan Klien

**User Story:** Sebagai Owner, saya ingin Product_Agent menggali kebutuhan klien secara sistematis, sehingga solusi yang dibangun benar-benar relevan dengan masalah bisnis klien.

#### Acceptance Criteria

1. WHEN Product_Agent menerima Client_Brief, THE Product_Agent SHALL menghasilkan daftar pertanyaan klarifikasi yang mencakup tujuan bisnis, user persona, integrasi, batasan operasional, dan target keberhasilan.
2. THE Product_Agent SHALL merangkum hasil discovery ke dalam dokumen ringkas yang dapat ditinjau Owner sebelum spesifikasi final dibuat.
3. IF terdapat informasi yang kontradiktif di antara sumber input, THEN THE Product_Agent SHALL menandai konflik tersebut dan meminta resolusi.
4. THE Product_Agent SHALL menyimpan semua pertanyaan dan jawaban discovery sebagai bagian dari histori proyek.
5. WHEN discovery selesai, THE Product_Agent SHALL menghasilkan rekomendasi tipe agent yang paling sesuai dengan kebutuhan klien.
6. WHEN Product_Agent menerima `lead_handoff` yang valid dari Sales_Agent, THEN Product_Agent SHALL mengubah `Lifecycle_State` proyek menjadi `discovery`.

### Requirement 2: Pembuatan Spesifikasi Teknis

**User Story:** Sebagai Engineering_Agent, saya ingin menerima spesifikasi yang jelas dan minim ambiguitas, sehingga implementasi dapat dimulai tanpa banyak bolak-balik klarifikasi.

#### Acceptance Criteria

1. THE Product_Agent SHALL menghasilkan Spec Markdown yang memuat ringkasan solusi, daftar kapabilitas, workflow utama, tool yang dibutuhkan, integrasi eksternal, dan acceptance criteria.
2. THE Product_Agent SHALL mendefinisikan setiap tool minimal dengan nama, tujuan, input, output, dan batasan.
3. WHEN alur kerja agent bersifat multi-step, THE Product_Agent SHALL mendeskripsikannya dalam bentuk state flow atau urutan tahapan yang eksplisit.
4. IF ada keputusan desain yang bergantung pada asumsi, THEN THE Product_Agent SHALL mencatat asumsi tersebut dalam section khusus.
5. THE Product_Agent SHALL menyimpan Spec ke lokasi `{client_id}/{project_id}/spec-v{version}.md`.
6. THE Product_Agent SHALL menyusun Spec dengan struktur yang kompatibel dengan approval dan handoff ke Engineering_Agent di spec induk.

### Requirement 3: Validasi Scope dan Risiko

**User Story:** Sebagai Owner, saya ingin Product_Agent menilai kelayakan dan risiko scope sebelum delivery dimulai, sehingga proyek tidak masuk ke implementasi dengan asumsi yang salah.

#### Acceptance Criteria

1. THE Product_Agent SHALL mengidentifikasi risiko teknis, risiko data, dan risiko dependency eksternal untuk setiap proyek.
2. THE Product_Agent SHALL memberi label prioritas pada setiap risiko: `critical`, `high`, `medium`, atau `low`.
3. WHEN Product_Agent menemukan scope yang terlalu besar untuk timeline yang diminta, THE Product_Agent SHALL mengusulkan pemecahan scope menjadi fase-fase delivery.
4. IF ada requirement yang belum dapat diuji, THEN THE Product_Agent SHALL menandainya sebagai gap sebelum handoff.
5. THE Product_Agent SHALL menyertakan rekomendasi MVP dan non-MVP di dalam Spec.

### Requirement 4: Handoff ke Engineering Agent

**User Story:** Sebagai Engineering_Agent, saya ingin menerima handoff yang lengkap dan terstruktur, sehingga saya bisa langsung mengeksekusi implementasi.

#### Acceptance Criteria

1. WHEN Owner menyetujui Spec, THE Product_Agent SHALL mengirimkan Handoff ke Engineering_Agent.
2. THE Product_Agent SHALL menyertakan dalam Handoff: Spec final, catatan discovery, batasan proyek, prioritas fitur, dan daftar risiko utama.
3. THE Product_Agent SHALL menggunakan format `Agent_Message` dan `message_type: "discovery_handoff"` untuk komunikasi handoff ke Engineering_Agent.
4. WHEN Engineering_Agent meminta klarifikasi, THE Product_Agent SHALL merespons menggunakan `message_type: "clarification_response"` atau revisi Spec dalam satu siklus.
5. WHEN Engineering_Agent mengonfirmasi penerimaan handoff, THEN Product_Agent SHALL menandai proyek siap memasuki `Lifecycle_State: implementation`.
6. THE Product_Agent SHALL menyimpan log seluruh proses handoff dan klarifikasi lanjutan.

### Requirement 5: Tooling dan Integrasi Arsitektur

**User Story:** Sebagai developer, saya ingin Product_Agent dibangun menggunakan pola yang sama dengan codebase referensi, sehingga agent ini mudah dipelihara dan diperluas.

#### Acceptance Criteria

1. THE Product_Agent SHALL didefinisikan sebagai `AgentDefinition` valid dengan `agentType: "product"`.
2. THE Product_Agent SHALL memiliki tool minimal: `brief_analyze`, `document_read`, `spec_write`, `template_load`, dan `message_send`.
3. THE Product_Agent SHALL mengimplementasikan setiap tool memakai pola `buildTool`, `inputSchema`, dan `checkPermissions` yang relevan.
4. WHEN Product_Agent menjalankan pekerjaan lintas iterasi, THE Product_Agent SHALL menggunakan `Task` yang statusnya dapat dilacak.
5. THE Product_Agent SHALL menjaga version history untuk setiap Spec yang dibuat atau direvisi.
