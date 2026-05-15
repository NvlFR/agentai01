# Tasks

## Foundation Adaptation

---

## Task List

- [ ] 1. Build Structured Logging Subsystem
  - [ ] 1.1 Buat `src/logging/` dengan entry point tunggal `src/logging/index.ts`
  - [ ] 1.2 Definisikan `LogLevel`, `LogEntry`, logger factory, dan child logger dengan `correlation_id`
  - [ ] 1.3 Implementasikan environment-aware minimum log level untuk `development`, `test`, dan `production`
  - [ ] 1.4 Implementasikan secret redaction untuk message string, context object, dan nested values
  - [ ] 1.5 Migrasikan production-path `console.*` di `src/runtime-app/` ke structured logger

- [ ] 2. Strengthen Config Loading and Validation
  - [ ] 2.1 Konsolidasikan config runtime app ke `src/runtime-app/config/` sebagai single source of truth `RuntimeAppConfig`
  - [ ] 2.2 Tambahkan loader `.env.local` dengan precedence di atas `process.env`
  - [ ] 2.3 Tambahkan schema validation dengan error list terstruktur untuk field wajib dan field invalid
  - [ ] 2.4 Tambahkan serializer config yang otomatis meredaksi secret fields
  - [ ] 2.5 Tambahkan mode `test` yang menerima injected env/secrets tanpa membaca host environment

- [ ] 3. Introduce Secrets Subsystem
  - [ ] 3.1 Buat `src/secrets/` dengan typed accessor untuk `OPERATOR_TOKEN`, `AI_API_KEY`, dan `TOKEN_TELE`
  - [ ] 3.2 Definisikan result type `SecretMissing` atau ekuivalennya agar akses secret tidak melempar exception
  - [ ] 3.3 Implementasikan `redactSecret(value: string): string` untuk short secret dan long secret
  - [ ] 3.4 Pastikan secrets subsystem tidak pernah mengembalikan atau melog raw secret dalam error output
  - [ ] 3.5 Migrasikan consumer runtime app agar akses secret lewat config/secrets boundary

- [ ] 4. Add Security Utilities
  - [ ] 4.1 Buat `src/security/` untuk helper audit-safe serialization dan boundary guard
  - [ ] 4.2 Tambahkan helper validasi `OPERATOR_TOKEN` untuk mutating runtime actions
  - [ ] 4.3 Tambahkan helper validasi metadata ruleset static analysis
  - [ ] 4.4 Pastikan security utilities tidak import dari `src/agents/` atau business logic runtime app

- [ ] 5. Establish Shared Utilities
  - [ ] 5.1 Buat `src/shared/` untuk helper typed yang reusable lintas subsistem
  - [ ] 5.2 Tambahkan utility untuk object narrowing, result helpers, dan deterministic ID/correlation ID
  - [ ] 5.3 Tambahkan deep traversal helper yang aman untuk kebutuhan redaction dan serialization
  - [ ] 5.4 Pastikan shared utilities bebas dari coupling ke agent internals dan stateful globals

- [ ] 6. Add Type Declarations for External Libraries
  - [ ] 6.1 Audit dependency eksternal yang dipakai tanpa types memadai
  - [ ] 6.2 Tambahkan declaration files yang dibutuhkan di `src/types/`
  - [ ] 6.3 Verifikasi typecheck tetap strict tanpa `any` bocor atau `@ts-nocheck`

- [ ] 7. Create Master Check Script
  - [ ] 7.1 Buat `scripts/check.mjs` sebagai orchestration entry point untuk semua validation checks
  - [ ] 7.2 Tambahkan pelaporan human-readable saat satu check gagal beserta exit code non-zero
  - [ ] 7.3 Tambahkan summary sukses dan durasi saat semua check lolos
  - [ ] 7.4 Tambahkan dukungan `--only <check-name>`
  - [ ] 7.5 Tambahkan mode `CI=true` untuk output non-interaktif dan machine-readable

- [ ] 8. Implement Architecture Boundary Check
  - [ ] 8.1 Buat `scripts/check-architecture-smells.mjs` untuk menganalisis import graph di `src/`
  - [ ] 8.2 Enforce rule bahwa agent tidak boleh import internal agent lain
  - [ ] 8.3 Enforce rule bahwa `src/runtime-app/providers/` tidak boleh import internal agent
  - [ ] 8.4 Enforce rule bahwa `src/security/`, `src/shared/`, dan `src/secrets/` tidak boleh import business logic agent/runtime app
  - [ ] 8.5 Tambahkan output violation yang memuat file, import path, dan rule yang dilanggar

