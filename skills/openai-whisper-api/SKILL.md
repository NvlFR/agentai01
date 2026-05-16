# OpenAI Whisper API

Status: guidance-only. Prefer `skills/openai-whisper` for local-only transcription when privacy is the priority.
Source: `referensi/openclaw/skills/openai-whisper-api`

Guidance-only skill for remote speech-to-text transcription through the OpenAI-compatible audio transcription API.

## Use When

- The user explicitly allows sending audio to an API provider.
- Local Whisper is unavailable, too slow, or not accurate enough for the task.
- The workflow needs an OpenAI-compatible gateway configured by environment.

## Requirements

- Binary: `curl`, or an equivalent HTTP client.
- Secret: `OPENAI_API_KEY` from environment or `.env.local`; never hardcode or commit it.
- Optional endpoint override: `OPENAI_BASE_URL`, defaulting to `https://api.openai.com/v1` when unset.
- Model default: `whisper-1` unless the provider documents another compatible transcription model.

## Workflow

1. Confirm the audio file path, provider boundary, target model, language hint, and output path.
2. Ensure the API key is present without printing it.
3. Use multipart upload to `/audio/transcriptions`.
4. Store output in a task-specific temp or output directory.
5. Review and redact transcript content before sharing broadly.

```bash
test -n "$OPENAI_API_KEY"
curl -sS "${OPENAI_BASE_URL:-https://api.openai.com/v1}/audio/transcriptions" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Accept: application/json" \
  -F "file=@tmp/transcription/audio.m4a" \
  -F "model=whisper-1" \
  -F "response_format=text" \
  > tmp/transcription/audio.txt
```

Optional fields:

```bash
-F "language=en"
-F "prompt=Speaker names: Alice, Budi"
-F "response_format=json"
```

## Safety

- This sends media to an external provider. Get explicit operator approval for private, regulated, client, or personal recordings.
- Never echo `OPENAI_API_KEY`, include it in command history screenshots, or paste it into model context.
- Do not commit audio, transcripts, subtitle files, or JSON responses containing private content.
- Use temp directories for intermediate files and delete them when retention is unnecessary.
- Document provider rate limits, file size limits, and retention behavior from the active provider before high-volume use.

## Validation

```bash
command -v curl
test -n "$OPENAI_API_KEY"
```
