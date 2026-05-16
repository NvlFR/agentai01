# Summarize

Status: guidance-only. Runtime execution should be added only after provider selection, file privacy, and extraction limits are explicit in the caller contract.
Source: `referensi/openclaw/skills/summarize`

Guidance-only skill for summarizing URLs, YouTube videos, articles, PDFs, transcripts, and local files with the `summarize` CLI or an equivalent provider-backed summarizer.

## Use When

- The operator asks what a link, article, video, podcast, transcript, PDF, or local document is about.
- A research, product, sales, or support agent needs a compact brief from external content.
- The user asks for transcript extraction from a URL or video and a best-effort summary is acceptable.

## Requirements

- Optional binary: `summarize`.
- Install hint: follow `https://summarize.sh` for current package manager instructions.
- Provider credentials must come from environment variables or `.env.local`, never from committed files.
- Common provider variables: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`.
- Optional extraction services may require their own environment variables, such as `FIRECRAWL_API_KEY` or `APIFY_API_TOKEN`.

## Workflow

1. Identify the source type: URL, YouTube link, article, PDF, transcript, or local file.
2. Prefer read-only extraction first when the user needs a transcript or source text.
3. Choose a model explicitly when reproducibility matters.
4. Run the summarizer without printing environment variables or config contents.
5. Return a concise summary, key facts, caveats, and source limitations.

```bash
summarize "https://example.com/article" --model openai/gpt-4.1-mini --length medium
summarize "docs/example.pdf" --model openai/gpt-4.1-mini --length long
summarize "https://youtu.be/example" --youtube auto --extract-only
summarize "docs/research-notes.md" --json
```

If transcript output is huge, summarize first and ask which section or time range should be expanded.

## Safety

- Do not paste raw API keys, provider config, private URLs, or proprietary source text into logs.
- Treat local files and PDFs as potentially private. Summarize only the requested material.
- For confidential material, prefer local files under a task-specific temp directory and delete extracted intermediates after use.
- Do not claim full transcript fidelity for videos unless the extractor returned a complete transcript.
- Mention blocked pages, paywalls, missing captions, or extraction fallbacks when they affect confidence.

## Validation

```bash
command -v summarize
summarize "https://example.com" --length short
```
