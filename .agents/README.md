# .agents/ — AI-Assisted Development Workflow

Folder ini menyediakan konteks tambahan untuk AI agent yang bekerja di repo ini.
Ia bukan source of truth formal arsitektur — itu ada di `AGENTS.md`, `CODEX.md`, dan `.kiro/specs/`.
Fungsinya: melengkapi konteks dengan catatan maintainer dan skill definitions yang repo-scoped.

**Jangan simpan secrets, credentials, atau informasi sensitif di folder ini.**

---

## Struktur

```
.agents/
  README.md                  — dokumen ini
  maintainer-notes/          — catatan per area codebase
    domain.md                — src/domain/ — types dan contracts
    runtime-app.md           — src/runtime-app/ — operator shell
    providers.md             — src/runtime-app/providers/ — LLM adapters
    registry.md              — src/registry/ — AgentRegistry
    agents.md                — src/agents/ — implementasi agent
  skills/
    typecheck.md             — cara menjalankan typecheck
    add-provider.md          — cara menambah provider adapter baru
    add-channel.md           — cara menambah channel baru
    add-extension.md         — cara menambah extension ke runtime
```

---

## Cara Pakai

1. Baca `AGENTS.md` di root repo terlebih dahulu — itu adalah policy utama.
2. Buka maintainer note yang relevan dengan area yang akan disentuh.
3. Gunakan skill definitions sebagai checklist saat mengerjakan task berulang.
4. Update maintainer note jika ada perubahan arsitektur signifikan di area tersebut.

---

## Konvensi Update

Maintainer notes di-update saat:
- Ada perubahan arsitektur signifikan (bukan refactor kecil)
- Pola baru diperkenalkan yang tidak obvious dari kode
- Gotcha atau pitfall baru ditemukan selama development

Format update: tambahkan entri di bagian "Changelog" di setiap note dengan format:
```
- YYYY-MM-DD: <ringkasan perubahan>
```
