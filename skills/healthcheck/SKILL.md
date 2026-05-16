# Healthcheck

Status: guidance-only.
Source: `referensi/openclaw/skills/healthcheck`

## Use When

- The operator asks whether the runtime app is healthy, ready, degraded, or misconfigured.
- A worker, scheduler, Telegram bot, provider, or UI issue needs read-only triage before remediation.
- You need a host posture review for the machine running the AI Company Runtime Platform.

## Requirements

- Runtime app reachable on `APP_HOST` and `APP_PORT`; defaults are `127.0.0.1` and `3000`.
- Supported HTTP surfaces: `GET /health`, `GET /ready`, and, when needed, `GET /api/snapshot`.
- Optional binaries:
  - `curl`: HTTP checks. Install with `sudo apt-get install curl` or the distro equivalent.
  - `jq`: JSON formatting/filtering. Install with `sudo apt-get install jq`.
  - `ss`: Linux socket inspection, usually from `iproute2`.
- Secrets remain in environment or `.env.local`; never print raw `AI_API_KEY`, `OPERATOR_TOKEN`, `TOKEN_TELE`, or provider credentials.

## Workflow

1. Ask once for permission to run read-only checks if the user has not already requested them.
2. Establish context: OS, shell, runtime command in use, `APP_HOST`, `APP_PORT`, local vs remote access, and whether the app should be loopback-only.
3. Check runtime endpoints:

```bash
APP_BASE_URL="${APP_BASE_URL:-http://${APP_HOST:-127.0.0.1}:${APP_PORT:-3000}}"
curl -fsS "$APP_BASE_URL/health" | jq .
curl -fsS -i "$APP_BASE_URL/ready"
```

4. If `/ready` returns non-200, inspect only the readiness reasons and config field names. Do not ask for or display secret values.
5. Check local processes and listeners when endpoint checks fail:

```bash
ss -ltnp 2>/dev/null | rg ':(3000|3310)\b' || true
ps -ef | rg 'runtime:app|runtime:worker|runtime:scheduler|runtime:telegram' | rg -v rg || true
```

6. Build a remediation plan before changing anything. Include exact commands, expected effect, rollback, and which service may be interrupted.
7. Execute state-changing actions only after explicit operator confirmation.
8. Re-run `/health` and `/ready`, then report current posture and deferred items.

## Safety

- Required confirmation: installing packages, starting/stopping services, changing firewall rules, editing `.env.local`, rotating credentials, scheduling jobs, or changing bind addresses.
- Keep `APP_HOST=127.0.0.1` unless the operator explicitly accepts the exposure risk and has authentication/firewall controls.
- Do not claim deployment, provisioning, activation, or provider readiness unless verified by endpoint output or an executed command.
- Redact inline secrets before summarizing output. Replace bearer tokens, `sk-*`, `gh*_`, `xox*`, `AIza*`, cookies, and key/value forms like `token=...` with `[REDACTED]`.
- If host access method is unknown, do not recommend firewall or SSH/RDP changes beyond a plan.

## Validation

```bash
npm run check
APP_BASE_URL="${APP_BASE_URL:-http://${APP_HOST:-127.0.0.1}:${APP_PORT:-3000}}"
curl -fsS "$APP_BASE_URL/health" | jq '.data.ok'
curl -fsS "$APP_BASE_URL/ready" | jq '.data.readiness.ready'
```

`npm run runtime:smoke` is the preferred end-to-end validation when real provider credentials are intentionally available in the environment.
