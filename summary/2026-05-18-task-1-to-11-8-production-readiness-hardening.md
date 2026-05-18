# Task 1 To 11.8 Production Readiness Hardening

## Implemented

- Repaired `src/runtime-app/server.ts` auth refactor and kept typecheck green.
- Added role-aware runtime auth for `observer`, `operator`, and `owner`.
- Removed live fallback behavior by requiring `OPERATOR_TOKEN` in `staging` and `production`.
- Added optional `OWNER_TOKEN` and `OBSERVER_TOKEN`; role headers can down-scope but cannot escalate privileges.
- Protected directive, chat, agent wizard mutation, approval response, job retry, message retry, and channel send routes.
- Added mutation rate limiting and audit entries for rejected and accepted sensitive operations.
- Added HMAC webhook verification with timestamp replay protection and event-id dedupe for Telegram and WhatsApp.
- Changed Telegram/WhatsApp send endpoints from log-only simulation to real delivery adapter calls with structured delivery results.
- Added HTTP/request and webhook/mutation metric hooks through diagnostics.
- Added durable queue `dead_lettered` terminal status and metric coverage.
- Documented production hardening, webhook signature format, demo/live boundary, governance, retention, PII, compliance, and validation gates.

## Task Status Notes

- Completed Phase 0 security and webhook guardrails.
- Completed local durable queue behavior including dead-letter proof.
- Marked long-running/live gates as `[~]` or `[ ]` where they require real infrastructure evidence:
  - runtime state migration from seed to DB
  - live Telegram/WhatsApp credentials and session proof
  - provider fallback observability
  - CI/container/staging delivery evidence
  - load test, security review, penetration test, and multi-day soak test

## Validation

- `npm run check`
- Focused tests:
  - `src/runtime-app/auth/authMiddleware.test.ts`
  - `src/runtime-app/channels/webhookGuard.test.ts`
  - `src/runtime-app/runtimeApp.test.ts`
  - `src/runtime-app/server.agentCreation.test.ts`
  - `src/runtime-app/config/runtimeConfig.test.ts`
  - `src/runtime-app/queue/backend.test.ts`

Final gates run:

- `npm run check`
- `npm run test`
- `npm run runtime:smoke`

Note: `npm run test` exited successfully, but vendor workspace tests emitted known upstream fixture errors around `workspaces/mcp-vendors/official/modelcontextprotocol-servers/src/filesystem/dist/index.js`, `minimatch`, and `diff`. Project tests and focused production-hardening tests passed.
