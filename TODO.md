# TODO Adaptasi dari Referensi OpenClaw

Dokumen ini berisi daftar upgrade dari `referensi/openclaw` ke project kita. Karena project ini masih tahap early, prioritas dibagi menjadi `high`, `medium`, dan `low` supaya pengerjaan lebih realistis.

## Prinsip Prioritas

### High

Dikerjakan lebih dulu karena langsung memengaruhi fondasi runtime, keamanan dasar, kualitas development workflow, atau struktur inti project.

### Medium

Penting untuk tahap berikutnya, tetapi bisa dikerjakan setelah fondasi inti sudah stabil.

### Low

Berguna, tetapi belum mendesak untuk fase sekarang. Cocok dikerjakan setelah runtime, struktur core, dan workflow utama sudah matang.

## Prioritas Folder yang Perlu Diterapkan

### High Priority

1. Terapkan folder `src/` ke project kita dan sesuaikan. Lihat juga bagian yang relevan dengan project ini.
2. Terapkan semua folder `scripts/` ke project kita dan sesuaikan.
3. Terapkan folder `security/` ke project kita dan sesuaikan.
4. Terapkan folder `test/` ke project kita dan sesuaikan.
5. Terapkan folder `packages/` ke project kita dan sesuaikan.
6. Terapkan folder `ui/` ke project kita karna ui kita masih early jadi kita bakal pake konsep ui dari openclaw dan sesuaikan.
7. Terapkan folder `docs/` ke project kita dan sesuaikan.

Alasan:

- `src/` adalah inti arsitektur dan runtime
- `scripts/` menentukan kualitas workflow build, check, release, dan automation
- `security/` penting sejak awal agar boundary repo tidak liar
- `test/` dibutuhkan untuk menjaga refactor tetap aman
- `packages/` membantu memisahkan surface internal/public sejak dini
- `ui/` penting karena project ini memang punya operator shell/dashboard
- `docs/` penting agar struktur yang sedang tumbuh tidak cepat membingungkan

### Medium Priority

1. Terapkan folder `qa/` ke project kita dan sesuaikan.
2. Terapkan folder `git-hooks/` ke project kita dan sesuaikan.
3. Terapkan folder `patches/` ke project kita dan sesuaikan.
4. Terapkan folder `.agents/` ke project kita dan sesuaikan.
5. Terapkan folder `changelog/` ke project kita dan sesuaikan.
6. Terapkan folder `apps/swabble/` ke project kita dan sesuaikan.

Alasan:

- `qa/` penting, tetapi biasanya efektif setelah test dan runtime utama cukup stabil
- `git-hooks/` bagus untuk disiplin repo, tetapi bukan blocker utama
- `patches/` dibutuhkan kalau dependency mulai kompleks atau butuh override
- `.agents/` berguna untuk workflow AI-assisted development, tapi bukan fondasi runtime
- `changelog/` penting saat ritme release mulai rutin
- `apps/swabble/` menarik untuk voice interface, tetapi belum sepenting runtime inti project

### Low Priority

1. Terapkan folder `skills/` ke project kita dan sesuaikan.

Alasan:

- skill ecosystem berguna, tetapi untuk fase early project ini belum sepenting runtime platform, observability, test, dan security
- kalau terlalu cepat mengadopsi banyak skill, repo bisa cepat melebar sebelum core-nya stabil

## Prioritas Extensions yang Perlu Diterapkan

### High Priority

#### LLM Providers

1. `openai`
2. `anthropic`
3. `google`

#### OpenAI-Compatible / Gateway Providers

1. `openrouter`
2. `codex`

#### Channel Plugins

1. `telegram`

#### Memory Plugins

1. `memory-core`

#### Tool Plugins

1. `browser`
2. `file-transfer`
3. `webhooks`

#### Infrastructure & Runtime

1. `acpx`
2. `media-understanding-core`

Alasan:

- provider inti dibutuhkan supaya runtime benar-benar bisa dipakai
- `telegram` paling cepat jadi antarmuka operasional nyata
- `memory-core` adalah fondasi sebelum memory yang lebih canggih
- `browser`, `file-transfer`, dan `webhooks` sangat relevan untuk agent yang benar-benar bekerja
- `acpx` dan runtime core lebih penting daripada extension tambahan yang sifatnya kosmetik

### Medium Priority

#### LLM Providers

1. `anthropic-vertex`
2. `groq`

#### OpenAI-Compatible / Gateway Providers

1. `gemini-cli`

#### Channel Plugins

1. `whatsapp`

#### Memory Plugins

1. `memory-lancedb`
2. `memory-wiki`
3. `active-memory`

#### Speech & Voice

1. `speech-core`
2. `deepgram`
3. `tts-local-cli`

#### Image & Video Generation

1. `image-generation-core`
2. `video-generation-core`

#### Search & Web Tools

1. `brave`
2. `duckduckgo`
3. `exa`
4. `tavily`
5. `web-readability`

#### Tool Plugins

1. `canvas`
2. `document-extract`
3. `diffs`
4. `oc-path`
5. `llm-task`
6. `lobster`

#### Diagnostics & Observability

1. `diagnostics-otel`
2. `diagnostics-prometheus`

#### Infrastructure & Runtime

1. `bonjour`
2. `device-pair`
3. `tokenjuice`
4. `voyage`
5. `synthetic`

#### QA & Testing

1. `qa-channel`
2. `test-support`

#### Skills & Coding Agents

1. `thread-ownership`

Alasan:

- extension ini penting untuk peningkatan kemampuan platform
- mereka lebih cocok masuk setelah provider inti, runtime dasar, dan tools penting sudah jalan
- observability dan enhanced memory sangat bernilai, tapi akan lebih efektif setelah fondasi stabil

### Low Priority

#### Speech & Voice

1. `elevenlabs`
2. `azure-speech`
3. `microsoft`

#### Image & Video Generation

1. `fal`
2. `runway`
3. `comfy`
4. `vydra`

#### Search & Web Tools

1. `perplexity`
2. `firecrawl`
3. `searxng`

#### Tool Plugins

1. `openshell`
2. `phone-control`

#### QA & Testing

1. `qa-lab`
2. `qa-matrix`

#### Skills & Coding Agents

1. `skill-workshop`
2. `open-prose`

Alasan:

- banyak item di level ini lebih bersifat advanced capability, enrichment, atau ekspansi ekosistem
- beberapa juga membawa kompleksitas operasional, biaya, atau security surface yang lebih besar
- lebih aman dikerjakan setelah core platform benar-benar mapan

## Urutan Eksekusi yang Disarankan

Kalau mau dikerjakan bertahap, urutannya paling masuk akal untuk project ini:

1. `src/`, `scripts/`, `security/`, `test`
2. `packages/`, `ui`, `docs`
3. provider inti dan tool inti
4. `qa`, `git-hooks`, `patches`, `.agents`, `changelog`
5. memory lanjutan, observability, channel tambahan
6. `apps/swabble`, skills, dan advanced extensions lain

## Catatan

Prioritas ini dibuat berdasarkan kondisi repo sekarang:

- project masih early-stage
- runtime app sudah mulai terbentuk
- operator UI sudah ada
- struktur agent dan domain sudah lumayan jelas
- kebutuhan terbesar saat ini adalah penguatan fondasi, bukan ekspansi fitur sebanyak mungkin
