# OpenClaw Policy — Agents

Ringkasan pelajaran dari `AGENTS.md` / `CLAUDE.md` OpenClaw:

## Inti

- repo besar butuh boundary yang ketat
- plugin/extensibility harus punya seam resmi
- jangan bypass ownership dependency
- jangan tebak contract upstream
- validasi dan test harus lewat jalur resmi

## Yang Relevan ke AgentAI01

- adaptasi referensi harus lewat boundary aktif repo ini
- docs dan test perlu ikut berubah saat behavior berubah
- operator/runtime surfaces perlu contract yang jelas
