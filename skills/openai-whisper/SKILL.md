# OpenAI Whisper CLI

Status: guidance-only. Use `skills/openai-whisper-api` when the operator explicitly chooses remote API transcription.
Source: `referensi/openclaw/skills/openai-whisper`

Guidance-only skill for local speech-to-text transcription with the `whisper` CLI. This path keeps audio on the local machine except for model downloads.

## Use When

- The user asks to transcribe or translate an audio or video file locally.
- Audio contains private or client material and should not be sent to a remote API.
- The machine has enough CPU/GPU capacity for the chosen Whisper model.

## Requirements

- Binary: `whisper`.
- Install hint: use the current package instructions for OpenAI Whisper, commonly `pipx install openai-whisper` or `uv tool install openai-whisper`.
- `ffmpeg` is usually required for common audio/video formats.
- Models are downloaded to the local cache on first use. Plan for disk and network time.

## Workflow

1. Confirm the media path, desired language, output format, and whether translation is needed.
2. Copy or symlink media into a task-specific temp directory when the source is private or should remain unchanged.
3. Pick the smallest model that meets the accuracy need.
4. Write transcript output to an explicit directory.
5. Review obvious timestamp, speaker, or language issues before summarizing or sending onward.

```bash
mkdir -p tmp/transcription
whisper tmp/transcription/audio.mp3 --model medium --output_format txt --output_dir tmp/transcription
whisper tmp/transcription/audio.m4a --task translate --model medium --output_format srt --output_dir tmp/transcription
```

## Safety

- Treat audio, video, transcripts, and subtitles as private user content.
- Do not commit media fixtures, generated transcripts, or subtitles unless explicitly approved.
- Delete temp media and transcript outputs after handoff when retention is not needed.
- Do not print private transcript excerpts into broad logs. Summaries should redact secrets and sensitive personal data.
- Local transcription still may download model weights. Do not confuse that with uploading the audio.

## Validation

```bash
command -v whisper
command -v ffmpeg
whisper --help
```
