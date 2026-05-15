# OpenClaw Extensions — List & Penjelasan

> Referensi: `referensi/openclaw/extensions/`
> Total: ~121 extension

---

## 🤖 LLM Providers (Model AI)

Extension yang nyambungin OpenClaw ke berbagai provider model AI.

| Extension | Deskripsi |
|---|---|
| `openai` | OpenAI (GPT-4, GPT-4o, dll) |
| `anthropic` | Anthropic (Claude) |
| `anthropic-vertex` | Anthropic via Google Vertex AI |
| `google` | Google (Gemini) |
| `groq` | Groq — inferensi cepat (Llama, Mixtral, dll) |
| `mistral` | Mistral AI |
| `deepseek` | DeepSeek |
| `qwen` | Qwen Cloud (Alibaba) |
| `alibaba` | Alibaba Model Studio (video provider) |
| `moonshot` | Moonshot AI (Kimi) |
| `kimi-coding` | Kimi provider khusus coding |
| `minimax` | MiniMax + OAuth |
| `nvidia` | NVIDIA provider |
| `xai` | xAI (Grok) |
| `fireworks` | Fireworks AI |
| `together` | Together AI |
| `deepinfra` | DeepInfra |
| `cerebras` | Cerebras |
| `chutes` | Chutes.ai |
| `arcee` | Arcee AI |
| `byteplus` | BytePlus (ByteDance) |
| `volcengine` | Volcengine (ByteDance cloud) |
| `tencent` | Tencent Cloud (TokenHub + Token Plan) |
| `qianfan` | Qianfan (Baidu) |
| `stepfun` | StepFun |
| `xiaomi` | Xiaomi provider |
| `zai` | Z.AI |
| `venice` | Venice AI |
| `huggingface` | Hugging Face |
| `kilocode` | Kilo Gateway |
| `inworld` | Inworld (AI characters/voice) |
| `gradium` | Gradium speech |
| `senseaudio` | SenseAudio (media understanding) |

---

## 🔌 OpenAI-Compatible / Gateway Providers

Provider yang kompatibel dengan OpenAI API format, atau bertindak sebagai proxy/gateway.

| Extension | Deskripsi |
|---|---|
| `openrouter` | OpenRouter — akses ratusan model via satu API |
| `litellm` | LiteLLM — proxy ke banyak provider |
| `lmstudio` | LM Studio — jalankan model lokal via GUI |
| `ollama` | Ollama — model lokal (Llama, Mistral, dll) |
| `vllm` | vLLM — high-throughput inference server |
| `sglang` | SGLang — structured generation server |
| `cloudflare-ai-gateway` | Cloudflare AI Gateway |
| `vercel-ai-gateway` | Vercel AI Gateway |
| `amazon-bedrock` | Amazon Bedrock |
| `amazon-bedrock-mantle` | Amazon Bedrock via OpenAI-compatible endpoint |
| `microsoft-foundry` | Microsoft Azure AI Foundry |
| `copilot-proxy` | GitHub Copilot sebagai provider |
| `github-copilot` | GitHub Copilot provider |
| `opencode` | OpenCode Zen provider |
| `opencode-go` | OpenCode Go provider |
| `codex` | OpenAI Codex harness + model provider |

---

## 💬 Channel Plugins (Messaging Platforms)

Extension untuk tiap platform messaging yang didukung. Ini yang bikin OpenClaw bisa menjawab di mana saja.

| Extension | Deskripsi |
|---|---|
| `telegram` | Telegram |
| `whatsapp` | WhatsApp |
| `slack` | Slack |
| `discord` | Discord |
| `signal` | Signal |
| `imessage` | iMessage (via `imsg` di Mac yang sudah sign-in) |
| `matrix` | Matrix (protokol open source, self-hosted) |
| `msteams` | Microsoft Teams |
| `googlechat` | Google Chat |
| `feishu` | Feishu/Lark (ByteDance, populer di Asia) |
| `line` | LINE |
| `irc` | IRC |
| `nostr` | Nostr (NIP-04 encrypted DMs) |
| `twitch` | Twitch chat |
| `mattermost` | Mattermost (self-hosted Slack alternative) |
| `nextcloud-talk` | Nextcloud Talk |
| `synology-chat` | Synology Chat |
| `tlon` | Tlon/Urbit |
| `qqbot` | QQ Bot |
| `zalo` | Zalo (Vietnam) |
| `zalouser` | Zalo Personal Account via native `zca-js` |
| `clickclack` | ClickClack channel |
| `google-meet` | Google Meet (participant plugin) |

---

## 🧠 Memory Plugins

Sistem memori untuk agent — supaya bisa ingat konteks lintas sesi.

| Extension | Deskripsi |
|---|---|
| `memory-core` | Core memory search — fondasi sistem memori, wajib ada |
| `memory-lancedb` | Long-term memory berbasis LanceDB (vector DB) dengan auto-recall dan auto-capture |
| `memory-wiki` | Persistent wiki — memori berbentuk dokumen terstruktur yang bisa diedit |
| `active-memory` | Active memory — memori aktif yang selalu di-inject ke context (no package.json, in-progress) |

---

## 🔊 Speech & Voice

Extension untuk text-to-speech (TTS), speech-to-text (STT), dan voice call.

| Extension | Deskripsi |
|---|---|
| `speech-core` | Core speech runtime — fondasi untuk semua TTS/STT plugin |
| `elevenlabs` | ElevenLabs TTS — kualitas suara sangat natural |
| `azure-speech` | Azure Speech (TTS + STT) |
| `microsoft` | Microsoft speech |
| `deepgram` | Deepgram STT — speech-to-text akurat |
| `tts-local-cli` | TTS lokal via CLI (tanpa cloud) |
| `talk-voice` | Voice talk plugin (no package.json, in-progress) |
| `voice-call` | Voice call plugin — untuk panggilan suara |

