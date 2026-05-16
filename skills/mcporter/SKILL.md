# mcporter

Status: guidance-only.
Source: `referensi/openclaw/skills/mcporter/SKILL.md`

## Use When

- Inspect MCP servers and tools outside the runtime.
- Call an MCP tool manually for debugging or integration discovery.
- Generate CLI or TypeScript client wrappers from an MCP server.

## Requirements

- External binary: `mcporter`.
- Install hint:

```bash
npm install -g mcporter
```

- MCP server config in a local non-committed config file, for example `config/mcporter.json`.
- Server credentials from auth profile, env, or local secret store.

## Workflow

1. List known servers:

```bash
mcporter list --output json
```

2. Inspect one server and schema:

```bash
mcporter list <server> --schema --output json
```

3. Call a tool with explicit args:

```bash
mcporter call <server.tool> --args '{"limit":5}' --output json
```

4. For stdio debugging, pass the command explicitly:

```bash
mcporter call --stdio "bun run ./server.ts" <tool> --args '{"query":"status"}'
```

5. Use `mcporter auth <server-or-url>` only when the operator is present and understands the account being connected.
6. Capture only redacted summaries in agent context.

## Safety

- Do not paste OAuth tokens, bearer headers, cookies, or API keys into prompts.
- Do not call mutating MCP tools unless the server, tool, target, and effect are explicit.
- Prefer `--output json` for machine-readable inspection and redact before sharing.
- Keep generated wrappers reviewed before using them in runtime code.

## Validation

```bash
command -v mcporter
mcporter --help
```
