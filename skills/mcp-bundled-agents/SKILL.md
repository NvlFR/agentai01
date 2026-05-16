# MCP Bundled Agents

Status: guidance-only.
Source: `referensi/openclaw/src/agents/pi-bundle-mcp-types.ts`, `referensi/openclaw/src/agents/mcp-transport-config.ts`

## Use When

- Give a coding agent session access to a bounded set of MCP server tools.
- Attach MCP tools to Codex, Claude Code, Gemini, or equivalent agent runs.
- Manage session-scoped MCP runtime lifecycle and cleanup.

## Requirements

- Session id and optional session key.
- Workspace directory for the agent run.
- MCP server config fingerprint so config drift can be detected.
- Server catalog with tool count and tool schemas.
- Runtime cleanup path for session dispose and idle sweeping.

## Workflow

1. Resolve configured servers into stdio, SSE, or streamable HTTP transports.
2. Start or reuse a session-scoped MCP runtime for the agent session.
3. Build a catalog containing server names, launch summary, tool names, titles, descriptions, and input schemas.
4. Expose tools through the agent's native mechanism without rewriting their semantics.
5. Track last-used time and active leases so long-running runs do not lose live tools.
6. Dispose session runtime on completion, reset, delete, or idle TTL expiry.

## Safety

- Do not keep orphaned stdio MCP child processes after the parent agent session exits.
- Do not mix MCP tools across unrelated project workspaces.
- Do not trust changed config silently; compare fingerprint and recreate runtime when it drifts.
- Do not expose destructive MCP tools without the same confirmation policy used by runtime directives.

## Validation

```bash
test -f skills/mcp-bundled-agents/SKILL.md
rg -n "session|fingerprint|dispose|catalog" skills/mcp-bundled-agents/SKILL.md
```
