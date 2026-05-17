# Analisis Folder-per-Folder `restored-src/`

Dokumen ini menjelaskan isi `restored-src/` secara manual per folder, bukan hasil generate script. Fokusnya adalah membantu membaca arsitektur besar codebase ini: mana yang core runtime, mana yang UI CLI, mana yang tool layer, mana yang cuma dependency/vendor, dan mana yang relevan untuk `agentai01`.

## Gambaran Besar

`restored-src/` adalah codebase CLI agent yang sangat besar. Bentuknya bukan library kecil, tapi produk penuh: ada mesin query, bridge remote session, tool runtime, TUI React/Ink, sistem command, plugin/skill system, MCP client, task runner, telemetry, storage, sampai native helper.

Secara praktis, isi `restored-src/` bisa dibaca dalam 3 lapisan besar:

1. `restored-src/src/`
   Ini source utama aplikasi.
2. `restored-src/vendor/`
   Ini source helper native/vendor yang dibundle.
3. `restored-src/node_modules/`
   Ini dependency install hasil package manager, bukan domain logic project.

## Root `restored-src/`

### `restored-src/src/`

Folder inti aplikasi. Hampir semua perilaku produk hidup di sini: runtime percakapan, tool system, command system, UI terminal, koneksi provider, MCP, plugin, task orchestration, permission system, settings, dan utilitas.

File-file top-level di `src/` adalah “titik simpul” arsitektur:

- `src/main.tsx`
  Entry point aplikasi interaktif berbasis Ink.
- `src/setup.ts`
  Bootstrap awal app sebelum REPL aktif penuh.
- `src/query.ts`
  Jalur utama request model.
- `src/QueryEngine.ts`
  Versi engine query yang lebih terstruktur untuk lifecycle percakapan.
- `src/Tool.ts`
  Kontrak tool, context eksekusi, permission, dan type inti.
- `src/Task.ts` dan `src/tasks.ts`
  Kontrak task background dan registry task type.
- `src/commands.ts`
  Registry metadata command.
- `src/tools.ts`
  Registry/preset tool.
- `src/context.ts`, `src/history.ts`, `src/cost-tracker.ts`
  State percakapan, history transform, dan tracking biaya.

### `restored-src/vendor/`

Source vendor yang ikut disimpan di repo, biasanya untuk kemampuan native atau helper platform yang tidak nyaman kalau hanya dipanggil sebagai dependency opaque.

- `vendor/audio-capture-src`
  Source penangkap audio untuk fitur voice/input suara.
- `vendor/image-processor-src`
  Source pengolah gambar yang dipakai workflow multimodal.
- `vendor/modifiers-napi-src`
  Native helper untuk keyboard modifier/input level rendah.
- `vendor/url-handler-src`
  Helper OS-level untuk membuka/menangani URL.

### `restored-src/node_modules/`

Dependency eksternal hasil install. Ini bukan bagian domain logic yang perlu dijelaskan satu per satu. Yang penting hanya dipahami sebagai fondasi package untuk React/Ink, Anthropic SDK, AWS/GCP SDK, MCP SDK, telemetry, parsing, shell integration, dan native package.

## Folder Utama di `restored-src/src/`

### `src/assistant`

Fokus pada integrasi history/assistant session dari sisi produk. Isinya kecil, tapi penting untuk mengambil dan menyusun riwayat sesi dari backend/akun.

### `src/bootstrap`

State bootstrap yang dipakai sebelum app sepenuhnya hidup. Ini jembatan antara startup, session selection, dan REPL state awal.

### `src/bridge`

Salah satu subsistem paling penting untuk mode remote-control atau bridge session. Folder ini mengurus:

- auth/token bridge
- pembuatan remote session
- polling kerja
- transport message masuk/keluar
- trusted device
- status bridge
- retry/backoff
- env-based dan env-less bridge mode

Kalau dibaca secara arsitektural, `src/bridge` adalah lapisan yang menghubungkan CLI lokal dengan server session jarak jauh.

### `src/buddy`

Fitur companion/buddy yang sifatnya presentasional dan experience-driven. Isinya sprite, prompt pendamping, rarity/type, dan notifikasi buddy. Ini bukan core engine, tapi fitur UX.

### `src/cli`

Lapisan CLI non-UI yang menangani I/O terstruktur dan integrasi mode headless/SDK.

- `cli/handlers`
  Handler subcommand CLI seperti auth, mcp, plugins, utilitas umum.
- `cli/transports`
  Transport stream event: WebSocket, SSE, hybrid transport, uploader state worker, batching event.

