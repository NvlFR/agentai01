# Task 1.1: Audit Endpoint Mutasi - Risk Level Classification

**Tanggal:** 2025-01-18  
**Task:** Phase 0: Security Boundary Hardening - Task 1.1  
**Status:** ✅ Completed

---

## Executive Summary

Audit terhadap `src/runtime-app/server.ts` mengidentifikasi **13 endpoint mutasi** yang saat ini **tidak memiliki auth boundary yang konsisten**. Semua endpoint mutasi ini dapat diakses tanpa verifikasi token operator, yang merupakan **critical security gap** untuk production runtime.

---

## Endpoint Mutasi - Risk Classification

### 🔴 CRITICAL RISK (Immediate Action Required)

#### 1. `POST /api/directives`
- **Fungsi:** Submit directive ke runtime (natural atau structured mode)
- **Current State:** ❌ No auth
- **Risk:** Attacker dapat mengirim directive arbitrary dan mengontrol runtime behavior
- **Impact:** Full runtime compromise, unauthorized workflow execution
- **Side Effects:** Runtime state mutation, job creation, agent orchestration
- **Required Auth:** `operator` atau `owner`

#### 2. `POST /api/telegram/webhook`
- **Fungsi:** Menerima webhook dari Telegram dan auto-submit directive
- **Current State:** ❌ No signature verification, no auth
- **Risk:** Webhook spoofing, replay attacks, unauthorized directive injection
- **Impact:** Attacker dapat mengirim directive palsu via webhook
- **Side Effects:** Auto-submit directive dengan `confirm: true`
- **Required Auth:** Webhook signature verification + replay protection

#### 3. `POST /api/whatsapp/webhook`
- **Fungsi:** Menerima webhook dari WhatsApp dan auto-submit directive
- **Current State:** ❌ No signature verification, no auth
- **Risk:** Webhook spoofing, replay attacks, unauthorized directive injection
- **Impact:** Attacker dapat mengirim directive palsu via webhook
- **Side Effects:** Auto-submit directive dengan `confirm: true`
- **Required Auth:** Webhook signature verification + replay protection

#### 4. `POST /api/approvals/:requestId/respond`
- **Fungsi:** Respond to approval request (approve/reject/revise)
- **Current State:** ❌ No auth
- **Risk:** Unauthorized approval manipulation, workflow bypass
- **Impact:** Attacker dapat approve/reject approval tanpa authorization
- **Side Effects:** Approval state mutation, workflow continuation/blocking
- **Required Auth:** `owner` atau `approver` role

---

### 🟠 HIGH RISK (High Priority)

#### 5. `POST /api/jobs/:jobId/retry`
- **Fungsi:** Retry failed job
- **Current State:** ❌ No auth
- **Risk:** Unauthorized job retry, resource exhaustion
- **Impact:** Attacker dapat trigger job retry massal
- **Side Effects:** Job queue mutation, worker resource consumption
- **Required Auth:** `operator` atau `owner`

#### 6. `POST /api/messages/:logId/retry`
- **Fungsi:** Retry failed message delivery
- **Current State:** ❌ No auth
- **Risk:** Unauthorized message retry, spam potential
- **Impact:** Attacker dapat trigger message retry ke channel eksternal
- **Side Effects:** Message queue mutation, channel delivery attempts
- **Required Auth:** `operator` atau `owner`

#### 7. `POST /api/telegram/send`
- **Fungsi:** Send message via Telegram (currently simulation)
- **Current State:** ❌ No auth
- **Risk:** Unauthorized message broadcast, spam, phishing
- **Impact:** Attacker dapat mengirim message arbitrary ke Telegram channels
- **Side Effects:** Operator action log, future: real Telegram delivery
- **Required Auth:** `operator` atau `owner`

#### 8. `POST /api/whatsapp/send`
- **Fungsi:** Send message via WhatsApp (currently simulation)
- **Current State:** ❌ No auth
- **Risk:** Unauthorized message broadcast, spam, phishing
- **Impact:** Attacker dapat mengirim message arbitrary ke WhatsApp channels
- **Side Effects:** Operator action log, future: real WhatsApp delivery
- **Required Auth:** `operator` atau `owner`

---

### 🟡 MEDIUM RISK (Should Be Protected)

#### 9. `POST /api/agents/wizard/save`
- **Fungsi:** Save agent draft to filesystem
- **Current State:** ❌ No auth
- **Risk:** Unauthorized agent creation, malicious agent injection
- **Impact:** Attacker dapat menyimpan agent draft arbitrary
- **Side Effects:** Filesystem write, agent artifact creation
- **Required Auth:** `operator` atau `owner`

#### 10. `POST /api/agents/wizard/generate`
- **Fungsi:** Generate agent fields via AI provider
- **Current State:** ❌ No auth
- **Risk:** AI provider quota exhaustion, cost abuse
- **Impact:** Attacker dapat trigger AI generation tanpa limit
- **Side Effects:** AI provider API calls, quota consumption
- **Required Auth:** `operator` atau `owner`

#### 11. `POST /api/agents/wizard/validate`
- **Fungsi:** Validate agent draft structure
- **Current State:** ❌ No auth
- **Risk:** Low (read-only validation), but should be protected
- **Impact:** Information disclosure tentang validation rules
- **Side Effects:** None (validation only)
- **Required Auth:** `operator` atau `owner`

