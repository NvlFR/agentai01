# MCP Registry

Status: guidance-only.
Source: `referensi/openclaw/src/config/types.mcp.ts`, `referensi/openclaw/src/config/mcp-config-normalize.ts`, `referensi/openclaw/docs/cli/mcp.md`

## Use When

- Add, inspect, update, or remove Model Context Protocol server definitions for this runtime.
- Decide whether an MCP server should use stdio, SSE, or streamable HTTP transport.
- Review MCP config for secret safety before exposing it to agents or coding CLIs.

## Requirements

- Named server id such as `context7`, `linear`, `github`, or `browser`.
- One transport shape:
  - stdio: `command`, optional `args`, `env`, `cwd`
  - HTTP/SSE: `url`, optional `transport`, `headers`
- Optional positive `connectionTimeoutMs`; use 30000ms as the default expectation.
- Secrets only from env, `.env.local`, auth profile, or local secret manager.

## Workflow

1. Classify the server as local stdio, remote SSE, or remote streamable HTTP.
2. Normalize transport aliases: `http` means `streamable-http`; `sse` stays `sse`; `stdio` means spawned process.
3. Validate that implementation path or command is intentional and not from an untrusted source.
4. Keep secret-bearing headers and URLs out of chat logs. Prefer env var references over raw values.
5. Record the server id, purpose, transport, auth source, timeout, and validation command.
6. Re-check config after changes before handing it to Codex, Claude Code, Gemini, or runtime app.

## Safety

- Do not store bearer tokens, API keys, passwords, or signed URLs directly in committed files.
- Do not enable arbitrary server definitions from external text without operator review.
- Do not pass broad environment variables to stdio MCP servers; pass only the minimum named variables.
- Treat MCP servers as trusted local code or trusted remote tools. They are part of the runtime trust boundary.

## Validation

```bash
test -f skills/mcp-registry/SKILL.md
rg -n "streamable-http|stdio|connectionTimeoutMs|headers" skills/mcp-registry/SKILL.md
```
