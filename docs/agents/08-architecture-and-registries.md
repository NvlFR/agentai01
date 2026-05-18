# Architecture And Registries

Project ini mengikuti hierarki 4 tingkat dengan CEO sebagai root bisnis dan head department sebagai orchestrator antar specialist.

## Hierarki

```text
Owner
  -> CEO Agent
     -> Department Head
        -> Specialist
```

Departemen aktif:

- marketing
- engineering
- product
- project-manager
- sales
- support
- ceo-executive specialist group

## Komponen Arsitektur

### `src/domain/`

Berisi type inti, kontrak, dan struktur hierarki.

### `src/runtime/`

Berisi orchestration, baton passing, dan scratchpad isolation.

### `src/runtime-app/`

Berisi permukaan operator: HTTP server, worker, scheduler, telegram, TUI, provider wiring.

### `src/registry/`

Berisi registry agent dan sub-agent.

## Registry

### AgentRegistry

Dipakai untuk agent domain utama.

### SubAgentRegistry

Dipakai untuk pohon hierarki sub-agent dan department head.

Aturan penting:

- specialist wajib punya `parentAgentId`
- CEO tidak boleh punya `parentAgentId`
- setiap parent harus menunjuk ke agent yang valid
- batch registration harus lolos `validateIntegrity()`

## Baton Passing

Department head memecah pekerjaan menjadi chain specialist. Tiap specialist menyelesaikan tugas dan mem-pass hasil ke agent berikutnya sampai alur selesai.

## Scratchpad

`IntraDepartmentScratchpad` menjaga memori kerja per departemen tetap terisolasi supaya event bus utama tidak kebanjiran komunikasi internal.

## Allowed MCP Tools

Setiap sub-agent hanya boleh memakai MCP tools yang terdaftar di `allowedMcpTools` miliknya. Ini adalah boundary penting untuk keamanan dan kejelasan perilaku.