#### 12. `POST /api/chat`
- **Fungsi:** Operator chat dengan AI provider
- **Current State:** ❌ No auth
- **Risk:** AI provider quota exhaustion, information disclosure
- **Impact:** Attacker dapat chat dengan AI dan exhaust quota
- **Side Effects:** AI provider API calls, quota consumption
- **Required Auth:** `operator` atau `owner`

---

### 🟢 LOW RISK (Read-Only, But Should Be Protected)

#### 13. `GET /api/agents/drafts`
- **Fungsi:** List saved agent drafts
- **Current State:** ❌ No auth
- **Risk:** Information disclosure tentang agent structure
- **Impact:** Attacker dapat melihat agent drafts yang tersimpan
- **Side Effects:** None (read-only)
- **Required Auth:** `observer`, `operator`, atau `owner`

---

## Read-Only Endpoints (Currently No Auth)

Endpoint berikut adalah read-only tetapi **tetap harus dilindungi** untuk mencegah information disclosure:

- `GET /health` - Runtime health snapshot
- `GET /ready` - Readiness check
- `GET /api/snapshot` - Full runtime snapshot
- `GET /api/dashboard` - Dashboard data
- `GET /api/projects` - Project list
- `GET /api/projects/:projectId` - Project detail
- `GET /api/approvals` - Approval list
- `GET /api/runtime/jobs` - Job list
- `GET /api/messages` - Message log
- `GET /api/audit` - Audit log
- `GET /api/extensions` - Extension list
- `GET /api/skills` - Skill registry
- `GET /api/agents/wizard/schema` - Agent wizard schema
- `GET /api/telegram/status` - Telegram status
- `GET /api/whatsapp/status` - WhatsApp status

**Recommendation:** Protect dengan `observer` role minimum untuk production.

---

## Current Auth Implementation

### OperatorApiServer Reference

Saat ini ada referensi `OperatorApiServer` yang kemungkinan sudah memiliki auth boundary. Perlu diperiksa:

```bash
src/runtime-app/auth/
```

---

## Immediate Action Items

### Priority 1: Critical Risk Mitigation

1. **Implement auth middleware** yang memeriksa `OPERATOR_TOKEN` dari header
2. **Protect directive endpoint** dengan auth wajib
3. **Implement webhook signature verification** untuk Telegram dan WhatsApp
4. **Protect approval response endpoint** dengan role-based auth
5. **Add replay protection** untuk webhook dengan timestamp + event ID

### Priority 2: High Risk Mitigation

6. **Protect job retry endpoint** dengan auth
7. **Protect message retry endpoint** dengan auth
8. **Protect channel send endpoints** dengan auth
9. **Add rate limiting** untuk semua mutation endpoints

### Priority 3: Medium Risk Mitigation

10. **Protect agent wizard endpoints** dengan auth
11. **Protect chat endpoint** dengan auth
12. **Add audit logging** untuk semua mutation actions

### Priority 4: Read-Only Protection

13. **Protect read-only endpoints** dengan `observer` role minimum
14. **Implement role-based access control** (observer, operator, owner)

---

## Recommended Auth Flow

```typescript
// Middleware pattern
async function requireAuth(req: Request, requiredRole: 'observer' | 'operator' | 'owner'): Promise<AuthResult> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return { authorized: false, error: 'Missing authorization token' }
  }
  
  // Verify token dan extract role
  const auth = await verifyOperatorToken(token)
  
  if (!auth.valid) {
    return { authorized: false, error: 'Invalid token' }
  }
  
  if (!hasRole(auth.role, requiredRole)) {
    return { authorized: false, error: 'Insufficient permissions' }
  }
  
  return { authorized: true, actor: auth.actor, role: auth.role }
}
```

---

## Next Steps

1. ✅ **Task 1.1 Complete:** Audit selesai, risk classification done
2. ⏭️ **Task 1.2:** Implement auth boundary yang setara dengan `OperatorApiServer`
3. ⏭️ **Task 1.3:** Hapus fallback `dev-owner-token`
4. ⏭️ **Task 1.4:** Implement role system (observer, operator, owner)
5. ⏭️ **Task 1.5:** Apply auth ke semua mutation endpoints
6. ⏭️ **Task 1.6:** Implement webhook verification
7. ⏭️ **Task 1.7:** Add immutable audit trail
8. ⏭️ **Task 1.8:** Add rate limiting
9. ⏭️ **Task 1.9:** Mark demo vs live surface

---

## Conclusion

**Critical Finding:** Runtime saat ini **completely unprotected** untuk mutation operations. Semua 13 endpoint mutasi dapat diakses tanpa auth, yang merupakan **blocker untuk production deployment**.

**Immediate Risk:** Attacker dengan network access ke runtime server dapat:
- Submit arbitrary directives
- Manipulate approvals
- Trigger job/message retries
- Send messages via channels
- Exhaust AI provider quota
- Create malicious agents

**Recommendation:** **DO NOT deploy to production** sebelum Task 1.2-1.9 selesai.

---

**Audit By:** Kiro AI Agent  
**Reviewed:** Production Readiness Spec  
**Next Task:** 1.2 - Implement Auth Boundary
