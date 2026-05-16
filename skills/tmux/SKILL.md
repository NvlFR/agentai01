# tmux

Status: guidance-only.
Source: `referensi/openclaw/skills/tmux`

## Use When

- You need to inspect or coordinate existing interactive CLI sessions running inside tmux.
- Multiple workers are using Codex, Claude Code, Gemini CLI, or runtime commands in parallel.
- You need pane output, session status, or a carefully confirmed input sent to an existing pane.

## Requirements

- `tmux` binary. Linux install: `sudo apt-get install tmux`; macOS install: `brew install tmux`.
- Optional `rg` for scanning captured output. Linux install: `sudo apt-get install ripgrep`.
- Know the exact target before sending input: `session`, `session:window`, or `session:window.pane`.
- This skill is not a runtime executable skill; all actions are operator-guided shell commands.

## Workflow

1. List sessions and panes read-only:

```bash
tmux list-sessions
tmux list-windows -t <session>
tmux list-panes -t <session>:<window>
```

2. Capture output before deciding what to do:

```bash
tmux capture-pane -t <session>:<window>.<pane> -p | tail -40
tmux capture-pane -t <session>:<window>.<pane> -p -S - | rg -i "error|failed|permission|ready|done"
```

3. Summarize state: current command, prompt/waiting status, last meaningful output, and whether input appears needed.
4. Ask for explicit operator confirmation before disruptive or externally visible actions.
5. Send literal text and Enter separately for interactive CLIs:

```bash
tmux send-keys -t <session>:<window>.<pane> -l -- "Run npm run check and report failures only."
sleep 0.1
tmux send-keys -t <session>:<window>.<pane> Enter
```

6. Verify by capturing the pane again and reporting what changed.

## Safety

- Read-only actions: `list-sessions`, `list-windows`, `list-panes`, `capture-pane`.
- Confirmation required: `send-keys`, `C-c`, `C-d`, `C-z`, `kill-session`, `kill-window`, `kill-pane`, `rename-session`, `new-session`, or any command that may start work.
- Never send secrets through `tmux send-keys`; load credentials from env, `.env.local`, or auth profiles outside the prompt.
- Redact captured output before summarizing. Replace bearer tokens, `sk-*`, GitHub tokens, Slack tokens, Google API keys, cookies, chat ids, phone numbers, and `token=...` style values with `[REDACTED]`.
- Do not assume a pane belongs to this task. Confirm session naming and visible context first.
- Prefer `exec_command` for one-off non-interactive commands; use tmux only for existing interactive sessions or deliberate long-running coordination.

## Validation

```bash
command -v tmux
tmux list-sessions
rg -n 'open[c]law|~/\.[o]penclaw|open[c]law message send' skills/tmux || true
```

For live verification, capture a pane, summarize it with redaction, ask before sending any input, then capture again to prove the requested input was received.
