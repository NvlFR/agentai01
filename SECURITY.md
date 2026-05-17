# SECURITY.md — Security Policy

## Prinsip Utama

AgentAI01 memperlakukan semua credentials, API keys, dan tokens sebagai secret class-1. Tidak ada pengecualian.

## Aturan Wajib

### Secrets & Credentials
- **TIDAK PERNAH** commit `AI_API_KEY`, `OPERATOR_TOKEN`, atau credential apapun ke repo
- Gunakan `.env.local` (tidak di-commit) untuk secret lokal development
- `.env` hanya boleh berisi default non-secret (base URL, model name, timeout)
- Environment variable wajib divalidasi saat startup — fail fast jika tidak ada
- UI **harus** mask `AI_API_KEY`; jangan tampilkan raw value ke operator

### Access Control
- `OPERATOR_TOKEN` wajib untuk semua endpoint `/api/*` yang mengubah state
- `/health` dan `/ready` boleh tanpa auth
- Implementasi token comparison harus constant-time untuk mencegah timing attack
- Jangan log request body yang berisi credentials

### Agent Isolation
- Sub-agen **tidak boleh** mengakses data departemen lain melalui scratchpad
- `IntraDepartmentScratchpad` hanya boleh diakses oleh Head dan specialist dalam departemen yang sama
- `SubAgentRegistry.validateIntegrity()` wajib dipanggil setelah setiap batch registration
- MCP tools yang tidak ada dalam `allowedMcpTools` tidak boleh dipanggil oleh agen apapun

### Project Isolation
- Setiap agen hanya boleh akses artifact project yang sedang aktif (`current_project_id`)
- Cross-project access harus divalidasi oleh `AgentRegistry.validateAgentProjectAccess()`
- Dashboard hanya menampilkan data agregat — tidak expose raw artifact project lain
- Semua pelanggaran isolation dicatat di audit log

### Data Handling
- Credentials klien (API key, password) tidak boleh disimpan di Notion, spec, proposal, atau source code
- Log tidak boleh berisi PII tanpa masking
- Scratchpad entries memiliki TTL default 30 menit dan bersifat ephemeral
- Tidak ada persistent storage untuk conversation history di luar provider yang ditentukan

## Env Variables

| Variable | Wajib | Default | Keterangan |
|----------|-------|---------|-----------|
| `AI_API_KEY` | ✅ | — | API key AI provider. Tanpa ini `/ready` tidak ready |
| `AI_BASE_URL` | ❌ | `http://127.0.0.1:8045/v1` | Base URL OpenAI-compatible endpoint |
| `AI_MODEL` | ❌ | `gemini-3-flash` | Model ID |
| `AI_TIMEOUT_MS` | ❌ | `30000` | Timeout request ke AI provider |
| `OPERATOR_TOKEN` | ✅ | — | Bearer token untuk operator API |
| `PORT` | ❌ | `3001` | HTTP server port |
| `NODE_ENV` | ❌ | `development` | Environment mode |

## Incident Response

1. **Credential leak** → Segera revoke key, ganti dengan yang baru, audit commit history dengan `git log -S "key_value"`
2. **Unauthorized access** → Periksa audit log `AgentRegistry`, cek token validation code
3. **Cross-project data leak** → Review `validateAgentProjectAccess()`, cek `current_project_id` assignment
4. **Sub-agent tool misuse** → Audit `allowedMcpTools` config, periksa `SubAgentRegistry` integrity

## File yang Tidak Boleh di-commit

```gitignore
.env.local
*.pem
*.key
*.p12
secrets/
.env.*.local
```

Pastikan `.gitignore` sudah mencakup semua file di atas sebelum `git add`.

## Responsible Disclosure

Laporkan security issue ke founder melalui channel private (Telegram/email). Jangan buat public GitHub issue untuk security vulnerability.