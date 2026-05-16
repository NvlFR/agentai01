# Slack

Status: guidance-only. This skill documents safe Slack workspace operations for the AI Company Runtime Platform; it is not a runtime `SkillRegistry` executable.
Source: `referensi/openclaw/skills/slack`

## Use When

- The operator asks to inspect Slack context, summarize a thread, react to a message, manage pins, or send/edit/delete a Slack message.
- A support, sales, project-management, or engineering workflow needs Slack channel coordination.
- You have explicit Slack workspace, channel, user, or message identifiers from the operator or prior read-only discovery.

## Requirements

- Slack app or bot token with only the scopes needed for the requested action.
- Credentials from environment or local secret storage only, for example `SLACK_BOT_TOKEN` in `.env.local`.
- `curl` and optionally `jq` for API inspection.
- Required Slack identifiers:
  - channel ID such as `C123...`
  - user ID such as `U123...`
  - message timestamp such as `1712023032.1234`

Never paste, print, commit, or include Slack tokens in model context. Do not use channel names when an API call needs IDs; discover IDs first.

## Workflow

1. Confirm the workspace and the intended operation.
2. Run read-only discovery first.
3. For externally visible or destructive actions, restate the target and exact change.
4. Ask for explicit confirmation before sending, editing, deleting, pinning, or unpinning.
5. Execute the smallest API call that satisfies the request.
6. Verify with a read-only follow-up.

### Read-Only Discovery

List channels:

```bash
curl -sS "https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=100" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" | jq '.channels[] | {id, name, is_private}'
```

Read recent messages:

```bash
curl -sS "https://slack.com/api/conversations.history?channel=C123&limit=20" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" | jq '.messages[] | {ts, user, text}'
```

Read a thread:

```bash
curl -sS "https://slack.com/api/conversations.replies?channel=C123&ts=1712023032.1234&limit=50" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" | jq '.messages[] | {ts, user, text}'
```

Inspect member info:

```bash
curl -sS "https://slack.com/api/users.info?user=U123" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" | jq '.user | {id, name, real_name, is_bot}'
```

List custom emoji:

```bash
curl -sS "https://slack.com/api/emoji.list" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" | jq '.emoji | keys'
```

List pins:

```bash
curl -sS "https://slack.com/api/pins.list?channel=C123" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" | jq '.items[] | {type, message: .message.ts}'
```

### Mutating Actions

Only run these after the operator confirms the workspace, channel/user target, message content, and any message timestamp.

Send a message:

```bash
curl -sS -X POST "https://slack.com/api/chat.postMessage" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data '{"channel":"C123","text":"Operator-approved message"}'
```

Edit a message:

```bash
curl -sS -X POST "https://slack.com/api/chat.update" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data '{"channel":"C123","ts":"1712023032.1234","text":"Operator-approved update"}'
```

Delete a message:

```bash
curl -sS -X POST "https://slack.com/api/chat.delete" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data '{"channel":"C123","ts":"1712023032.1234"}'
```

React to a message:

```bash
curl -sS -X POST "https://slack.com/api/reactions.add" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data '{"channel":"C123","timestamp":"1712023032.1234","name":"white_check_mark"}'
```

Pin or unpin:

```bash
curl -sS -X POST "https://slack.com/api/pins.add" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data '{"channel":"C123","timestamp":"1712023032.1234"}'
```

```bash
curl -sS -X POST "https://slack.com/api/pins.remove" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data '{"channel":"C123","timestamp":"1712023032.1234"}'
```

## Safety

- Treat all Slack writes as externally visible.
- Require explicit confirmation for sends, edits, deletes, pins, and unpins.
- Use Slack IDs and timestamps, not fuzzy names, for write targets.
- Redact tokens and private channel content in summaries.
- Respect workspace rate limits and app scopes; retry only after checking API error fields.
- Do not claim a message was sent or deleted until the API response has `ok: true`.

## Validation

```bash
test -n "$SLACK_BOT_TOKEN"
curl -sS "https://slack.com/api/auth.test" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" | jq '{ok, team, user_id, bot_id}'
```
