# Task 3.3 — Plugin SDK Queue, Approval, dan Session Route Utilities

**Tanggal:** 2026-05-17  
**Phase:** 3 — Plugin SDK Layer  
**Status:** ✅ Selesai

---

## File yang Dibuat

### `src/plugin-sdk/keyed-async-queue.ts`
Adapted from `referensi/openclaw/src/plugin-sdk/keyed-async-queue.ts`.

- `enqueueKeyedTask(params)` — serialize async work per key, different keys run concurrently
- `KeyedAsyncQueue` class — wrapper dengan `enqueue(key, task, hooks?)` dan `getTailMapForTesting()`
- Hooks: `onEnqueue`, `onSettle` dipanggil sekali per task
- Rejected task tidak menghentikan task berikutnya untuk key yang sama
- Tails map dibersihkan otomatis setelah key selesai

### `src/plugin-sdk/approval-renderers.ts`
Adapted from `referensi/openclaw/src/plugin-sdk/approval-renderers.ts`.  
Self-contained — tidak import dari OpenClaw infra.

Types yang di-export:
- `ApprovalDecision` — `'allow-once' | 'allow-always' | 'deny'`
- `InteractiveReply`, `InteractiveReplyButton`, `ReplyPayload`
- `PluginApprovalRequest`, `PluginApprovalResolved`, `PluginApprovalRequestPayload`

Functions yang di-export:
- `buildApprovalPendingReplyPayload(params)` — default decisions `['allow-once', 'allow-always', 'deny']`, approvalKind default `'exec'`
- `buildApprovalResolvedReplyPayload(params)` — tanpa interactive block
- `buildPluginApprovalPendingReplyPayload(params)` — wraps pending dengan generated text, approvalKind `'plugin'`
- `buildPluginApprovalResolvedReplyPayload(params)` — wraps resolved dengan generated text

### `src/plugin-sdk/session-route.ts`
Adapted from `referensi/openclaw/src/plugin-sdk/core.ts` (session route section).  
Menghilangkan dependency `OpenClawConfig` — menggunakan session key format yang neutral.

Types yang di-export:
- `RoutePeerKind`, `ChannelOutboundSessionRoute`
- `ThreadAwareOutboundSessionRouteThreadSource`, `ThreadAwareOutboundSessionRouteRecoveryContext`

Functions yang di-export:
- `buildChannelOutboundSessionRoute(params)` — build canonical outbound session route
- `recoverCurrentThreadSessionId(params)` — recover thread ID dari current session key jika base session match
- `buildThreadAwareOutboundSessionRoute(params)` — resolve thread candidate dari replyToId/threadId/currentSession dengan configurable precedence
- `stripChannelTargetPrefix(raw, ...providers)` — strip provider prefix case-insensitively
- `stripTargetKindPrefix(raw)` — strip `user:|group:|channel:|dm:` dll

### Test Files
- `src/plugin-sdk/keyed-async-queue.test.ts` — 8 test cases
- `src/plugin-sdk/approval-renderers.test.ts` — 14 test cases
- `src/plugin-sdk/session-route.test.ts` — 18 test cases

### `src/plugin-sdk/index.ts` (updated)
Ditambahkan re-export untuk 3 module baru:
```ts
export * from './keyed-async-queue.js'
export * from './approval-renderers.js'
export * from './session-route.js'
```

---

## Verifikasi

- **TypeScript diagnostics:** Zero errors di semua 7 file (implementation + test)
- **`npm run check`:** Perlu dijalankan manual (bash environment hang)
- **`bun test`:** Perlu dijalankan manual (bash environment hang)

---

## Catatan Adaptasi

1. `approval-renderers.ts` — reference bergantung pada `../infra/exec-approval-reply.js` dan `../infra/plugin-approvals.js` yang OpenClaw-specific. Semua logic di-inline ke satu file self-contained dengan types yang equivalent.

2. `session-route.ts` — reference `buildChannelOutboundSessionRoute` bergantung pada `OpenClawConfig` dan `buildOutboundBaseSessionKey` dari infra. Diganti dengan session key format sederhana: `{agentId}:{channel}[:{accountId}]:{peerKind}:{peerId}`. Format ini cukup untuk kebutuhan AgentAI01 dan tidak bergantung pada config structure OpenClaw.

3. `parseThreadSessionSuffix` dan `resolveThreadSessionKeys` di-inline sebagai internal helpers karena tidak perlu di-export.
