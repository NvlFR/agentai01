# Requirements Document — Sub-Agent Hierarchy Infrastructure

## Introduction

Fitur ini merancang dan mendefinisikan spesifikasi arsitektur untuk **Hierarchical Sub-Agent Infrastructure (Tree of Agents)** di dalam ekosistem `agentai01` (AI Company Runtime Platform). Saat ini, agen utama (seperti `CEO Agent`, `Marketing Agent`, `Sales Agent`, `Product Agent`, `Engineering Agent`, `Project Manager Agent`, dan `Support Agent`) beroperasi secara monolitik dan langsung memanggil AI Provider untuk seluruh cakupan tugas mereka.

Tujuan utama dari spesifikasi ini adalah memecah struktur monolitik tersebut menjadi topologi hierarkis 4 tingkat (4-tier hierarchy) yang terdiri dari: **Owner (Human Operator)** di puncak pimpinan, **CEO Agent (AI Agent Orchestrator)** sebagai pemimpin eksekutif AI, **Department Heads (AI Agents)** sebagai manajer departemen, dan **Sub-Agents (AI Specialists)** sebagai eksekutor teknis di bawah komando Department Head. Semua sub-agen harus beroperasi secara terisolasi dengan *scratchpad* memori lokal dan alat bantu (MCP tools) yang sangat terfokus sesuai dengan spesifikasi detail agen di `.kiro/specs/detail-agent/`.

Semua implementasi modul yang diusulkan nantinya harus mematuhi standar proyek: colocated `*.test.ts`, lulus typecheck TypeScript ESM strict tanpa `any`, dan terintegrasi mulus dengan `AgentRegistry` serta `OperatorEventBus`.

## Glossary

- **Hierarchical_Agent_Topology**: Struktur organisasi agen AI yang berbentuk pohon (tree) 4 tingkat: Owner (Human) $\rightarrow$ CEO Agent (AI) $\rightarrow$ Department Heads (AI) $\rightarrow$ Sub-Agents (AI).
- **Owner**: Manusia (Human Operator / Mission Control) yang bertindak sebagai pemilik perusahaan, memberikan arahan strategis tingkat tinggi, menyetujui anggaran, dan melakukan *approval* akhir.
- **CEO_Agent**: Agen AI tingkat tertinggi (`ceo_agent`) yang menerima arahan strategis dari Owner (Human), merumuskan strategi perusahaan, dan memberikan komando/target kepada para Department Head.
- **Department_Head**: Agen AI utama (contoh: `Marketing Agent`, `Sales Agent`, `Support Agent`) yang bertanggung jawab atas orkestrasi alur kerja departemen, dekomposisi tugas dari CEO Agent, dan sintesis laporan akhir departemen tanpa melakukan pekerjaan teknis langsung.
- **Sub_Agent**: Agen AI spesialis yang berada di bawah komando Department Head, memiliki *prompt persona* sempit, *tools* spesifik, dan memori terisolasi.
- **Baton_Passing**: Mekanisme pendelegasian dan serah terima tugas berantai antar sub-agen di dalam satu departemen sebelum hasilnya diserahkan kembali ke Department Head.
- **Intra_Department_Bus**: Saluran komunikasi internal atau *memory scratchpad* lokal di dalam satu departemen untuk mencegah polusi informasi pada `OperatorEventBus` utama perusahaan.
- **MCP_Tools**: Model Context Protocol tools spesifik yang di-binding ke sub-agen tertentu (misal: `web_search_mcp`, `email_outreach_mcp`, `sast_scanner_mcp`).
- **Context_Degradation**: Penurunan kualitas respons LLM akibat terlalu banyak tugas dan konteks yang dibebankan pada satu *prompt* monolitik.
- **Colocated_Test**: File pengujian `*.test.ts` yang berada di folder yang sama dengan modul yang diuji, overlay dengan `bun test`.
- **TypeScript_ESM_Strict**: Konfigurasi TypeScript dengan `strict: true`, format ESM, tanpa `any`, dan tanpa `@ts-nocheck`.

## Core Requirements

### 1. Arsitektur Sub-Agen & Registrasi
- Sistem harus mendukung pendaftaran sub-agen di dalam `AgentRegistry` atau `SubAgentRegistry` terpisah.
- Setiap entitas agen harus memiliki atribut hierarki yang jelas: `roleType: 'ceo' | 'head' | 'specialist'`, `parentAgentId: string | null`, dan `subAgentIds: string[]`.
- Manifest sub-agen harus divalidasi menggunakan skema Zod yang ketat.

### 2. Mekanisme Komunikasi Internal & Baton Passing
- Departemen harus memiliki mekanisme isolasi memori (`IntraDepartmentScratchpad`) agar komunikasi internal antar sub-agen tidak membanjiri `OperatorEventBus` tingkat perusahaan.
- Sistem harus menyediakan primitif alur kerja `delegateTask(subAgentId, payload)` dan `returnBaton(parentAgentId, result)` untuk memfasilitasi serah terima tugas otonom.

### 3. Spesialisasi Sub-Agen per Departemen (Berdasarkan Detail Agent Specs)
- **CEO Agent**: Harus memiliki sub-agen spesialis `Strategy Analyst`, `Report Summarizer`, `Decision Logger`, dan `OKR Tracker`.
- **Marketing Department**: Harus memiliki sub-agen spesialis `Content Creator`, `SEO Specialist`, `Campaign Manager`, `Analytics Reader`, `Social Scheduler`, dan `Trend Watcher`.
- **Sales Department**: Harus memiliki sub-agen spesialis `Lead Qualifier`, `Proposal Generator`, `Follow-up Drafter`, `Pipeline Tracker`, dan `Competitor Watcher`.
- **Product Department**: Harus memiliki sub-agen spesialis `User Researcher`, `Feature Prioritizer`, `PRD Writer`, `Roadmap Builder`, dan `Feedback Analyzer`.
- **Engineering Department**: Harus memiliki sub-agen spesialis `Code Reviewer`, `Bug Hunter`, `Docs Writer`, `Infra Monitor`, `Test Generator`, dan `PR Summarizer`.
- **Project Manager Department**: Harus memiliki sub-agen spesialis `Task Coordinator`, `Risk Analyzer`, `Sprint Planner`, `Progress Reporter`, dan `Deadline Watcher`.
- **Support Department**: Harus memiliki sub-agen spesialis `Ticket Classifier`, `FAQ Responder`, `Escalation Router`, `CSAT Analyzer`, `Knowledge Builder`, dan `WA Bot Handler`.

### 4. Binding MCP Tools Eksklusif & Master List
- Sub-agen hanya boleh dibekali dengan MCP tools yang relevan dengan domain spesialisasi mereka untuk menjaga efisiensi penggunaan token dan mencegah halusinasi pemanggilan alat.
- Master list alat bantu yang didukung mencakup: `anthropic_api`, `notion`, `google_sheets`, `google_drive`, `gmail`, `slack`, `google_calendar`, `github`, `web_search`, `bash_tool`, `figma_mcp`, `canva_mcp`, dan `whatsapp_api`.
