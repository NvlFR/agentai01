# Skills Real AI Response Test

Tanggal: 2026-05-16

## Konteks

Test dilakukan lewat local OpenAI-compatible proxy:

```text
http://127.0.0.1:8045/v1/chat/completions
```

Percobaan awal dengan `gemini-3-flash` menghasilkan beberapa output kosong/terpotong karena proxy membutuhkan parameter `max_completion_tokens`, bukan `max_tokens`.

Rerun dilakukan dengan:

```text
model: gpt-4o-mini
parameter: max_completion_tokens
```

Hasil akhir:

```text
SUMMARY ok=49 bad=0 model=gpt-4o-mini
```

## Response AI Per Skill

- `agent-handoff`: transfer tugas antar agen; identifikasi tipe handoff; jangan sertakan rahasia mentah dan pastikan konfirmasi penerimaan.
- `approval-gates`: approval proposal/pengiriman eksternal/tindakan destruktif; identifikasi gate; jangan auto-approve gate Owner.
- `ceo-agent`: status proyek, delegasi, keputusan strategis; parsing direktif Owner; jangan melewati approval gate.
- `client-onboarding`: deal `won`; verifikasi handoff sales; jangan input secret di chat.
- `coding-agent`: delegasi coding; identifikasi task/path/validasi; jangan masukkan kredensial ke prompt.
- `delivery-packaging`: serah terima hasil; kumpulkan artefak dan bukti; jangan klaim delivered tanpa approval.
- `discord`: koordinasi Discord; konfirmasi guild dan ID; konfirmasi tertulis sebelum mutasi.
- `engineering-agent`: implementasi dari discovery handoff; validasi payload; jangan delivered tanpa Owner approval.
- `evaluation-loop`: evaluasi perubahan agen/tool; definisikan behavior; jangan pakai private fixture.
- `gh-issues`: auto-fix GitHub issue; parse/fetch issue; konfirmasi sebelum push/PR.
- `github`: PR/issue/CI; cek repo/auth; konfirmasi sebelum mutasi.
- `healthcheck`: triage runtime; mulai read-only; konfirmasi sebelum remediation.
- `incident-response`: outage/degraded; kumpulkan bukti read-only; konfirmasi sebelum restart/mutasi.
- `lead-intake`: prospek baru; pisahkan fakta/asumsi; jangan bocorkan kontak atau komit harga.
- `marketing-agent`: campaign dan asset; buat plan; jangan publish tanpa konfirmasi.
- `mcp-browser`: Chrome MCP; konfirmasi profile dan halaman; jangan eksfiltrasi data sensitif.
- `mcp-bundled-agents`: attach MCP tools ke agent session; resolve transport; cegah orphan process/cross-workspace leak.
- `mcp-gateway`: runtime sebagai MCP server; expose read tools; auth untuk approval.
- `mcp-registry`: config MCP server; klasifikasi transport; jangan simpan token mentah.
- `mcp-security`: review MCP risk; cek headers/url/env; jangan percaya output terinjeksi.
- `mcporter`: inspect/call MCP server; mulai `mcporter list`; jangan panggil mutating tool sembarangan.
- `memory-curation`: kurasi memori; klasifikasi kandidat; jangan simpan kredensial mentah.
- `model-usage`: monitor model/biaya; cek snapshot; jangan cetak API key.
- `nano-pdf`: edit PDF; buat temp copy; hapus file sementara.
- `notion`: page/database Notion; discovery read-only; konfirmasi sebelum modifikasi.
- `obsidian`: kelola vault; konfirmasi path; jangan ubah `.obsidian` tanpa instruksi.
- `openai-whisper-api`: transkripsi via API; konfirmasi izin/path/model; jangan bocorkan key/audio privat.
- `openai-whisper`: transkripsi lokal; konfirmasi media; hapus temp/private content.
- `oracle`: inspeksi SQL/DB; cek client; konfirmasi sebelum perubahan data/schema.
- `product-agent`: validasi won deal/discovery/spec; cek lead handoff; jangan handoff Engineering tanpa approved spec.
- `project-kickoff`: mulai proyek; konfirmasi lifecycle; jangan lewati approval gate.
- `project-manager-agent`: timeline/milestone/blocker; susun baseline; jangan ubah status tanpa bukti.
- `proposal-builder`: draft proposal; konfirmasi lead qualified; jangan kirim eksternal tanpa Owner approval.
- `runbook-directive`: directive runtime/Telegram; parse intent; konfirmasi destructive action.
- `sag`: koordinasi sub-agent; baca workflow/rules; jangan dua worker edit file sama.
- `sales-agent`: kelola lead/proposal; catat lead; jangan kirim pesan tanpa konfirmasi.
- `session-logs`: cari riwayat/audit; temukan log; redaksi data sensitif.
- `skill-creator`: buat/edit skill; tentukan tipe; jangan pakai credential asli di contoh.
- `slack`: operasi Slack; discovery read-only; konfirmasi sebelum mutasi.
- `summarize`: ringkas URL/video/dokumen; identifikasi sumber; jangan expose API key/data privat.
- `support-agent`: triage ticket; klasifikasi dan prioritas; jangan bocorkan log internal.
- `support-runbook`: support/incident; klasifikasi request; jangan mutasi tanpa konfirmasi.
- `taskflow-inbox-triage`: klasifikasi inbox; buat flow owner; konfirmasi sebelum aksi eksternal.
- `taskflow`: multi-step task; tentukan owner/goal; jangan simpan secret.
- `tmux`: koordinasi sesi CLI; list read-only; konfirmasi sebelum tindakan disruptif.
- `trello`: board/list/card; discovery read-only; konfirmasi sebelum modifikasi.
- `wacli`: WhatsApp CLI; cek `wacli doctor`; konfirmasi penerima dan isi sebelum kirim.
- `weather`: cuaca; minta lokasi eksplisit; jangan pakai untuk safety-critical decision.
- `xurl`: X/Twitter CLI; cek auth; jangan tampilkan credential atau verbose secret.

