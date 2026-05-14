# Requirements Document

## Introduction

Dokumen ini mendefinisikan requirements untuk **Project Manager Agent** dalam AI Company. Project Manager Agent bertugas menjaga delivery tetap on-track dengan memantau milestone, memfasilitasi komunikasi lintas agent, mengelola risiko proyek, dan memastikan Owner memiliki visibilitas status yang jelas.

Project Manager Agent bekerja sebagai lapisan koordinasi operasional di antara Sales Agent, Product Agent, Engineering Agent, Support Agent, dan CEO Agent.

Spec ini harus kompatibel dengan spec induk [ai-company-agents](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/ai-company-agents/requirements.md), terutama untuk milestone handoff, `Lifecycle_State`, Approval_Gate, dan `Agent_Message`.

---

## Glossary

- **Project_Manager_Agent**: AI agent yang mengelola tracking dan koordinasi delivery proyek.
- **Milestone**: Tonggak hasil proyek yang memiliki output dan deadline jelas.
- **Blocker**: Hambatan yang mencegah progres proyek berjalan.
- **Project_Timeline**: Susunan milestone, deadline, dan ketergantungan tugas proyek.
- **Status_Report**: Ringkasan progres proyek yang dikirim ke Owner atau CEO Agent.
- **Lifecycle_State**: State global proyek dari `won` sampai `closed` yang dipantau lintas fungsi.
- **Agent_Message**: Format pesan JSON terstruktur lintas agent yang didefinisikan di spec induk.

---

## Requirements

### Requirement 1: Inisialisasi dan Perencanaan Proyek

**User Story:** Sebagai Owner, saya ingin Project_Manager_Agent dapat mengubah proyek yang baru dimenangkan menjadi rencana kerja yang jelas, sehingga seluruh agent punya arah eksekusi yang sama.

#### Acceptance Criteria

1. WHEN proyek baru dibuat, THE Project_Manager_Agent SHALL menghasilkan Project_Timeline awal yang memuat milestone, owner per milestone, deadline, dan dependency utama.
2. THE Project_Manager_Agent SHALL menyelaraskan timeline dengan informasi dari Sales_Agent, Product_Agent, dan Engineering_Agent.
3. IF deadline yang diminta tidak realistis, THEN THE Project_Manager_Agent SHALL menandai risiko jadwal dan mengusulkan opsi penyesuaian.
4. THE Project_Manager_Agent SHALL menyimpan baseline timeline versi pertama untuk keperluan perbandingan perubahan.
5. THE Project_Manager_Agent SHALL menandai milestone yang membutuhkan approval Owner.
6. THE Project_Manager_Agent SHALL memulai timeline sejak `Lifecycle_State: won` dan melacak transisi `discovery`, `implementation`, `qa`, `delivered`, dan `support`.

### Requirement 2: Tracking Progress dan Blocker

**User Story:** Sebagai Owner, saya ingin Project_Manager_Agent memantau progres proyek secara aktif, sehingga keterlambatan dan hambatan bisa cepat terlihat.

#### Acceptance Criteria

1. THE Project_Manager_Agent SHALL memperbarui status milestone berdasarkan laporan dari agent terkait.
2. WHEN suatu task atau milestone terlambat melewati deadline, THE Project_Manager_Agent SHALL menandainya sebagai `at_risk` dan mengirim notifikasi ke Owner atau CEO Agent.
3. THE Project_Manager_Agent SHALL mencatat Blocker lengkap dengan penyebab, agent terdampak, dan rekomendasi tindakan.
4. IF Blocker belum terselesaikan melewati ambang waktu yang dikonfigurasi, THEN THE Project_Manager_Agent SHALL melakukan eskalasi.
5. THE Project_Manager_Agent SHALL menyediakan ringkasan progress persentase untuk setiap proyek aktif.

### Requirement 3: Koordinasi Lintas Agent

**User Story:** Sebagai CEO_Agent, saya ingin Project_Manager_Agent membantu mengoordinasikan dependensi antar agent, sehingga handoff dan eksekusi tidak tersendat.

#### Acceptance Criteria

1. WHEN satu milestone bergantung pada output agent lain, THE Project_Manager_Agent SHALL memverifikasi bahwa artefak prasyarat telah tersedia sebelum milestone berikutnya dimulai.
2. THE Project_Manager_Agent SHALL dapat mengirim reminder atau permintaan update ke agent yang belum memperbarui status.
3. THE Project_Manager_Agent SHALL menggunakan format `Agent_Message` dalam komunikasi antagent.
4. WHEN Sales_Agent melakukan `lead_handoff` ke Product_Agent, THE Project_Manager_Agent SHALL mencatat timestamp handoff dan pembentukan proyek.
5. WHEN Product_Agent menyerahkan `discovery_handoff` ke Engineering_Agent, THE Project_Manager_Agent SHALL mencatat timestamp handoff dan memantau acknowledgment.
6. THE Project_Manager_Agent SHALL menyimpan log komunikasi yang relevan terhadap progres proyek.

### Requirement 4: Pelaporan Status ke Owner

**User Story:** Sebagai Owner, saya ingin menerima status proyek yang ringkas namun jelas, sehingga saya bisa mengambil keputusan tanpa harus mengecek semua detail manual.

#### Acceptance Criteria

1. THE Project_Manager_Agent SHALL menyediakan `status <project_id>` yang mengembalikan fase proyek, milestone aktif, blocker, risiko, dan estimasi next step.
2. THE Project_Manager_Agent SHALL menghasilkan Status_Report periodik untuk proyek aktif dengan format yang konsisten.
3. WHEN proyek membutuhkan keputusan Owner, THE Project_Manager_Agent SHALL menandai status dengan `[ACTION REQUIRED]`.
4. THE Project_Manager_Agent SHALL mendukung `history <project_id>` untuk menampilkan timeline kejadian penting proyek.
5. THE Project_Manager_Agent SHALL menyimpan semua laporan status ke penyimpanan persisten.

### Requirement 5: Tooling dan Integrasi Arsitektur

**User Story:** Sebagai developer, saya ingin Project_Manager_Agent mengikuti arsitektur agent yang sama, sehingga koordinasi proyek bisa diintegrasikan ke ekosistem AI Company.

#### Acceptance Criteria

1. THE Project_Manager_Agent SHALL didefinisikan sebagai `AgentDefinition` valid dengan `agentType: "project_manager"`.
2. THE Project_Manager_Agent SHALL memiliki tool minimal: `timeline_plan`, `status_update`, `blocker_log`, `message_send`, dan `report_generate`.
3. THE Project_Manager_Agent SHALL mengimplementasikan tool melalui pola `buildTool`.
4. WHEN pekerjaan tracking berjalan asinkron, THE Project_Manager_Agent SHALL memodelkannya sebagai `Task` yang statusnya dapat diinspeksi.
5. THE Project_Manager_Agent SHALL dapat memulihkan state proyek aktif setelah restart sistem.