Bedanya dengan `src/commands`, folder `cli` lebih dekat ke mode eksekusi CLI/headless, sedangkan `commands` lebih dekat ke slash-command/fitur user-facing di dalam aplikasi.

### `src/commands`

Kumpulan command user-facing yang sangat besar. Ini adalah permukaan interaksi produk. Hampir semua fitur ada versi command-nya.

Subfolder penting:

- `commands/mcp`
  Kelola integrasi MCP.
- `commands/plugin`
  Kelola plugin dan marketplace.
- `commands/review`
  Flow review code / PR related.
- `commands/bridge`
  Kontrol remote-control / bridge session.
- `commands/context`
  Menampilkan context yang benar-benar dikirim ke model.
- `commands/clear`
  Bersih-bersih cache/session/conversation.
- `commands/install-github-app`
  Wizard instalasi GitHub App.
- `commands/remote-setup`
  Setup environment remote.
- `commands/add-dir`
  Menambah working directory tambahan.
- `commands/plan`, `commands/tasks`, `commands/model`, `commands/permissions`
  Kontrol runtime kerja agent.

Banyak subfolder lain di sini hanya membungkus 1-2 file karena masing-masing command dipisah agar lazy-load dan startup tetap ringan.

### `src/components`

Lapisan UI TUI berbasis React/Ink. Ini sangat besar karena produk ini punya pengalaman terminal yang kaya.

Subfolder penting:

- `components/messages`
  Rendering bubble/pesan percakapan.
- `components/permissions`
  Dialog, panel, dan flow persetujuan izin tool.
- `components/PromptInput`
  Input prompt utama user.
- `components/agents`
  UI terkait agent/team/subagent.
- `components/mcp`
  UI untuk MCP connection dan resource.
- `components/tasks`
  UI status task background.
- `components/design-system`
  Primitive UI yang reusable.
- `components/sandbox`
  UI status sandbox/izin.
- `components/shell`
  Tampilan shell/tool execution.
- `components/memory`, `components/teams`, `components/skills`
  UI untuk memory/team/skill workflows.

Intinya, `components` adalah wajah terminal app ini.

### `src/constants`

Konstanta global yang dipakai lintas subsistem. Biasanya untuk mode, labels, sumber query, nama event, atau default produk.

### `src/context`

React context dan state container lintas UI/runtime. Bukan context prompt model, melainkan context aplikasi untuk overlay, notification, permission UI, dan state turunan lain.

### `src/coordinator`

Area kecil tapi strategis untuk mode koordinasi agent. Biasanya menjadi glue code saat banyak agent/task/tool perlu disatukan di level orchestration.

### `src/entrypoints`

Entry point tambahan selain main REPL.

- `entrypoints/sdk`
  Jalur masuk untuk mode SDK/embedded/headless.

Ini penting kalau aplikasi dijalankan bukan sebagai terminal interaktif biasa.

### `src/hooks`

React hooks dan app hooks. Folder ini besar karena hampir semua pengalaman interaktif butuh hook khusus.

Subbagian penting:

- `hooks/notifs`
  Hook notifikasi.
- `hooks/toolPermission`
  Hook flow permission tool.

Kalau `components` adalah tampilan, `hooks` adalah perilaku interaktifnya.

### `src/ink`

Implementasi internal untuk UI terminal berbasis Ink, termasuk komponen, event, layout, dan terminal I/O.

- `ink/components`
  Primitive UI terminal internal.
- `ink/events`
  Event handling keyboard/terminal.
- `ink/hooks`
  Hook spesifik layer Ink.
- `ink/layout`
  Layout engine/pola rendering terminal.
- `ink/termio`
  Operasi low-level terminal input/output.

Ini adalah fondasi UI tekstual yang lebih rendah levelnya daripada `src/components`.

### `src/keybindings`

Definisi shortcut keyboard dan utilitas binding input. Relevan untuk navigasi TUI, mode khusus, dan command trigger.

### `src/memdir`

Area penyimpanan/akses memory directory lokal. Biasanya dipakai untuk state atau artefak yang harus hidup di disk dengan struktur tertentu.

### `src/migrations`

Migrasi format data lokal. Berguna saat struktur settings, session storage, atau artifacts berubah antar versi aplikasi.

### `src/moreright`

Folder kecil dan sangat spesifik produk. Biasanya fitur eksperimen atau kemampuan niche yang belum cukup besar untuk jadi subsistem sendiri.

### `src/native-ts`

Wrapper TypeScript untuk kapabilitas native.

- `native-ts/color-diff`
  Helper diff/warna level native.
- `native-ts/file-index`
  Integrasi indexing file.
- `native-ts/yoga-layout`
  Binding/layout support untuk engine tampilan.

