# OpenClaw Policy — Security

Ringkasan pelajaran dari `SECURITY.md` OpenClaw:

## Inti

- gunakan jalur disclosure privat
- bedakan vulnerability nyata vs expected behavior dalam trust model
- operator-trusted model harus dijelaskan secara eksplisit
- scanner-only findings tanpa impact sering tidak cukup

## Yang Relevan ke AgentAI01

- repo ini juga perlu jelas soal trust boundary operator
- TUI, API, dan channel surfaces harus dianggap sensitif
- session label bukan auth boundary
