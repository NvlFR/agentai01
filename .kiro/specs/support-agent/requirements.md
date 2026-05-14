# Requirements Document

## Introduction

Dokumen ini mendefinisikan requirements untuk **Support Agent** dalam AI Company. Support Agent menangani fase pasca-delivery: menerima pertanyaan klien, membantu troubleshooting, mencatat issue, dan memastikan klien tetap mendapatkan pengalaman yang baik setelah solusi AI agent dikirim.

Support Agent harus terhubung dengan konteks delivery dari Engineering Agent dan konteks proyek dari Project Manager Agent agar dapat memberikan bantuan yang akurat.

Spec ini harus kompatibel dengan spec induk [ai-company-agents](/home/rny/work/2026/05-mei/agentai01/.kiro/specs/ai-company-agents/requirements.md), terutama untuk fase `support`, pola eskalasi, dan format `Agent_Message`.

---

## Glossary

- **Support_Agent**: AI agent yang mengelola dukungan klien pasca-delivery.
- **Support_Ticket**: Permintaan bantuan atau laporan masalah dari klien.
- **Incident**: Masalah yang memengaruhi penggunaan solusi klien secara nyata.
- **Resolution_Note**: Catatan langkah penyelesaian suatu tiket.
- **Escalation**: Penerusan tiket ke agent lain atau Owner karena butuh tindakan lanjutan.
- **Lifecycle_State**: State global proyek yang dapat berpindah ke `support` setelah delivery.
- **Agent_Message**: Format pesan JSON terstruktur lintas agent yang didefinisikan di spec induk.

---

## Requirements

### Requirement 1: Intake dan Klasifikasi Ticket

**User Story:** Sebagai Owner, saya ingin Support_Agent menerima dan mengklasifikasikan masalah klien dengan cepat, sehingga permintaan bantuan tidak tercecer.

#### Acceptance Criteria

1. WHEN klien atau Owner membuat Support_Ticket, THE Support_Agent SHALL menyimpan data minimal: project_id, ringkasan masalah, tingkat urgensi, waktu kejadian, dan kontak pelapor.
2. THE Support_Agent SHALL mengklasifikasikan tiket minimal ke kategori `question`, `bug`, `incident`, atau `change_request`.
3. IF informasi tiket belum cukup untuk diagnosis awal, THEN THE Support_Agent SHALL mengajukan pertanyaan lanjutan yang spesifik.
4. THE Support_Agent SHALL menetapkan prioritas awal tiket berdasarkan dampak bisnis dan urgensi.
5. THE Support_Agent SHALL menjaga nomor tiket unik dan histori perubahan status tiket.
6. WHEN tiket pertama pasca-delivery dibuat, THEN Support_Agent SHALL memastikan proyek dapat ditandai atau dipetakan ke `Lifecycle_State: support`.

### Requirement 2: Troubleshooting dan Resolusi Dasar

**User Story:** Sebagai klien, saya ingin pertanyaan atau masalah umum bisa dijawab cepat, sehingga saya tidak perlu selalu menunggu engineer manusia.

#### Acceptance Criteria

1. THE Support_Agent SHALL menggunakan dokumentasi proyek, FAQ, dan catatan delivery untuk memberikan jawaban awal atau langkah troubleshooting.
2. WHEN masalah termasuk known issue yang sudah terdokumentasi, THE Support_Agent SHALL memberikan resolution path yang relevan.
3. THE Support_Agent SHALL mencatat setiap langkah diagnosis dan solusi yang diberikan dalam Resolution_Note.
4. IF solusi belum memulihkan masalah, THEN THE Support_Agent SHALL meningkatkan status tiket menjadi `needs_escalation`.
5. THE Support_Agent SHALL menyimpan seluruh percakapan support sebagai bagian dari histori tiket.

### Requirement 3: Eskalasi ke Agent Lain

**User Story:** Sebagai Engineering_Agent, saya ingin menerima eskalasi support yang lengkap, sehingga saya tidak perlu mengulang pengumpulan konteks dari nol.

#### Acceptance Criteria

1. WHEN tiket membutuhkan perubahan teknis atau investigasi mendalam, THE Support_Agent SHALL mengeskalasi tiket ke Engineering_Agent atau Project_Manager_Agent sesuai konteks.
2. THE Support_Agent SHALL menyertakan ringkasan masalah, langkah reproduksi, dampak bisnis, histori percakapan, dan langkah yang sudah dicoba.
3. THE Support_Agent SHALL menggunakan format `Agent_Message` dan `message_type: "ticket_escalation"` untuk eskalasi antagent.
4. WHEN agent penerima memberikan hasil, THE Support_Agent SHALL menerjemahkan hasil tersebut menjadi update yang mudah dipahami klien.
5. THE Support_Agent SHALL menandai tiket sebagai `resolved` hanya setelah solusi atau jawaban final telah dikirim.
6. IF tiket mengungkap risiko sistemik atau isu berulang, THEN Support_Agent SHALL mengirim `risk_alert` ke CEO_Agent atau Project_Manager_Agent.

### Requirement 4: Pelaporan Kesehatan Support

**User Story:** Sebagai Owner, saya ingin melihat pola masalah klien dan kualitas support, sehingga saya bisa meningkatkan layanan dan produk.

#### Acceptance Criteria

1. THE Support_Agent SHALL menghasilkan laporan support periodik yang memuat jumlah tiket, kategori, waktu respons awal, dan waktu penyelesaian rata-rata.
2. WHEN pola issue berulang terdeteksi, THE Support_Agent SHALL merekomendasikan tindakan pencegahan seperti update dokumentasi atau perbaikan produk.
3. THE Support_Agent SHALL menandai tiket prioritas tinggi yang belum terselesaikan dengan `[ACTION REQUIRED]`.
4. THE Support_Agent SHALL menyimpan laporan support dalam penyimpanan persisten per periode.
5. THE Support_Agent SHALL dapat menampilkan histori support per proyek bila diminta Owner.

### Requirement 5: Tooling dan Integrasi Arsitektur

**User Story:** Sebagai developer, saya ingin Support_Agent dibangun dengan pola yang sama seperti agent lain, sehingga operasi support terintegrasi rapi dalam platform.

#### Acceptance Criteria

1. THE Support_Agent SHALL didefinisikan sebagai `AgentDefinition` valid dengan `agentType: "support"`.
2. THE Support_Agent SHALL memiliki tool minimal: `ticket_create`, `ticket_update`, `knowledge_read`, `message_send`, dan `report_generate`.
3. THE Support_Agent SHALL mengimplementasikan tool menggunakan pola `buildTool` dan validasi input yang sesuai.
4. WHEN tiket sedang diproses secara asinkron, THE Support_Agent SHALL merepresentasikannya sebagai `Task` yang dapat dilacak statusnya.
5. THE Support_Agent SHALL menjaga state tiket dan histori resolusi agar dapat dipulihkan setelah restart sistem.
