# MCP Tools & Repositories Mapping for Sub-Agents

Dokumen ini memetakan daftar repositori eksternal, pustaka otomatisasi, dan server **Model Context Protocol (MCP)** resmi/komunitas ke masing-masing sub-agen spesialis di 6 departemen utama platform `agentai01`.

Setiap sub-agen dibekali dengan alat dan pustaka yang sangat terfokus untuk memastikan eksekusi tugas otonom yang efisien dan mencegah halusinasi pemanggilan alat.

---

## 📢 1. Marketing Department

### 🕵️ Lead Hunter Agent
- **Fokus**: Pencarian prospek, ekstraksi kontak, dan pemindaian direktori bisnis.
- **Pustaka & Repositori Terkait**:
  - [eracle/OpenOutreach](https://github.com/eracle/OpenOutreach) — Otomatisasi pencarian prospek dan kampanye *cold outreach*.
  - [Bhanunamikaze/Agentic-SEO-Skill](https://github.com/Bhanunamikaze/Agentic-SEO-Skill) — Analisis celah kata kunci dan pencarian target pasar organik.
  - [modelcontextprotocol/brave-search](https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search) — Server MCP resmi untuk pencarian web berkinerja tinggi.

### 📊 Content Analyst Agent
- **Fokus**: Analisis lalu lintas web, tren SEO, dan pemantauan metrik konversi.
- **Pustaka & Repositori Terkait**:
  - [googleanalytics/google-analytics-mcp](https://github.com/googleanalytics/google-analytics-mcp) — Server MCP resmi Google Analytics untuk menarik data lalu lintas dan perilaku pengguna.
  - [Bhanunamikaze/Agentic-SEO-Skill](https://github.com/Bhanunamikaze/Agentic-SEO-Skill) — Audit SEO teknis dan analisis sentimen pasar.

### ✍️ Content Creator Agent
- **Fokus**: Penulisan skrip, *copywriting* kampanye, dan pembuatan aset visual/video.
- **Pustaka & Repositori Terkait**:
  - [Salimzaks/Youtube-content-creation-agent](https://github.com/Salimzaks/Youtube-content-creation-agent) — Agen otonom untuk riset ide, penulisan naskah, dan pembuatan konten YouTube.
  - [praj2408/Smart-Marketing-Assistant-Crew-AI](https://github.com/praj2408/Smart-Marketing-Assistant-Crew-AI) — Sistem multi-agen CrewAI untuk penyusunan strategi konten dan *copywriting*.
  - [sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) — Kumpulan *skills* dan *prompt* tingkat lanjut untuk pembuatan konten multimedia.

### 📣 Promotion & Outreach Agent
- **Fokus**: Distribusi pesan otomatis, publikasi media sosial, dan manajemen iklan.
- **Pustaka & Repositori Terkait**:
  - [facebook/facebook-python-business-sdk](https://github.com/facebook/facebook-python-business-sdk) — SDK resmi Meta untuk manajemen kampanye iklan Facebook & Instagram.
  - [InstaPy/InstaPy](https://github.com/InstaPy/InstaPy) — Pustaka otomatisasi interaksi Instagram (like, comment, follow).
  - [adar2/Facebook-Posts-Automation](https://github.com/adar2/Facebook-Posts-Automation) — Otomatisasi publikasi ke grup dan halaman Facebook.
  - [DreamingWater/TiktokAutomation](https://github.com/DreamingWater/TiktokAutomation) — Pustaka otomatisasi dan *scraping* tren TikTok.
  - [wkaisertexas/tiktok-uploader](https://github.com/wkaisertexas/tiktok-uploader) — Pengunggah video TikTok otomatis berbasis Playwright.
  - [eracle/OpenOutreach](https://github.com/eracle/OpenOutreach) — Pengiriman *cold email* berantai dan pelacakan balasan.

---

## 💼 2. Sales Department

### 🔍 Lead Qualification Agent
- **Fokus**: Verifikasi kecocokan anggaran, BANT, dan validasi entitas bisnis.
- **Pustaka & Repositori Terkait**:
  - [eracle/OpenOutreach](https://github.com/eracle/OpenOutreach) — Modul penyaringan dan kualifikasi respons prospek.
  - [modelcontextprotocol/fetch](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch) — Ekstraksi halaman web untuk memverifikasi keabsahan situs web klien.

### 📝 Proposal Architect Agent
- **Fokus**: Penyusunan penawaran komersial, kalkulasi harga, dan justifikasi ROI.
- **Pustaka & Repositori Terkait**:
  - [sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) — Templat dan kerangka kerja penulisan proposal bisnis tingkat eksekutif.
  - [modelcontextprotocol/filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) — Akses sistem berkas untuk membaca templat harga dan menulis draf PDF/Markdown.

### 🤝 Objection Handler Agent
- **Fokus**: Menjawab keraguan klien, negosiasi klausul kontrak, dan penanganan keberatan.
- **Pustaka & Repositori Terkait**:
  - [eracle/OpenOutreach](https://github.com/eracle/OpenOutreach) — Otomatisasi penanganan balasan keberatan (*objection handling*).
  - [modelcontextprotocol/memory](https://github.com/modelcontextprotocol/servers/tree/main/src/memory) — Penyimpanan memori persisten berbasis grafik pengetahuan untuk melacak riwayat negosiasi klien.

---

## 📦 3. Product Department

### 🔬 User Research Agent
- **Fokus**: Analisis *pain points*, pengumpulan masukan pengguna, dan pembentukan persona.
- **Pustaka & Repositori Terkait**:
  - [googleanalytics/google-analytics-mcp](https://github.com/googleanalytics/google-analytics-mcp) — Analisis titik jatuh (*drop-off points*) dalam alur pengguna di aplikasi.
  - [modelcontextprotocol/brave-search](https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search) — Riset kompetitor dan analisis sentimen produk pesaing.

### 📐 PRD Scaffolder Agent
- **Fokus**: Penulisan dokumen Spesifikasi Kebutuhan Produk (PRD) dan arsitektur fitur.
- **Pustaka & Repositori Terkait**:
  - [sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) — Kerangka kerja penulisan PRD standar industri (berbasis pemikiran Amazon/Apple).
  - [modelcontextprotocol/filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) — Penyusunan struktur spesifikasi teknis ke dalam repositori.

### 🎨 UI/UX Conceptor Agent
- **Fokus**: Perancangan *wireframe*, *user flow*, dan sistem token desain.
- **Pustaka & Repositori Terkait**:
  - [modelcontextprotocol/puppeteer](https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer) — Inspeksi visual halaman web dan pengambilan tangkapan layar antarmuka.
  - [sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) — Kerangka kerja desain UI/UX dan prinsip heuristik antarmuka.

---

## ⚙️ 4. Engineering Department

### 💻 Implementation / Coder Agent
- **Fokus**: Penulisan kode aplikasi, refaktoring, dan pemeliharaan logika bisnis.
- **Pustaka & Repositori Terkait**:
  - [modelcontextprotocol/filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) — Server MCP resmi untuk navigasi dan manipulasi *codebase*.
  - [modelcontextprotocol/git](https://github.com/modelcontextprotocol/servers/tree/main/src/git) — Operasi Git otonom (commit, diff, branching, status).

### 🤖 QA & Fuzzing Agent
- **Fokus**: Pengujian unit, pengujian *end-to-end* (E2E), dan *stress testing*.
- **Pustaka & Repositori Terkait**:
  - [modelcontextprotocol/puppeteer](https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer) — Otomatisasi pengujian antarmuka web dan simulasi interaksi pengguna.
  - [sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills) — Metodologi TDD (*Test-Driven Development*) dan pembuatan skrip pengujian.

### 🔒 DevSecOps Agent
- **Fokus**: Pemindaian kerentanan (SAST), audit dependensi, dan pengamanan rahasia.
- **Pustaka & Repositori Terkait**:
  - [modelcontextprotocol/github](https://github.com/modelcontextprotocol/servers/tree/main/src/github) — Pemeriksaan peringatan keamanan dependensi (Dependabot) dan peninjauan PR.

### 🚀 Deployment Cloud Agent
- **Fokus**: Orkestrasi kontainer, manajemen CI/CD, dan pembaruan basis data.
- **Pustaka & Repositori Terkait**:
  - [modelcontextprotocol/github](https://github.com/modelcontextprotocol/servers/tree/main/src/github) — Pemicuan dan pemantauan alur kerja GitHub Actions.
  - [modelcontextprotocol/postgres](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres) — Inspeksi skema basis data dan eksekusi migrasi skema.

---

## 📋 5. Project Manager Department

### ⏱️ Sprint Tracker Agent
- **Fokus**: Pemantauan *burndown chart*, tenggat waktu, dan status tiket kerja.
- **Pustaka & Repositori Terkait**:
  - [modelcontextprotocol/github](https://github.com/modelcontextprotocol/servers/tree/main/src/github) — Manajemen papan proyek (GitHub Projects) dan pelacakan isu.
  - [modelcontextprotocol/memory](https://github.com/modelcontextprotocol/servers/tree/main/src/memory) — Pencatatan memori progres *sprint* dan riwayat pencapaian.

### ⚠️ Risk & Blocker Analyst Agent
- **Fokus**: Identifikasi potensi keterlambatan dan resolusi hambatan teknis.
- **Pustaka & Repositori Terkait**:
  - [modelcontextprotocol/github](https://github.com/modelcontextprotocol/servers/tree/main/src/github) — Pemindaian isu yang terhenti (*stale issues*) atau PR yang belum ditinjau.
  - [modelcontextprotocol/slack](https://github.com/modelcontextprotocol/servers/tree/main/src/slack) — Komunikasi otomatis untuk menanyakan status hambatan kepada tim.

### 🧮 Resource Allocator Agent
- **Fokus**: Pembagian beban kerja dan penugasan sub-agen teknis.
- **Pustaka & Repositori Terkait**:
  - [modelcontextprotocol/memory](https://github.com/modelcontextprotocol/servers/tree/main/src/memory) — Analisis kapasitas dan ketersediaan sub-agen dalam sistem.

---

## 🎫 6. Support Department

### 🎫 Ticket Triage Agent
- **Fokus**: Klasifikasi tiket (bug/incident/question) dan penentuan tingkat urgensi.
- **Pustaka & Repositori Terkait**:
  - [modelcontextprotocol/github](https://github.com/modelcontextprotocol/servers/tree/main/src/github) — Pembuatan isu baru dari tiket klien masuk.
  - [modelcontextprotocol/sqlite](https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite) — Pencatatan dan pencarian status tiket lokal.

### 📖 Knowledge Base Navigator Agent
- **Fokus**: Pencarian dokumen basis pengetahuan dan pencocokan masalah yang diketahui.
- **Pustaka & Repositori Terkait**:
  - [modelcontextprotocol/memory](https://github.com/modelcontextprotocol/servers/tree/main/src/memory) — Penelusuran basis pengetahuan dan grafik resolusi masa lalu.
  - [modelcontextprotocol/filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) — Pembacaan dokumen *markdown* di direktori basis pengetahuan internal.

### 🛠️ Troubleshooting Agent
- **Fokus**: Analisis log sistem, pemantauan metrik, dan diagnostik awal.
- **Pustaka & Repositori Terkait**:
  - [modelcontextprotocol/postgres](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres) / [sqlite](https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite) — Pengecekan konsistensi data dan log transaksi sistem.
  - [googleanalytics/google-analytics-mcp](https://github.com/googleanalytics/google-analytics-mcp) — Pengecekan anomali lonjakan *error* atau penurunan lalu lintas mendadak.

### 🚀 Escalation Agent
- **Fokus**: Komunikasi pembaruan klien, draf catatan resolusi, dan eskalasi ke Eng/PM.
- **Pustaka & Repositori Terkait**:
  - [eracle/OpenOutreach](https://github.com/eracle/OpenOutreach) — Pengiriman *email broadcast* terkait status insiden kepada klien.
  - [modelcontextprotocol/slack](https://github.com/modelcontextprotocol/servers/tree/main/src/slack) — Peringatan eskalasi insiden kritis ke saluran komunikasi internal.
  - [modelcontextprotocol/github](https://github.com/modelcontextprotocol/servers/tree/main/src/github) — Pembuatan tiket eskalasi prioritas tinggi di repositori *Engineering*.
