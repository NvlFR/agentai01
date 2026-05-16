# Task 3.5 — Plugin SDK Runtime Utilities

## Ringkasan

- Menambahkan utility runtime Plugin SDK untuk secure random, dedupe cache in-memory + persistent, lazy value cache, gateway/session helpers, secret file reader, subsystem logger, ACP binding resolver, pairing helpers, action gate, network helpers, runtime handlers, backup archive, dan resolver host Tailnet.
- Menambahkan colocated behavior tests untuk seluruh surface Task 3.5.
- Meng-update barrel `src/plugin-sdk/index.ts` dan ceklis task spec menjadi `[x]`.

## Validasi

- `npm run check`
- `bun test src/plugin-sdk/secure-random.test.ts src/plugin-sdk/lazy-value.test.ts src/plugin-sdk/gateway-utils.test.ts src/plugin-sdk/secret-file.test.ts src/plugin-sdk/subsystem-logger.test.ts src/plugin-sdk/acp-binding.test.ts src/plugin-sdk/pairing-helpers.test.ts src/plugin-sdk/action-gate.test.ts src/plugin-sdk/network-utils.test.ts src/plugin-sdk/runtime-handlers.test.ts src/plugin-sdk/backup-utils.test.ts src/plugin-sdk/tailscale.test.ts`
- `npm run runtime:smoke`