- [ ] 9. Implement Import Cycle Detection
  - [ ] 9.1 Buat `scripts/check-import-cycles.mjs` atau padanan Bun untuk memindai seluruh file TypeScript di `src/`
  - [ ] 9.2 Tambahkan reporting full cycle path `A -> B -> C -> A`
  - [ ] 9.3 Pastikan scanner mengabaikan `node_modules/` dan `referensi/`
  - [ ] 9.4 Verifikasi performa check tetap masuk target waktu requirement

- [ ] 10. Implement Dead Code Detection
  - [ ] 10.1 Buat `scripts/check-deadcode-unused-files.mjs` untuk unused files dan unused exports
  - [ ] 10.2 Definisikan entry point yang sah agar tidak salah ditandai sebagai dead code
  - [ ] 10.3 Tambahkan `scripts/deadcode-unused-files.allowlist.mjs` untuk pengecualian eksplisit
  - [ ] 10.4 Tambahkan reporting file path dan symbol name yang tidak terpakai

- [ ] 11. Implement Dependency Pin Validation
  - [ ] 11.1 Buat `scripts/check-dependency-pins.mjs`
  - [ ] 11.2 Scan `dependencies` dan `devDependencies` untuk version range non-exact
  - [ ] 11.3 Tambahkan dukungan scan workspace `package.json` bila workspace dikonfigurasi
  - [ ] 11.4 Tambahkan output paket dan specifier yang melanggar

- [ ] 12. Integrate Security Static Analysis Tooling
  - [ ] 12.1 Buat struktur `security/opengrep/` beserta `compile-rules.mjs`
  - [ ] 12.2 Definisikan source rules dan hasil kompilasi `security/opengrep/precise.yml`
  - [ ] 12.3 Tambahkan kategori rule minimum: hardcoded secret, raw `process.env`, raw `console.*` berisiko, dan mutating endpoint tanpa `OPERATOR_TOKEN`
  - [ ] 12.4 Buat `scripts/run-opengrep.sh` dengan dukungan `--changed` dan `--json`
  - [ ] 12.5 Integrasikan `.semgrepignore` sebagai sumber path exclusions

- [ ] 13. Build Shared Test Infrastructure
  - [ ] 13.1 Buat `test/setup.ts` untuk env `test`, deterministic IDs, dan silent logging defaults
  - [ ] 13.2 Buat `test/fixtures/` untuk sample `Agent_Message`, sample `RuntimeAppConfig`, dan lifecycle sequences
  - [ ] 13.3 Buat `test/helpers/` termasuk `createTestConfig` dan `createTestMessage`
  - [ ] 13.4 Buat `test/mocks/` untuk mock provider, mock storage, dan mock secrets
  - [ ] 13.5 Pastikan helper tanpa argumen menghasilkan object valid yang lolos domain validation

- [ ] 14. Add Architecture Boundary Tests
  - [ ] 14.1 Tambahkan `test/architecture-boundaries.test.ts`
  - [ ] 14.2 Jalankan rule boundary yang sama dengan script checker dalam `bun test`
  - [ ] 14.3 Tambahkan assertion deskriptif untuk pelanggaran agent-to-agent internal imports
  - [ ] 14.4 Tambahkan assertion deskriptif untuk pelanggaran provider-to-agent imports

- [ ] 15. Add Logging Redaction Tests
  - [ ] 15.1 Tambahkan `src/logging/redaction.test.ts`
  - [ ] 15.2 Uji pola secret `sk-`, `Bearer `, known secret keys, short secrets, long secrets, dan non-secret strings
  - [ ] 15.3 Uji idempotence `redact(redact(s)) === redact(s)`
  - [ ] 15.4 Uji nested object redaction pada payload log
  - [ ] 15.5 Pastikan output test membuktikan secret tidak muncul verbatim

- [ ] 16. Prepare Adoption and Validation Pass
  - [ ] 16.1 Audit raw `process.env` access yang masih tersisa di luar config/secrets boundary
  - [ ] 16.2 Audit `console.*` yang masih tersisa pada runtime production paths
  - [ ] 16.3 Jalankan `npm run check` setelah seluruh check script terpasang
  - [ ] 16.4 Jalankan `bun test` untuk memverifikasi test infra, boundary tests, dan redaction tests
  - [ ] 16.5 Jalankan `npm run runtime:smoke` bila perubahan menyentuh provider/auth/config startup path
