# Terminal UI

Project ini punya terminal UI operator yang dijalankan langsung dari runtime-app.

## Menjalankan

```bash
npm run runtime:tui
```

## Menu Utama

- `Runtime Dashboard`
- `Chat / Operator Console`
- `Live Log / Messages Pane`
- `Agent Management`
- `Readiness Checklist`
- `Exit`

## Runtime Dashboard

Dashboard menampilkan snapshot cepat:

- runtime id
- environment
- status readiness
- jumlah project
- approvals
- jobs
- messages
- model AI aktif

## Chat / Operator Console

Operator console dipakai untuk mengirim directive langsung ke runtime.

Fitur:

- mode `natural` dan `structured`
- session history per sesi TUI
- quick help untuk input ambigu seperti greeting
- hasil directive beserta snapshot singkat runtime

Workflow singkat:

1. Buka `Chat / Operator Console`
2. Isi `directive owner`
3. Pilih mode
4. Kirim directive
5. Lihat response dan riwayat sesi

## Live Log / Messages Pane

Pane ini dipakai untuk inspeksi cepat state runtime.

Tab yang tersedia:

- `1` untuk `messages`
- `2` untuk `jobs`
- `3` untuk `audit`
- `r` untuk refresh
- `q` untuk keluar

## Agent Management

Di menu ini operator bisa:

- melihat runtime agents
- inspect sub-agent registry per departemen
- browse draft agents
- menjalankan create agent wizard
- melihat pending approvals

## Create Agent Wizard

Wizard ini mengadaptasi flow `restored-src` ke runtime aktif. Step yang tersedia:

1. `location`
2. `method`
3. `generate`
4. `type`
5. `prompt`
6. `description`
7. `tools`
8. `model`
9. `color`
10. `memory`
11. `confirm`

## Tips Operator

- Gunakan `Readiness Checklist` dulu sebelum menguji provider live.
- Gunakan `Agent Management > Draft Agents` untuk inspect hasil generate.
- Gunakan `Live Log / Messages Pane` setelah menjalankan directive untuk melihat side effects.
