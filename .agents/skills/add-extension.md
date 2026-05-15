# Skill: Add Extension

**Kapabilitas:** Menambah extension baru ke runtime app (memory backend, tool plugin, infra extension, dll).

## Instruksi

### 1. Tentukan kategori extension

```
src/runtime-app/
  memory/         — memory backends
  speech/         — speech backends
  generation/     — image/video generation
  tools/          — search tools dan tool plugins
  diagnostics/    — observability backends
  extensions/     — infra extensions
```

### 2. Implementasikan ExtensionContract

```ts
type ExtensionContract<TInput, TOutput> = {
  id: string
  enabled(config: unknown): boolean
  validate(input: unknown): { ok: true; value: TInput } | { ok: false; message: string }
  execute(input: TInput): Promise<TOutput>
}
```

### 3. Enable/disable gating wajib

Extension harus bisa dimatikan via config tanpa ubah core runtime.
Jika tidak aktif: log info, return graceful fallback atau skip.

### 4. Error handling

- Jangan expose internal stack trace ke agent atau operator.
- Return normalized error dengan deskripsi yang actionable.
- Extension yang gagal start: log warning, runtime tetap jalan.

### 5. File path validation (untuk tool yang terima path)

Validasi bahwa path input berada dalam batas yang diizinkan.
Gunakan security helpers yang ada — jangan implementasi ulang path traversal check.

### 6. No secrets dalam output

Extension tidak boleh include secret values dalam trace attrs, metric labels, atau log output.

### 7. Typecheck dan test

```bash
npm run check
bun test
```

## Checklist

- [ ] Folder extension di kategori yang benar
- [ ] ExtensionContract diimplementasikan
- [ ] Enable/disable gating
- [ ] Error normalization (no stack trace leak)
- [ ] Path validation (jika terima file path)
- [ ] No secrets dalam output/logs
- [ ] Tests (behavior + cleanup setelah test)
- [ ] Typecheck clean
- [ ] Maintainer note di-update jika ada pola baru