### `src/outputStyles`

Definisi style output. Ini mengatur bagaimana hasil atau tampilan tertentu diformat ke terminal.

### `src/plugins`

Sistem plugin lokal.

- `plugins/bundled`
  Plugin bawaan produk.

Ini berbeda dari `services/plugins` yang lebih ke service layer; `src/plugins` adalah paket plugin-nya sendiri.

### `src/query`

Helper di sekitar query pipeline. Walau kecil, folder ini menopang transform, normalisasi, atau utilitas yang dipakai jalur pemanggilan model.

### `src/remote`

Fitur terkait remote runtime/environment yang bukan bridge core langsung. Biasanya helper untuk environment atau remote execution context.

### `src/schemas`

Schema validasi global. Meski kecil, ini penting untuk menjaga boundary data tetap ketat.

### `src/screens`

Representasi layar/scene besar dalam pengalaman TUI. Kalau `components` adalah blok UI kecil-menengah, `screens` adalah layout halaman/scene utuh.

### `src/server`

Server-side helper kecil yang dibutuhkan app. Ukurannya tidak besar, jadi ini bukan backend penuh, lebih ke endpoint/bridge lokal tertentu.

### `src/services`

Service layer aplikasi. Ini tempat business logic yang terlalu berat untuk tinggal di komponen, hook, atau command.

Subfolder penting:

- `services/api`
  Integrasi provider/model API, request lifecycle, usage, retry, dan parsing response.
- `services/mcp`
  Koneksi dan operasi MCP.
- `services/analytics`
  Event telemetry/analytics.
- `services/oauth`
  Login/token lifecycle.
- `services/compact`
  Kompresi/summarization context.
- `services/lsp`
  Integrasi LSP/editor intelligence.
- `services/plugins`
  Operasi plugin di level service.
- `services/settingsSync`
  Sinkronisasi settings.
- `services/remoteManagedSettings`
  Settings yang dikontrol dari remote/managed source.
- `services/SessionMemory`
  Pengelolaan memory per session.
- `services/teamMemorySync`
  Sinkronisasi memory antar teammate/team mode.
- `services/PromptSuggestion`, `services/MagicDocs`, `services/toolUseSummary`
  Fitur bantuan dan summarization.

Kalau disederhanakan: `services` adalah dapur bisnisnya.

### `src/skills`

Sistem skill yang dapat dimuat ke agent.

- `skills/bundled`
  Skill bawaan.

Ini penting karena produk ini tidak hanya punya tools, tapi juga paket instruksi/kapabilitas terstruktur.

### `src/state`

State store aplikasi global. Di sinilah AppState dan state turunan utama biasanya hidup atau dimodifikasi.

### `src/tasks`

Implementasi runtime task background.

Subfolder penting:

- `tasks/LocalShellTask`
  Task shell lokal.
- `tasks/LocalAgentTask`
  Task agent lokal.
- `tasks/RemoteAgentTask`
  Task agent remote.
- `tasks/InProcessTeammateTask`
  Task teammate di proses yang sama.
- `tasks/DreamTask`
  Task khusus background/long-running tertentu.

Folder ini adalah executor layer untuk pekerjaan asinkron.

### `src/tools`

Katalog tool yang bisa dipanggil model/agent. Ini salah satu pusat paling penting di codebase.

Tool penting:

- `tools/BashTool`
  Eksekusi bash.
- `tools/PowerShellTool`
  Eksekusi PowerShell.
- `tools/FileReadTool`, `FileWriteTool`, `FileEditTool`
  Akses dan modifikasi file.
- `tools/GrepTool`, `GlobTool`
  Discovery/search di codebase.
- `tools/MCPTool`, `ListMcpResourcesTool`, `ReadMcpResourceTool`, `McpAuthTool`
  Interaksi MCP.
- `tools/AgentTool`, `SendMessageTool`
  Interaksi agent lain / teammate.
- `tools/Task*`
  Membuat, melihat, update, stop task.
- `tools/SkillTool`
  Menjalankan skill.
- `tools/WebFetchTool`, `WebSearchTool`
  Akses web.
- `tools/LSPTool`
  Integrasi code intelligence.
- `tools/NotebookEditTool`
  Edit notebook.
- `tools/TodoWriteTool`
  Menulis todo/state kerja.
- `tools/EnterPlanModeTool`, `ExitPlanModeTool`, `EnterWorktreeTool`, `ExitWorktreeTool`
  Tool kontrol mode kerja agent.

Kalau `services` adalah dapur logika, `tools` adalah tangan yang dipakai model untuk bertindak.

### `src/types`

Definisi type bersama lintas aplikasi.

