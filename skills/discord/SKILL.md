# Discord

Status: guidance-only. This skill documents safe Discord operations for the AI Company Runtime Platform; it is not a runtime `SkillRegistry` executable.
Source: `referensi/openclaw/skills/discord`

## Use When

- The operator asks to read Discord context, send a message, react, edit, delete, create a thread, or manage a poll.
- A community, support, release, or project workflow needs Discord coordination.
- You have explicit guild, channel, message, user, or thread IDs.

## Requirements

- Discord bot token from environment or local secret storage only, for example `DISCORD_BOT_TOKEN` in `.env.local`.
- Bot invited to the target guild with the minimum permissions needed.
- `curl` and optionally `jq`.
- Message content access may require the Discord Message Content privileged intent, depending on bot configuration and guild context.

Never paste, print, commit, or place Discord tokens in model context. Use IDs, not display names, for write targets.

## Workflow

1. Confirm the guild and channel.
2. Gather IDs with read-only discovery.
3. Draft outbound content in plain, short Discord style.
4. For writes, restate the exact channel/user/message/thread target and ask for confirmation.
5. Execute one action.
6. Verify with a read-only fetch.

### Read-Only Discovery

Get bot identity:

```bash
curl -sS "https://discord.com/api/v10/users/@me" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" | jq '{id, username}'
```

List guild channels:

```bash
curl -sS "https://discord.com/api/v10/guilds/GUILD_ID/channels" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" | jq '.[] | {id, name, type, parent_id}'
```

Read recent channel messages:

```bash
curl -sS "https://discord.com/api/v10/channels/CHANNEL_ID/messages?limit=20" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" | jq '.[] | {id, author: .author.id, content}'
```

Inspect reactions on a message:

```bash
curl -sS "https://discord.com/api/v10/channels/CHANNEL_ID/messages/MESSAGE_ID/reactions/%E2%9C%85?limit=25" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" | jq '.[] | {id, username}'
```

### Mutating Actions

Only run these after explicit operator confirmation. Use `silent: true` or flags when notification suppression is desired and supported.

Send a message:

```bash
curl -sS -X POST "https://discord.com/api/v10/channels/CHANNEL_ID/messages" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"content":"Operator-approved message","flags":4096}'
```

Edit a message:

```bash
curl -sS -X PATCH "https://discord.com/api/v10/channels/CHANNEL_ID/messages/MESSAGE_ID" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"content":"Operator-approved update"}'
```

Delete a message:

```bash
curl -sS -X DELETE "https://discord.com/api/v10/channels/CHANNEL_ID/messages/MESSAGE_ID" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN"
```

Add a reaction:

```bash
curl -sS -X PUT "https://discord.com/api/v10/channels/CHANNEL_ID/messages/MESSAGE_ID/reactions/%E2%9C%85/@me" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN"
```

Create a thread from a message:

```bash
curl -sS -X POST "https://discord.com/api/v10/channels/CHANNEL_ID/messages/MESSAGE_ID/threads" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"name":"operator-approved-thread","auto_archive_duration":1440}'
```

Create a poll through message creation:

```bash
curl -sS -X POST "https://discord.com/api/v10/channels/CHANNEL_ID/messages" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"content":"Vote when ready.","poll":{"question":{"text":"Operator-approved question"},"answers":[{"poll_media":{"text":"Option A"}},{"poll_media":{"text":"Option B"}}],"duration":24,"allow_multiselect":false}}'
```

## Writing Style

- Keep Discord messages short and conversational.
- Avoid Markdown tables.
- Mention users as `<@USER_ID>` only when the operator asked for a mention.
- Prefer clear text over rich components unless a runtime adapter explicitly supports Discord components.

## Safety

- Treat sends, edits, deletes, reactions, thread creation, and polls as externally visible writes.
- Require explicit target IDs and confirmation for writes.
- Be careful with moderation, role, channel-management, and presence actions; do not run them unless specifically requested and confirmed.
- Poll messages cannot be edited as normal content after creation; verify the poll draft before sending.
- Redact private channel content and all token-bearing output.
- Respect Discord rate-limit responses and wait according to returned retry guidance.

## Validation

```bash
test -n "$DISCORD_BOT_TOKEN"
curl -sS "https://discord.com/api/v10/users/@me" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" | jq '{id, username}'
```
