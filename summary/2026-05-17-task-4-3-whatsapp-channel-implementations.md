# Task 4.3 — WhatsApp Channel Implementations

## Status

- [x] WhatsApp normalize target behavior tervalidasi untuk prefix `whatsapp:`, user JID, group JID, newsletter JID, allowlist entry, dan invalid input.
- [x] Socket timing defaults dan precedence override/config/default tervalidasi.
- [x] Reconnect policy defaults, clamp behavior, heartbeat default, dan backoff behavior tervalidasi.
- [x] Group session route dan legacy suffix stripping tervalidasi untuk account default dan non-default.
- [x] Inbound extract tervalidasi untuk unwrap wrapper, text/media/location/contact, context info, mention, dan content detection.
- [x] Inbound access control tervalidasi untuk self-chat/outbound DM skip, group allowlist, DM policy, pairing reply, dan pairing grace period.
- [x] Inbound dedupe dilengkapi dengan test file baru dan bug eviction `maxSize` diperbaiki agar oldest entry benar-benar dipruning setelah claim.
- [x] Checklist spec Task 4.3 diperbarui menjadi selesai.

## File yang disentuh

- `src/channels/whatsapp/inbound/dedupe.ts`
- `src/channels/whatsapp/inbound/dedupe.test.ts`
- `src/channels/whatsapp/group-session-key.test.ts`
- `.kiro/specs/plugin-sdk-adaptation/tasks.md`

## Verifikasi

- [x] `npm run check`
- [x] `bun test src/channels/whatsapp/normalize-target.test.ts src/channels/whatsapp/socket-timing.test.ts src/channels/whatsapp/reconnect.test.ts src/channels/whatsapp/group-session-key.test.ts src/channels/whatsapp/inbound/extract.test.ts src/channels/whatsapp/inbound/access-control.test.ts src/channels/whatsapp/inbound/dedupe.test.ts`
- [x] `npm run runtime:smoke`
