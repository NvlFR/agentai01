# Skills Ecosystem

Folder `skills/` menyimpan reusable skill definitions yang bisa ditemukan oleh `src/runtime-app/skills/SkillRegistry.ts`.

## Struktur

Setiap skill hidup di folder sendiri:

```text
skills/
  <skill-folder>/
    skill.json
    index.mjs
    index.test.ts
```

`skill.json` wajib punya field berikut:

```json
{
  "name": "echo-text",
  "version": "1.0.0",
  "description": "Echo text with deterministic formatting.",
  "deterministic": true,
  "implementation": "./index.mjs",
  "inputSchema": {
    "type": "object"
  },
  "outputSchema": {
    "type": "object"
  }
}
```

## Konvensi

- `name`: logical skill name. Boleh sama lintas folder kalau `version` berbeda.
- `version`: semver `x.y.z`. Registry resolve versi terbaru kalau caller tidak minta versi spesifik.
- `deterministic`: `true` kalau input sama wajib hasil sama. Isi `false` untuk skill yang bergantung LLM/randomness/external state.
- `implementation`: path relatif ke file implementasi. Harus tetap di dalam folder skill.
- `inputSchema` dan `outputSchema`: gunakan subset JSON Schema yang didukung registry:
  - `type`
  - `properties`
  - `required`
  - `items`
  - `enum`
  - `const`
  - `additionalProperties`
  - `minLength`, `maxLength`, `pattern`
  - `minimum`, `maximum`
  - `minItems`, `maxItems`

## Authoring Flow

1. Scaffold skill baru:

```bash
bun skills/workshop.mjs init my-skill --description "Describe the skill"
```

2. Validasi manifest dan schema:

```bash
bun skills/workshop.mjs validate skills/my-skill
```

3. Jalankan sample input tanpa runtime penuh:

```bash
bun skills/workshop.mjs run my-skill --input '{"text":"hello"}'
```

4. Jalankan test skill:

```bash
bun test skills/my-skill
```

## Workshop

`skills/workshop.mjs` adalah authoring helper ringan yang:

- membuat template skill baru
- memvalidasi `skill.json` dengan validator yang sama seperti registry
- menjalankan skill dengan sample input
- punya mode `--watch` untuk re-validasi cepat saat file berubah

Script ini bisa dijalankan via:

```bash
node skills/workshop.mjs validate skills/echo-text
bun skills/workshop.mjs run echo-text --input '{"text":"hi"}'
```
