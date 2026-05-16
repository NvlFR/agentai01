# TaskFlow Inbox Triage

Status: guidance-only.
Source: `referensi/openclaw/skills/taskflow-inbox-triage`

## Use When

- An operator or agent needs to classify inbound messages into business, personal, or later buckets.
- Support or sales needs a repeatable pattern for routing Slack, Telegram, email, or future channel-adapter items.
- A batch needs durable state, explicit waiting on human/channel replies, and a final summary without turning runtime code into a workflow DSL.

## Requirements

- A task orchestration surface that can create a parent flow, persist JSON-safe state, and resume by revision.
- Channel context for every inbox item: source, sender, timestamp, message id, and any thread id.
- Explicit destination rules for business, personal, and later items before any externally visible action.
- No runtime executable contract in this folder yet; do not add `skill.json` until the workflow is implemented as a registry skill.

## Workflow

1. Create one owner flow for the inbox batch.
2. Classify every item with prepared facts: source, channel id, sender id, message id, thread key, and current agent capability.
3. Persist routing state in a JSON-safe object:

```json
{
  "businessThreads": [],
  "personalItems": [],
  "laterItems": [],
  "decisions": []
}
```

4. Route business items to the configured business channel only after the target workspace/channel/thread is explicit.
5. Notify the owner for personal items when immediate attention is needed.
6. Keep everything else for an end-of-day or operator-requested summary.
7. Move the flow to waiting only when an outside reply or explicit operator decision is required.
8. Resume with the latest revision and finish when all items have a recorded route.

Suggested waiting payload:

```json
{
  "kind": "channel_reply",
  "channel": "telegram",
  "threadKey": "telegram:chat:<redacted-chat-id>:message:<message-id>"
}
```

## Safety

- Treat chat ids, sender ids, emails, phone numbers, and private channel names as sensitive operational data.
- Do not paste raw inbox content into public channels or issue trackers.
- Require confirmation before sending, forwarding, deleting, archiving, or marking messages read in external systems.
- Keep summaries minimal: intent, owner, next action, and redacted reference id.
- Never include `TOKEN_TELE`, `ID_CHAT`, `OPERATOR_TOKEN`, `AI_API_KEY`, bearer tokens, cookies, or API keys in state, logs, summaries, or prompts.
- If classification confidence is low, route to `laterItems` with a reason instead of guessing.

## Validation

```bash
test -f skills/taskflow-inbox-triage/SKILL.md
rg -n 'open[c]law|~/\.[o]penclaw|open[c]law message send' skills/taskflow-inbox-triage || true
```

For live workflow validation, use a non-production inbox sample and verify that no write action occurs until the operator confirms the exact destination.