- `types/generated`
  Type hasil generate dari schema/protocol tertentu.

### `src/upstreamproxy`

Lapisan proxy ke upstream tertentu. Biasanya dipakai untuk meneruskan request atau menyesuaikan contract dengan service di luar app.

### `src/utils`

Folder utilitas terbesar dan terpadat. Ini berisi helper kecil sampai subsistem semi-besar yang dipakai lintas codebase. Banyak aturan dan perilaku penting tersembunyi di sini.

Subfolder penting:

- `utils/plugins`
  Loading, validasi, discovery, dan operasi plugin.
- `utils/permissions`
  Logika izin, classifier, hasil allow/deny, dan guard execution.
- `utils/bash`
  Parsing, validasi, dan keamanan command bash.
- `utils/shell`
  Integrasi shell umum lintas platform.
- `utils/settings`
  Baca/tulis/validasi settings, termasuk managed settings dan schema output.
- `utils/model`
  Resolver model, capability, fallback, dan metadata provider/model.
- `utils/computerUse`
  Helper automation/computer-use.
- `utils/swarm`
  Mode teammate/swarm: backend, spawn, permission sync, reconnection, layout teammate.
- `utils/hooks`
  Helper untuk hook runtime non-React.
- `utils/task`
  Output task, formatting, progress.
- `utils/telemetry`
  Logger, tracing, exporter.
- `utils/mcp`
  Helper MCP tambahan.
- `utils/memory`
  Memory helper.
- `utils/messages`
  Transform dan helper message.
- `utils/secureStorage`
  Penyimpanan aman credential/token.
- `utils/git`
  Operasi git helper.
- `utils/suggestions`
  Autocomplete dan suggestion system.
- `utils/teleport`
  Fitur teleport/export environment.
- `utils/nativeInstaller`
  Instalasi helper native.
- `utils/processUserInput`
  Preprocessing input user.
- `utils/claudeInChrome`, `utils/deepLink`, `utils/dxt`, `utils/background`, `utils/todo`
  Helper produk yang lebih spesifik.

Folder ini bukan “tempat buang helper” biasa. Di codebase ini, `utils` adalah jaringan support utama yang menopang hampir semua fitur.

### `src/vim`

Mode editing/navigasi ala Vim.

- motions
- operators
- text objects
- transitions

Artinya TUI ini cukup canggih sampai punya interaction model ala editor.

### `src/voice`

Gate/flag kecil untuk voice mode. Foldernya kecil, tapi menunjukkan produk ini punya jalur voice capability.

## Cara Membaca Arsitektur `restored-src/`

Kalau mau memahami codebase ini secara bertahap, urutan paling masuk akal adalah:

1. Mulai dari file top-level: `src/main.tsx`, `src/setup.ts`, `src/query.ts`, `src/Tool.ts`, `src/Task.ts`.
2. Lanjut ke subsistem tindakan: `src/tools`, `src/tasks`, `src/services/api`, `src/services/mcp`.
3. Setelah itu baru lihat permukaan produk: `src/commands`, `src/components`, `src/hooks`.
4. Kalau butuh remote operation, masuk ke `src/bridge` dan `src/cli/transports`.
5. Kalau butuh aturan internal produk, cek `src/utils`, terutama `utils/permissions`, `utils/settings`, `utils/plugins`, `utils/bash`, `utils/model`.

## Relevansi untuk `agentai01`

Paling relevan untuk dipelajari atau diadaptasi:

- `src/services/mcp`
- `src/tools`
- `src/tasks`
- `src/services/api`
- `src/utils/permissions`
- `src/utils/settings`
- `src/utils/bash`
- `src/utils/model`

Relevan sebagai referensi pola, tapi tidak perlu dicopy mentah:

- `src/bridge`
- `src/cli`
- `src/services/analytics`
- `src/skills`
- `src/plugins`
- `src/utils/swarm`

Lebih cocok dipahami saja, bukan dipindahkan ke backend `agentai01`:

- `src/components`
- `src/ink`
- `src/screens`
- `src/buddy`
- `src/vim`

## Kesimpulan

`restored-src/` bukan sekadar kumpulan helper AI. Ini produk agent CLI penuh dengan arsitektur berlapis:

- runtime percakapan
- tool execution
- task orchestration
- permission/security
- MCP integration
- plugin/skill system
- remote bridge
- TUI rendering

Kalau tujuan kita adalah belajar atau mengekstrak kapabilitas untuk `agentai01`, maka pendekatan yang benar adalah membaca dan mengambil subsistem inti satu per satu, bukan memperlakukan `restored-src/` sebagai satu modul tunggal.
