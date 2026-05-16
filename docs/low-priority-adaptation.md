# Low Priority Adaptation

Dokumen ini merangkum surface low-priority adaptation yang sifatnya optional, default-off untuk area berisiko tinggi, dan aman dipakai sebagai enrichment di atas runtime utama.

## Environment Variables

### Skills dan authoring

- `SKILLS_ROOT`: override root folder skill kalau tidak memakai default `skills/`.
- `OPEN_PROSE_DEFAULT_TONE`: default tone untuk Open Prose.
- `OPEN_PROSE_DEFAULT_FORMAT`: default format untuk Open Prose.

### Premium TTS

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `ELEVENLABS_TTS_TIMEOUT_MS`
- `ELEVENLABS_TTS_RETRY_LIMIT`
- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION`
- `AZURE_SPEECH_TTS_TIMEOUT_MS`
- `AZURE_SPEECH_TTS_RETRY_LIMIT`
- `MICROSOFT_TTS_KEY`
- `MICROSOFT_TTS_TIMEOUT_MS`
- `MICROSOFT_TTS_RETRY_LIMIT`

### Image generation

- `FAL_API_KEY`
- `FAL_IMAGE_TIMEOUT_MS`
- `COMFY_BASE_URL`
- `COMFY_IMAGE_TIMEOUT_MS`

### Video generation

- `RUNWAY_API_KEY`
- `RUNWAY_VIDEO_TIMEOUT_MS`
- `VYDRA_API_KEY`
- `VYDRA_VIDEO_TIMEOUT_MS`

### Advanced search

- `PERPLEXITY_API_KEY`
- `PERPLEXITY_BASE_URL`
- `PERPLEXITY_SEARCH_TIMEOUT_MS`
- `FIRECRAWL_API_KEY`
- `FIRECRAWL_BASE_URL`
- `FIRECRAWL_MAX_DEPTH`
- `FIRECRAWL_SEARCH_TIMEOUT_MS`
- `SEARXNG_BASE_URL`
- `SEARXNG_SEARCH_TIMEOUT_MS`

### Operator tools

- `OPENSHELL_ENABLED`
- `OPENSHELL_ALLOWED_DIRS`
- `OPENSHELL_COMMAND_TIMEOUT_MS`
- `OPENSHELL_NETWORK_ALLOWLIST`
- `PHONE_CONTROL_ENABLED`
- `PHONE_CONTROL_DEVICE_ID`
- `PHONE_CONTROL_PLATFORM`

## Risk Profile

- `OpenShell` dan `Phone Control` default-off. Aktifkan hanya saat operator memang butuh automation surface tersebut.
- Secret tetap dari env atau `.env.local`; jangan taruh credential di source code atau sample config.
- Audit event wajib untuk `OpenShell`, `Phone Control`, dan QA flows yang mengeksekusi setup/teardown.

## Workflows

- Skill authoring: buat manifest `skills/<name>/skill.json`, implementasi, lalu validasi via registry atau workshop.
- QA Lab: jalankan `node qa/lab-runner.mjs <config>`.
- QA Matrix: jalankan `node qa/matrix.mjs <config> [--fail-fast]`.
- Open Prose: panggil tool dengan provider aktif runtime; tool tidak menulis ke disk kecuali caller meminta explicit persistence.
