# wacli

Status: guidance-only. This skill documents safe WhatsApp operations through the external `wacli` binary; it is not a runtime `SkillRegistry` executable.
Source: `referensi/openclaw/skills/wacli`

## Use When

- The operator explicitly asks to message a third party on WhatsApp.
- The operator asks to sync, search, or inspect locally mirrored WhatsApp history.
- A sales or support workflow needs an operator-approved WhatsApp outreach step.

Do not use `wacli` for ordinary active chats with the operator. Use it only for third-party WhatsApp targets or history operations requested by the operator.

## Requirements

- `wacli` installed from a trusted source.
- Authenticated WhatsApp linked-device session created by the operator.
- Optional `jq` for JSON output.
- No API keys are needed, but the local store contains private message data.

Install hints:

```bash
brew install steipete/tap/wacli
wacli --version
```

Source builds are also possible with Go. Follow the upstream `wacli` docs for the current build command.

Store behavior:

- Linux default store is usually `~/.local/state/wacli`; existing `~/.wacli` stores may be reused.
- Override with `--store DIR` or `WACLI_STORE_DIR`.
- Use named accounts or isolated stores when the operator has multiple WhatsApp identities.

## Workflow

1. Determine whether the request is read-only discovery, sync, or an externally visible send.
2. For discovery, use `--json` where parsing is needed.
3. For sends, collect exact recipient and final message text.
4. Restate recipient, account/store, and message body.
5. Require explicit confirmation before sending.
6. Send once, then verify the command result without exposing private history.

### Read-Only Discovery

Check health:

```bash
wacli doctor
```

List chats:

```bash
wacli --json chats list --limit 20 | jq '.[] | {jid: .JID, name: .Name}'
```

Search messages:

```bash
wacli --json messages search "invoice" --limit 20 | jq '.[] | {chat: .ChatJID, id: .ID, time: .Timestamp, text: .Text}'
```

Search within a selected chat:

```bash
wacli --json messages search "meeting" --limit 20 --chat 1234567890@s.whatsapp.net
```

One-shot sync:

```bash
wacli sync --once
```

Continuous sync, when the operator wants a live mirror:

```bash
wacli sync --follow
```

Backfill is read-oriented but can request history from the primary phone. Confirm chat ID and scope before running:

```bash
wacli history backfill --chat 1234567890@s.whatsapp.net --requests 2 --count 50
```

### Mutating Actions

Only send after explicit confirmation. Recipient must be a phone number, direct JID, or group JID discovered from `chats list`.

Send text:

```bash
wacli send text --to "+14155551212" --message "Operator-approved message"
```

Send to group:

```bash
wacli send text --to "1234567890-123456789@g.us" --message "Operator-approved group message"
```

Send file:

```bash
wacli send file --to "+14155551212" --file ./docs/agenda.pdf --caption "Operator-approved caption"
```

## Safety

- Require explicit recipient and exact message text before any send.
- Confirm before sending WhatsApp text, files, media, group messages, or participant-management actions.
- Use `WACLI_READONLY=1` or `--read-only` during discovery when possible.
- Do not summarize private message history unless the operator asked for that scope.
- Do not expose local store contents, phone numbers, JIDs, or message text beyond the requested answer.
- If a sync loop is already running for the same store, prefer the upstream delegation behavior instead of starting competing sessions.
- Treat backfill as sensitive because it may pull older private history from the primary device.

## Validation

```bash
command -v wacli
wacli --version
wacli doctor
WACLI_READONLY=1 wacli --json chats list --limit 1
```
