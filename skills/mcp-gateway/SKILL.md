# MCP Gateway

Status: guidance-only.
Source: `referensi/openclaw/docs/cli/mcp.md`, `referensi/openclaw/src/gateway/mcp-http.*`

## Use When

- Expose runtime conversations, approvals, or tools to an MCP client.
- Design a local gateway bridge between AI Company Runtime Platform and Codex, Claude Code, Gemini, or another MCP client.
- Decide whether live events should be polled, waited on, or read from durable transcript history.

## Requirements

- A loopback or authenticated runtime gateway.
- Conversation/session route metadata: channel, recipient, optional account id, optional thread id.
- JSON-RPC 2.0 request/response discipline.
- Tool schemas that are JSON-safe and flattened enough for MCP clients.
- Operator auth for approval or mutation actions.

## Workflow

1. Treat the runtime as the MCP server and the coding CLI or desktop app as the MCP client.
2. Expose read-first tools: conversations list/get, transcript read, attachment metadata, and live event poll/wait.
3. Gate write tools such as message send and approval response behind existing runtime auth and confirmation rules.
4. Keep live event queues ephemeral; use transcript/log reads for durable history.
5. Build tool schemas from runtime tool descriptors and flatten unsupported union schemas when needed.
6. On disconnect, clean up any session-scoped queue, lease, or child process.

## Safety

- Bind default gateway surfaces to loopback unless the operator explicitly configures remote access.
- Do not replay old live events as if they were new; separate durable history from live queue state.
- Do not expose approval responses to unauthenticated callers.
- Do not include raw secrets in MCP tool results or tool schemas.

## Validation

```bash
test -f skills/mcp-gateway/SKILL.md
rg -n "JSON-RPC|events|approval|loopback" skills/mcp-gateway/SKILL.md
```
