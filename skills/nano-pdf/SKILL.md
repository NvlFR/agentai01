# nano-pdf

Status: guidance-only. Runtime execution is deferred until the repo has a PDF fixture policy and an output review contract.
Source: `referensi/openclaw/skills/nano-pdf`

Guidance-only skill for editing PDFs with natural-language instructions through the `nano-pdf` CLI or an equivalent PDF editing tool.

## Use When

- The user asks to change text, layout, labels, or small visual details in an existing PDF.
- An agent needs to prepare a revised PDF draft for operator review.
- The requested edit is page-scoped and can be verified visually after generation.

## Requirements

- Optional binary: `nano-pdf`.
- Install hint: `uv tool install nano-pdf` or the current instructions from `https://pypi.org/project/nano-pdf/`.
- Input PDF must be a file the operator is allowed to process.
- Large, encrypted, scanned, or image-only PDFs may need OCR or a different tool.

## Workflow

1. Confirm the input PDF path, target page, edit instruction, and output destination.
2. Work on a copy in a task-specific temp directory, not the original file.
3. Run the edit command with a precise instruction.
4. Inspect the output PDF before sending it outside the runtime.
5. Delete temporary copies and extracted artifacts when the task is complete.

```bash
mkdir -p tmp/pdf-edit
cp docs/source.pdf tmp/pdf-edit/source.pdf
nano-pdf edit tmp/pdf-edit/source.pdf 1 "Change the title to Q3 Results and fix the subtitle typo"
```

Page numbering can vary by tool version. If the edit lands on the wrong page, retry with the adjusted page number and note the correction.

## Safety

- Treat PDFs as private by default. Do not commit source PDFs, generated PDFs, screenshots, or extracted text unless explicitly approved.
- Use temp directories under `tmp/` or the OS temp directory and clean them after validation.
- Do not upload sensitive PDFs to remote services unless the operator explicitly approves that data boundary.
- Keep instructions specific. Broad natural-language edits can alter unintended content.
- Verify visual output and file metadata before delivery.

## Validation

```bash
command -v nano-pdf
nano-pdf --help
```