---

## 🖼️ Image & Video Generation

Extension untuk generate gambar dan video dari teks.

| Extension | Deskripsi |
|---|---|
| `image-generation-core` | Core runtime untuk image generation — fondasi wajib |
| `video-generation-core` | Core runtime untuk video generation — fondasi wajib |
| `fal` | fal.ai — image/video generation (Flux, SDXL, dll) |
| `runway` | Runway — video generation berkualitas tinggi |
| `comfy` | ComfyUI — local image generation (Stable Diffusion) via workflow |
| `vydra` | Vydra media provider |

---

## 🔍 Search & Web Tools

Extension untuk search engine dan ekstraksi konten web.

| Extension | Deskripsi |
|---|---|
| `brave` | Brave Search — search engine privacy-first |
| `duckduckgo` | DuckDuckGo search |
| `perplexity` | Perplexity AI search — search dengan AI summary |
| `exa` | Exa semantic search — search berbasis embedding |
| `tavily` | Tavily AI search — dioptimalkan untuk agent |
| `searxng` | SearXNG — self-hosted meta search engine |
| `firecrawl` | Firecrawl — web scraping dan crawling terstruktur |
| `web-readability` | Local Readability — ekstrak konten bersih dari halaman web |

---

## 🛠️ Tool Plugins

Extension yang menambah kemampuan agent untuk berinteraksi dengan sistem dan tools.

| Extension | Deskripsi |
|---|---|
| `browser` | Browser tool — kontrol browser headless (Playwright/Puppeteer) |
| `canvas` | Canvas — render output visual/live dari agent di UI |
| `openshell` | OpenShell — sandbox backend untuk eksekusi shell command |
| `file-transfer` | File operations: `file_fetch`, `dir_list`, `dir_fetch`, `file_write` |
| `document-extract` | Ekstrak konten dari dokumen lokal (PDF, DOCX, dll) |
| `diffs` | Diff viewer — tampilkan perubahan kode secara visual |
| `oc-path` | `oc://` workspace path resolver — akses file via protokol khusus |
| `llm-task` | JSON-only LLM task — structured output dari LLM untuk pipeline |
| `lobster` | Lobster workflow — typed pipelines + resumable approvals |
| `webhooks` | Webhook bridge — terima dan kirim webhook ke/dari sistem eksternal |
| `phone-control` | Phone control (no package.json, in-progress) |

---

## 📊 Diagnostics & Observability

Extension untuk monitoring, tracing, dan metrics.

| Extension | Deskripsi |
|---|---|
| `diagnostics-otel` | OpenTelemetry exporter — traces, metrics, logs ke backend OTel |
| `diagnostics-prometheus` | Prometheus metrics exporter — expose `/metrics` endpoint |

---

## 🔧 Infrastructure & Runtime

Extension untuk infrastruktur internal OpenClaw.

| Extension | Deskripsi |
|---|---|
| `acpx` | ACP (Agent Communication Protocol) runtime backend |
| `bonjour` | Bonjour/mDNS — gateway discovery di local network |
| `device-pair` | Device pairing — pasangkan device (iOS/Android) ke gateway (no package.json) |
| `tokenjuice` | Token compaction — kompresi output untuk hemat context window |
| `voyage` | Voyage embedding provider — untuk vector search dan similarity |
| `media-understanding-core` | Core runtime untuk media understanding (gambar, video, audio) |
| `synthetic` | Synthetic provider — untuk testing dan simulasi tanpa API nyata |

---

## 🧪 QA & Testing

Extension untuk quality assurance dan testing internal OpenClaw.

| Extension | Deskripsi |
|---|---|
| `qa-channel` | Synthetic channel untuk QA testing — simulasi pesan masuk |
| `qa-lab` | QA lab — private debugger UI + scenario runner |
| `qa-matrix` | Matrix QA runner — jalankan test suite via Matrix |
| `test-support` | Test support utilities (no package.json) |

---

## 🎓 Skills & Coding Agents

Extension untuk skill management dan coding agent.

| Extension | Deskripsi |
|---|---|
| `skill-workshop` | Skill workshop — manage, develop, dan deploy skills |
| `open-prose` | OpenProse VM skill pack — slash command + telemetry |
| `thread-ownership` | Thread ownership management (no package.json) |

---

## 🔄 Migration Tools

Extension untuk migrasi dari platform lain ke OpenClaw.

| Extension | Deskripsi |
|---|---|
| `migrate-claude` | Migrasi config/data dari Claude ke OpenClaw |
| `migrate-hermes` | Migrasi config/data dari Hermes ke OpenClaw |

---

## Ringkasan per Kategori

| Kategori | Jumlah |
|---|---|
| LLM Providers | 33 |
| OpenAI-Compatible / Gateway | 16 |
| Channel (messaging) | 23 |
| Memory | 4 |
| Speech & Voice | 8 |
| Image / Video Generation | 6 |
| Search & Web | 8 |
| Tool Plugins | 11 |
| Diagnostics | 2 |
| Infrastructure & Runtime | 7 |
| QA & Testing | 4 |
| Skills & Coding | 3 |
| Migration | 2 |
| **Total** | **~121** |

---

> Catatan: Extension yang tidak punya `package.json` (`active-memory`, `device-pair`, `phone-control`, `talk-voice`, `test-support`, `thread-ownership`) kemungkinan masih in-progress atau merupakan internal runtime package tanpa manifest publik.
