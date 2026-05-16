# Memory Curation

Status: guidance-only.
Source: project-native AI Company Runtime Platform workflow

## Use When

- Decide what should become durable project, client, agent, or operator memory.
- Clean or summarize conversation history before storing it.
- Prevent stale or sensitive memory from being reintroduced into agent context.

## Requirements

- Access to the candidate transcript, artifact, or decision note.
- Project namespace and owner attribution when storing memory.
- Redaction rules from `SECURITY.md`.
- Optional memory backend or file storage configured by runtime app.

## Workflow

1. Classify candidate memory: decision, preference, credential pointer, project fact, client context, lesson learned, or discard.
2. Keep source attribution and timestamp.
3. Summarize only the durable fact; avoid copying full raw transcript unless needed.
4. Redact or omit secrets, private URLs, account ids, and incidental personal data.
5. Attach expiry or review note for facts likely to change.
6. Verify the stored memory is scoped to the right project/client/operator boundary.

## Safety

- Never store raw credentials or API keys.
- Do not store sensitive personal content unless explicitly needed for the project and approved by the operator.
- Do not promote unverified assumptions into durable memory.
- Prefer pointers to secure secret stores over secret values.

## Validation

```bash
test -f skills/memory-curation/SKILL.md
rg -n "redact|attribution|expiry|project" skills/memory-curation/SKILL.md
```
