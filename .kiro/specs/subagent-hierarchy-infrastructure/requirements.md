# Requirements Document — Sub-Agent Hierarchy Infrastructure

## Introduction

Fitur ini merancang dan mendefinisikan spesifikasi arsitektur untuk **Hierarchical Sub-Agent Infrastructure (Tree of Agents)** di dalam ekosistem `agentai01` (AI Company Runtime Platform). Saat ini, agen utama (seperti `Marketing Agent`, `Sales Agent`, `Product Agent`, `Engineering Agent`, dan `Project Manager Agent`) beroperasi secara monolitik dan langsung memanggil AI Provider untuk seluruh cakupan tugas mereka.

Tujuan utama dari spesifikasi ini adalah memecah struktur monolitik tersebut menjadi topologi hierarkis di mana setiap agen utama bertindak sebagai **Manajer / Orkestrator Departemen (Department Head)** yang mendelegasikan tugas-tugas spesifik ke sub-agen spesialis di bawahnya (seperti `Lead Hunter`, `Content Analyst`, `Content Creator`, `QA Agent`, `DevSecOps Agent`, dll.). Semua sub-agen harus beroperasi secara terisolasi dengan *scratchpad* memori lokal dan alat bantu (MCP tools) yang sangat terfokus.

Semua implementasi modul yang diusulkan nantinya harus mematuhi standar proyek: colocated `*.test.ts`, lulus typecheck TypeScript ESM strict tanpa `any`, dan terintegrasi mulus dengan `AgentRegistry` serta `OperatorEventBus`.

## Glossary

- **Hierarchical_Agent_Topology**: Struktur organisasi agen AI yang berbentuk pohon (tree), di mana agen tingkat atas bertindak sebagai manajer dan agen tingkat bawah bertindak sebagai spesialis teknis.
- **Department_Head**: Agen utama (contoh: `Marketing Agent`) yang bertanggung jawab atas orkestrasi alur kerja, dekomposisi tugas dari CEO, dan sintesis laporan akhir departemen tanpa melakukan pekerjaan teknis langsung.
- **Sub_Agent**: Agen spesialis yang berada di bawah komando Department Head, memiliki *prompt persona* sempit, *tools* spesifik, dan memori terisolasi.
- **Baton_Passing**: Mekanisme pendelegasian dan serah terima tugas berantai antar sub-agen di dalam satu departemen sebelum hasilnya diserahkan kembali ke Department Head.
- **Intra_Department_Bus**: Saluran komunikasi internal atau *memory scratchpad* lokal di dalam satu departemen untuk mencegah polusi informasi pada `OperatorEventBus` utama perusahaan.
- **MCP_Tools**: Model Context Protocol tools spesifik yang di-binding ke sub-agen tertentu (misal: `web_search_mcp`, `email_outreach_mcp`, `sast_scanner_mcp`).
- **Context_Degradation**: Penurunan kualitas respons LLM akibat terlalu banyak tugas dan konteks yang dibebankan pada satu *prompt* monolitik.
- **Colocated_Test**: File pengujian `*.test.ts` yang berada di folder yang sama dengan modul yang diuji, menggunakan `bun test`.
- **TypeScript_ESM_Strict**: Konfigurasi TypeScript dengan `strict: true`, format ESM, tanpa `any`, dan tanpa `@ts-nocheck`.

## Core Requirements

### 1. Arsitektur Sub-Agen & Registrasi
- Sistem harus mendukung pendaftaran sub-agen di dalam `AgentRegistry` atau `SubAgentRegistry` terpisah.
- Setiap entitas agen harus memiliki atribut hierarki yang jelas: `roleType: 'head' | 'specialist'`, `parentAgentId: string | null`, dan `subAgentIds: string[]`.
- Manifest sub-agen harus divalidasi menggunakan skema Zod yang ketat.

### 2. Mekanisme Komunikasi Internal & Baton Passing
- Departemen harus memiliki mekanisme isolasi memori (`IntraDepartmentScratchpad`) agar komunikasi internal antar sub-agen tidak membanjiri `OperatorEventBus` tingkat perusahaan.
- Sistem harus menyediakan primitif alur kerja `delegateTask(subAgentId, payload)` dan `returnBaton(parentAgentId, result)` untuk memfasilitasi serah terima tugas otonom.

### 3. Spesialisasi Sub-Agen per Departemen
- **Marketing Department**: Harus memiliki sub-agen spesialis `Lead Hunter Agent`, `Content Analyst Agent`, `Content Creator Agent`, dan `Promotion Agent`.
- **Sales Department**: Harus memiliki sub-agen spesialis `Lead Qualification Agent`, `Proposal Architect Agent`, dan `Objection Handler Agent`.
- **Product Department**: Harus memiliki sub-agen spesialis `User Research Agent`, `PRD Scaffolder Agent`, dan `UI/UX Conceptor Agent`.
- **Engineering Department**: Harus memiliki sub-agen spesialis `Coder Agent`, `QA & Fuzzing Agent`, `DevSecOps Agent`, dan `Deployment Cloud Agent`.
- **Project Manager Department**: Harus memiliki sub-agen spesialis `Sprint Tracker Agent`, `Risk Analyst Agent`, dan `Resource Allocator Agent`.

### 4. Binding MCP Tools Eksklusif
- Sub-agen hanya boleh dibekali dengan MCP tools yang relevan dengan domain spesialisasi mereka untuk menjaga efisiensi penggunaan token dan mencegah halusinasi pemanggilan alat.
