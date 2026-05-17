---
name: summarize
description: Meringkas konten panjang atau artikel web menggunakan AI provider.
version: 0.1.0
---
# Summarize

## Tujuan
Memberikan ringkasan yang padat, jelas, dan akurat dari teks atau dokumen yang panjang. Skill ini digunakan saat agent perlu mengekstrak informasi penting dari konten eksternal atau log panjang tanpa harus memproses keseluruhan teks secara manual.

## Cara Pakai
Skill ini biasanya digunakan dalam kombinasi dengan hasil ekstraksi web atau pembacaan dokumen, kemudian meneruskannya ke AI provider (model LLM) dengan instruksi untuk merangkum.

Langkah-langkah:
1. Dapatkan teks sumber (misalnya dari halaman web atau file lokal).
2. Kirim prompt ke AI provider (misalnya menggunakan model `gemini-3-flash` atau GPT-4) dengan meminta ringkasan.
3. Kembalikan ringkasan tersebut kepada pengguna.

Contoh pemanggilan:
```typescript
const prompt = `Buat ringkasan dari teks berikut: \n\n${longText}`
const summary = await aiProvider.generateText({
  model: 'gemini-3-flash',
  prompt
})
```

## Parameter
Saat menggunakan skill summarize, siapkan parameter berikut:
- `teks_sumber` (string): Konten lengkap yang perlu diringkas.
- `panjang_ringkasan` (string): Opsional, target panjang ringkasan (misalnya 'pendek', 'menengah', 'panjang').
- `fokus` (string): Opsional, aspek spesifik yang perlu ditekankan dalam ringkasan (misal 'poin utama', 'keputusan', atau 'kesimpulan').
