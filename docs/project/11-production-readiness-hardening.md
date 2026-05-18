# Production Readiness Hardening

## Scope

Runtime production tidak memakai fallback auth live. `APP_ENV=production` wajib memiliki `OPERATOR_TOKEN`; token owner dan observer dapat dipisah lewat `OWNER_TOKEN` dan `OBSERVER_TOKEN`.

## Security Boundary

- Mutating HTTP routes require Bearer auth.
- Roles:
  - `observer`: read-only draft listing.
  - `operator`: directives, chat, agent wizard mutation, channel send.
  - `owner`: approval response, job retry, message retry.
- Role headers may down-scope a token, but cannot escalate an operator token into owner.
- Auth failures and sensitive mutation attempts append operator audit entries.
- Mutation routes use a local rate-limit guard.

## Webhook Verification

Telegram and WhatsApp webhooks require:

- `x-agentai-event-id`
- `x-agentai-timestamp`
- `x-agentai-signature`

The signature is HMAC-SHA256 over:

```text
<timestamp>.<raw-body>
```

Use `TELEGRAM_WEBHOOK_SECRET` and `WHATSAPP_WEBHOOK_SECRET` for provider-specific verification. Missing secrets fail closed; invalid signatures, stale timestamps, and duplicate event ids cannot submit directives.

## Channel Delivery

- `/api/telegram/send` calls the Telegram sender and returns structured delivery results.
- `/api/whatsapp/send` calls the active WhatsApp connection controller and returns structured delivery results.
- Delivery failures are surfaced as structured HTTP errors and logged through operator audit.

## Queue And Recovery

The durable queue model supports:

- `queued`
- `running`
- `completed`
- `failed`
- `retrying`
- `dead_lettered`

Permanent failure after retry budget moves to `dead_lettered` and appears in queue metrics.

## Observability

Current local telemetry hooks record:

- `runtime_http_request_latency_ms`
- `runtime_mutation_accepted_total`
- `runtime_mutation_rejected_total`
- `runtime_webhook_accepted_total`
- `runtime_webhook_rejected_total`

Audit writes stay append-only in operational logs. External dashboard, alert routing, and multi-process tracing need staging infrastructure before they can be treated as production evidence.

## Governance

Side-effect classes:

- read-only observation: allowed for `observer`, `operator`, and `owner`
- internal runtime mutation: requires `operator`
- external message delivery: requires `operator`
- approval response: requires `owner`
- job retry and message retry: requires `owner`
- destructive workspace or project administration: requires explicit confirmation

Retention baseline:

- audit and operator-action logs: append-only operational logs
- approvals and jobs: retain for release and incident review windows
- message history: retain only while operationally useful
- artifacts: retain per client/project contract

PII and masking baseline:

- never print raw tokens or API keys
- mask secret-like values in config snapshots and UI output
- do not route healthcare or banking payloads to live channels without owner-approved policy and retention rules

Compliance readiness for healthcare or banking requires a tracked checklist for data classification, retention, access review, audit export, incident response, and provider data-processing terms.

## Demo Vs Live

- `development` and `test` may use local/demo behavior.
- `staging` is release-candidate live rehearsal and rejects missing `OPERATOR_TOKEN`.
- `production` is live mode and rejects missing `OPERATOR_TOKEN`.
- Webhook mutation is live-safe by default because missing webhook secrets fail closed.

## Validation

Local validation commands:

```bash
npm run check
bun test
npm run runtime:smoke
```

Live exit gates still require environment evidence:

- real Telegram token and allowed chat id
- active WhatsApp account/session
- production Postgres URL and migration run
- staging load test report
- security review report
- soak test window with timestamps and findings
