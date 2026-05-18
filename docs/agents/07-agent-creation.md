# Agent Creation

Project ini menyediakan flow pembuatan agent draft yang bisa diakses lewat HTTP API dan terminal UI.

## Mode Pembuatan

- manual
- generate with AI

## Lokasi Penyimpanan

- `project`
- `runtime`
- `user`

## Output Draft

Setiap draft disimpan sebagai:

- markdown artifact
- manifest JSON

Lokasi umum:

- `workspaces/generated-agents/project/`
- `workspaces/generated-agents/runtime/`
- `~/.agentai01/agents/`

## Step Wizard

1. tentukan location
2. pilih method
3. generate brief bila memakai AI
4. isi `type` atau identifier
5. isi system prompt
6. isi description atau `whenToUse`
7. pilih allowed tools
8. pilih model override
9. pilih color
10. pilih memory behavior
11. confirm dan save

## Via Terminal UI

Masuk ke:

`Agent Management > Create Agent Wizard`

## Via HTTP API

### Ambil schema

```bash
curl http://127.0.0.1:3000/api/agents/wizard/schema
```

### Generate draft

```bash
curl -X POST http://127.0.0.1:3000/api/agents/wizard/generate \
  -H 'content-type: application/json' \
  -d '{
    "brief": "Buat agent untuk incident note dan timeline",
    "location": "project"
  }'
```

### Validate draft

```bash
curl -X POST http://127.0.0.1:3000/api/agents/wizard/validate \
  -H 'content-type: application/json' \
  -d '{
    "location": "project",
    "method": "manual",
    "type": "incident-scribe",
    "prompt": "You write concise incident timelines.",
    "description": "Use this agent when the team needs incident notes."
  }'
```

### Save draft

```bash
curl -X POST http://127.0.0.1:3000/api/agents/wizard/save \
  -H 'content-type: application/json' \
  -d '{
    "location": "project",
    "method": "manual",
    "type": "incident-scribe",
    "prompt": "You write concise incident timelines.",
    "description": "Use this agent when the team needs incident notes.",
    "tools": ["slack", "notion"],
    "model": "default",
    "memory": "none"
  }'
```

## Tips Mendesain Agent

- buat `whenToUse` yang spesifik, bukan terlalu umum
- batasi tools sesuai kebutuhan agent
- nyalakan memory hanya jika memang butuh lintas sesi
- hindari menjadikan satu agent melakukan terlalu banyak domain sekaligus
