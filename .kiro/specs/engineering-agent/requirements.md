# Requirements Document

## Introduction

Dokumen ini mendefinisikan requirements untuk **Engineering Agent** dalam AI Company. Engineering Agent bertugas mengimplementasikan solusi AI agent berdasarkan spesifikasi yang telah disetujui, menjalankan validasi teknis, dan menyiapkan deliverable untuk klien.

Engineering Agent harus memanfaatkan pola implementasi yang sudah ada di `restored-src/src/`, terutama arsitektur tool, task, dan definisi agent.

Spec ini harus kompatibel dengan spec induk [ai-company-agents](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/ai-company-agents/requirements.md), terutama untuk transisi `Lifecycle_State` ke `implementation`, `qa`, `delivered`, dan format `Agent_Message`.

---

## Glossary

- **Engineering_Agent**: AI agent yang membangun, menguji, dan mengemas solusi klien.
- **Implementation_Plan**: Rencana kerja teknis bertahap sebelum coding dimulai.
- **Deliverable**: Paket hasil akhir berupa kode, konfigurasi, dan dokumentasi.
- **QA_Report**: Ringkasan hasil validasi teknis sebelum delivery.
- **Client_Workspace**: Ruang kerja terisolasi untuk satu proyek klien.
- **Lifecycle_State**: State global proyek yang pada fase Engineering_Agent minimal mencakup `implementation`, `qa`, dan `delivered`.
- **Agent_Message**: Format pesan JSON terstruktur lintas agent yang didefinisikan di spec induk.

---

## Requirements

### Requirement 1: Perencanaan Implementasi

**User Story:** Sebagai Owner, saya ingin Engineering_Agent membuat rencana implementasi yang jelas sebelum mulai coding, sehingga progress proyek dapat dipahami dan dipantau.

#### Acceptance Criteria

1. WHEN Engineering_Agent menerima Spec yang disetujui, THE Engineering_Agent SHALL menghasilkan Implementation_Plan yang memuat urutan kerja, dependensi, risiko teknis, dan output tiap tahap.
2. THE Engineering_Agent SHALL memetakan setiap capability dalam Spec ke komponen implementasi yang konkret.
3. IF ada bagian Spec yang tidak cukup jelas untuk diimplementasikan, THEN THE Engineering_Agent SHALL mengirim permintaan klarifikasi ke Product_Agent sebelum coding dimulai.
4. THE Engineering_Agent SHALL memperbarui status rencana implementasi saat tiap tahap dimulai dan selesai.
5. THE Engineering_Agent SHALL menyimpan rencana implementasi sebagai artefak proyek.
6. WHEN Engineering_Agent menerima `discovery_handoff` yang valid, THEN Engineering_Agent SHALL mengubah `Lifecycle_State` proyek menjadi `implementation`.

### Requirement 2: Implementasi Tool dan Agent

**User Story:** Sebagai Owner, saya ingin Engineering_Agent dapat membangun agent klien dengan pola yang konsisten dan maintainable, sehingga solusi mudah diuji dan dikembangkan.

#### Acceptance Criteria

1. THE Engineering_Agent SHALL mengimplementasikan tool sesuai pola `buildTool` dengan `name`, `description`, `inputSchema`, `call`, dan `checkPermissions`.
2. THE Engineering_Agent SHALL menghasilkan konfigurasi agent yang kompatibel dengan `AgentDefinition`.
3. WHEN Spec memerlukan integrasi eksternal, THE Engineering_Agent SHALL membungkus integrasi tersebut dalam modul yang terpisah dan terdokumentasi.
4. THE Engineering_Agent SHALL menggunakan struktur folder yang konsisten per proyek klien.
5. IF perubahan implementasi menyimpang dari Spec, THEN THE Engineering_Agent SHALL mencatat alasan dan mengirim notifikasi ke Owner atau Product_Agent.

### Requirement 3: Testing dan Quality Assurance

**User Story:** Sebagai Owner, saya ingin Engineering_Agent memverifikasi kualitas deliverable sebelum diserahkan, sehingga risiko bug dan regresi berkurang.

#### Acceptance Criteria

1. THE Engineering_Agent SHALL menjalankan unit test untuk komponen atau tool yang diimplementasikan.
2. THE Engineering_Agent SHALL menjalankan integration test untuk workflow utama sesuai acceptance criteria di Spec.
3. WHEN test gagal, THE Engineering_Agent SHALL menganalisis akar masalah, memperbaiki implementasi, dan menjalankan ulang validasi.
4. THE Engineering_Agent SHALL menghasilkan QA_Report yang memuat status test, known limitations, dan catatan deployment.
5. THE Engineering_Agent SHALL menjalankan static checks minimal untuk syntax atau type safety sebelum delivery.
6. WHEN implementasi dinyatakan feature-complete dan memasuki validasi akhir, THEN Engineering_Agent SHALL mengubah `Lifecycle_State` proyek menjadi `qa`.

### Requirement 4: Packaging dan Delivery

**User Story:** Sebagai Owner, saya ingin Engineering_Agent menyiapkan hasil delivery dalam format yang rapi, sehingga mudah direview, dipresentasikan, dan diserahkan ke klien.

#### Acceptance Criteria

1. WHEN implementasi dan QA selesai, THE Engineering_Agent SHALL membuat Deliverable yang mencakup source code, konfigurasi, dokumentasi penggunaan, dan instruksi deployment.
2. THE Engineering_Agent SHALL menyimpan Deliverable ke lokasi `{client_id}/{project_id}/deliverable-v{version}/`.
3. THE Engineering_Agent SHALL mempertahankan changelog untuk setiap revisi delivery.
4. WHEN Owner meminta perubahan pasca-review, THE Engineering_Agent SHALL membuat revisi baru tanpa menimpa versi sebelumnya.
5. THE Engineering_Agent SHALL menandai delivery sebagai `ready_for_owner_review` sebelum penyerahan final.
6. WHEN Owner menyetujui delivery final, THEN Engineering_Agent SHALL mengubah `Lifecycle_State` proyek menjadi `delivered` dan mengirim `status_update` ke Project_Manager_Agent dan Support_Agent.

### Requirement 5: Tooling dan Isolasi Workspace

**User Story:** Sebagai developer, saya ingin Engineering_Agent memiliki tool yang cukup namun tetap aman, sehingga agent dapat bekerja mandiri tanpa merusak proyek lain.

#### Acceptance Criteria

1. THE Engineering_Agent SHALL memiliki tool minimal: `code_read`, `code_write`, `test_run`, `bash_exec`, `deliverable_package`, dan `message_send`.
2. THE Engineering_Agent SHALL membatasi eksekusi shell ke daftar perintah yang diizinkan dan ruang kerja proyek yang relevan.
3. THE Engineering_Agent SHALL menjalankan seluruh modifikasi dalam `Client_Workspace` yang terisolasi per proyek.
4. WHEN terjadi error yang tidak dapat dipulihkan, THE Engineering_Agent SHALL menyimpan konteks kerja terakhir dan mengeskalasi ke Owner.
5. THE Engineering_Agent SHALL dapat dipulihkan ke state sebelumnya setelah restart sistem tanpa kehilangan progres artefak proyek.
