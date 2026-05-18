# SECURITY.md

Kebijakan keamanan repo `agentai01`.

## Secret Handling

- jangan commit API key, token, credential, cookie, atau private cert
- `.env` hanya untuk default non-secret
- secret lokal taruh di `.env.local` atau env runtime
- output operator/TUI/web tidak boleh menampilkan raw secret
- `OPERATOR_TOKEN`, `OWNER_TOKEN`, `OBSERVER_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, dan `WHATSAPP_WEBHOOK_SECRET` hanya boleh berasal dari env/runtime secret source

## Access Control

- endpoint mutating harus terlindungi operator auth
- production tidak boleh memakai fallback `dev-owner-token`
- approval, retry, dan aksi high-risk harus memakai role `owner`
- role header hanya boleh down-scope token; tidak boleh menaikkan token operator menjadi owner
- approval/retry/directive flows harus eksplisit
- jangan anggap session label sebagai auth boundary

## Agent Isolation

- sub-agent hanya boleh memakai `allowedMcpTools`
- departemen tidak boleh bocor memory lintas scratchpad
- cross-project access harus lewat validasi registry

## Risky Surfaces

- shell / workspace actions
- provider API calls
- Telegram / WhatsApp outbound
- **Telegram / WhatsApp webhook endpoints** (wajib HMAC signature, timestamp replay window, dan event id dedupe sebelum mutasi)
- MCP config merge dan bootstrap
- operator TUI actions yang memicu side effects

Semua surface itu harus:
- audit-safe
- explicit
- bisa dijelaskan perilakunya

## Response

Kalau ada indikasi leak atau misuse:
1. hentikan perluasan perubahan
2. identifikasi surface dan scope
3. jangan print secret ke chat/log
4. dokumentasikan dampak dan remediation

## Docs Rule

Kalau security posture berubah, update:
- `SECURITY.md`
- `README.md` bila user-facing
- file terkait di `docs/`
