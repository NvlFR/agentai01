# Security Policy

Kalau kamu menemukan security issue di project ini, laporkan secara private dulu.

Project ini adalah AI Company Runtime Platform — local-first agent infrastructure untuk trusted operators. Ini bukan shared multi-tenant boundary antara adversarial users.

Report yang paling berguna menunjukkan boundary bypass yang reproducible dengan demonstrated impact. Scanner output saja, atau prompt-injection-only chains, biasanya bukan security vulnerability di model ini.

## Laporkan Security Issue

Laporkan vulnerability secara private via:

- **GitHub Security Advisory** (private): buka advisory baru di repo ini
- **Email**: hubungi maintainer langsung

Jangan buka public issue atau PR yang mengungkap vulnerability yang belum di-patch, exploit path, secret, atau security-sensitive proof of concept.

### Yang Kami Butuhkan

Buat report mudah di-reproduce dan mudah di-route:

- Apa yang ditemukan dan kenapa dianggap security-relevant.
- Komponen yang terpengaruh, versi, dan commit SHA kalau memungkinkan.
- Langkah reproduksi atau proof of concept terhadap `main` terbaru.
- Dampak aktual, termasuk trust boundary mana yang dilanggar.
- Saran remediasi atau focused patch kalau bisa.

Report tanpa reproduction steps, demonstrated impact, dan remediation advice akan di-deprioritize.

### Yang Biasanya Bukan Security Bug

Pattern ini biasanya bukan vulnerability:

- Prompt injection tanpa policy, auth, approval, sandbox, atau tool-boundary bypass.
- Trusted operator menggunakan intentional local feature seperti local shell access.
- Plugin berbahaya setelah trusted operator menginstall atau mengaktifkannya.
- Scanner-only atau dependency-only reports tanpa working repro dan demonstrated impact.
- Public internet exposure atau risky deployment choices yang sudah di-recommend against di docs.

Kalau tidak yakin, laporkan secara private. Lebih baik route careful report daripada miss real boundary issue.

## Security Posture

### Trust Model

Project ini **tidak** memodelkan satu runtime sebagai multi-tenant, adversarial user boundary.

- Authenticated callers diperlakukan sebagai trusted operators untuk instance runtime tersebut.
- `OPERATOR_TOKEN` mengautentikasi operator; session identifiers adalah routing controls, bukan per-user authorization boundaries.
- Kalau satu operator bisa lihat data dari operator lain di runtime yang sama, itu expected dalam trust model ini.
- Recommended mode: satu user per machine/host, satu runtime untuk user tersebut.
- Kalau multiple users butuh akses, gunakan satu VPS (atau host/OS user boundary) per user.

### Operator Trust Model

- Authenticated runtime callers diperlakukan sebagai trusted operators.
- Direct localhost/loopback sessions yang diautentikasi dengan shared operator token ada di trusted-operator bucket yang sama.
- Session identifiers adalah routing controls, bukan per-user authorization boundaries.

### Trusted Plugins / Extensions

Extensions dan plugins adalah bagian dari trusted computing base untuk runtime.

- Menginstall atau mengaktifkan plugin memberikan trust level yang sama dengan local code yang berjalan di host tersebut.
- Security reports harus menunjukkan boundary bypass (misalnya unauthenticated plugin load, allowlist/policy bypass), bukan hanya malicious behavior dari trusted-installed plugin.

### Agent dan Model Assumptions

- Model/agent **bukan** trusted principal. Asumsikan prompt/content injection bisa memanipulasi behavior.
- Security boundaries berasal dari host/config trust, auth, tool policy, dan exec approvals.
- Prompt injection sendiri bukan vulnerability report kecuali melanggar salah satu boundary tersebut.

### Out of Scope

- Public Internet Exposure
- Menggunakan project ini dengan cara yang sudah di-recommend against di docs
- Prompt-injection-only attacks (tanpa policy/auth/sandbox boundary bypass)
- Reports yang butuh write access ke trusted local state
- Exposed secrets yang merupakan third-party/user-controlled credentials tanpa demonstrated impact
- Reports yang hanya menunjukkan behavior dari trusted-installed plugin/extension

## Secrets dan Credentials

### Aturan Wajib

- **Jangan pernah commit** credentials, tokens, API keys, atau secrets ke repo.
- Simpan secrets di `.env.local` (tidak di-commit) atau environment variable langsung.
- `.env` hanya boleh berisi defaults non-secret.
- `OPERATOR_TOKEN` dan `AI_API_KEY` harus selalu dari environment, tidak pernah hardcoded.

### Environment Variables Sensitif

| Variable | Keterangan |
|----------|------------|
| `OPERATOR_TOKEN` | Token owner/operator untuk aksi mutasi — jangan expose ke client |
| `AI_API_KEY` | API key provider AI — UI harus mask nilai ini |
| `TOKEN_TELE` | Telegram bot token — jangan log atau print |
| `ID_CHAT` | Allowed Telegram chat IDs |

### Penanganan di UI

- UI harus mask `AI_API_KEY`; jangan tampilkan raw secret ke operator.
- Jangan log secrets ke console atau file log.
- Jangan include secrets di error messages yang dikirim ke client.

## Web Interface Safety

Runtime app web interface dimaksudkan untuk **local use only**.

- Recommended: keep runtime **loopback-only** (`127.0.0.1`).
- Default `APP_HOST=127.0.0.1` sudah aman untuk local development.
- **Jangan expose** ke public internet (jangan bind ke `0.0.0.0` tanpa firewall, jangan pakai public reverse proxy tanpa auth).
- Kalau butuh remote access, prefer SSH tunnel atau Tailscale.
- `OPERATOR_TOKEN` development harus diganti kalau app dibuka di jaringan bersama.

## Runtime Requirements

### Bun Version

Project ini membutuhkan **Bun 1.3.x atau lebih baru**.

Verifikasi versi Bun:

```bash
bun --version  # Should be 1.3.x or later
```

### Node.js Version

Untuk toolchain compatibility, butuh **Node.js 20 atau lebih baru**.

```bash
node --version  # Should be v20.x or later
```

## Security Scanning

### Secret Detection

Jalankan secret scan secara lokal sebelum commit:

```bash
# Cek apakah ada secrets yang tidak sengaja masuk
git diff --cached | grep -iE "(api_key|secret|token|password|credential)" 
```

Pastikan `.gitignore` sudah include:

```
.env.local
*.key
*.pem
```

### Static Analysis

Jalankan typecheck untuk mendeteksi type errors yang bisa jadi security issue:

```bash
npm run check
```

### Smoke Test

Jalankan smoke test untuk validasi end-to-end behavior:

```bash
npm run runtime:smoke
```

## Deployment Assumptions

Security guidance project ini mengasumsikan:

- Host tempat runtime berjalan ada dalam trusted OS/admin boundary.
- Siapapun yang bisa modifikasi `.env.local` atau config runtime adalah effectively trusted operator.
- Satu runtime yang di-share oleh mutually untrusted people **bukan setup yang direkomendasikan**.
- Authenticated runtime callers diperlakukan sebagai trusted operators.

## One-User Trust Model

Security model project ini adalah "personal assistant" (satu trusted operator, potentially many agents), bukan "shared multi-tenant bus."

- Kalau multiple people bisa message agent yang sama, mereka semua bisa steer agent tersebut dalam granted permissions-nya.
- Session atau memory scoping mengurangi context bleed, tapi **tidak** membuat per-user host authorization boundaries.
- Untuk mixed-trust atau adversarial users, isolate by OS user/host dan gunakan separate credentials per boundary.
