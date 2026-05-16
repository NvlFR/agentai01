# MCP Browser

Status: guidance-only.
Source: `referensi/openclaw/extensions/browser/src/browser/chrome-mcp.ts`, `referensi/openclaw/docs/tools/browser-control.md`

## Use When

- Connect an agent to an existing Chrome/Chromium session through Chrome DevTools MCP.
- Inspect pages, navigate, capture snapshots, upload files, or debug browser state.
- Prefer a browser-control bridge over ad hoc screenshot or shell automation.

## Requirements

- Chrome or Chromium profile intentionally selected by the operator.
- Chrome DevTools MCP package or custom command.
- Optional package launch:

```bash
npx -y chrome-devtools-mcp@latest
```

- Confirmation for actions that type, click, upload, download, submit forms, or affect accounts.
- No secrets in screenshots, snapshots, or copied page content.

## Workflow

1. Confirm target browser profile and whether the session is existing or newly launched.
2. List pages and select the exact target page.
3. Prefer read-only snapshot and URL inspection before navigation or mutation.
4. Use navigation/click/type/upload only after target and consequence are clear.
5. Reset or reconnect the MCP session if selected-page state goes stale or tool calls time out.
6. Redact screenshots and page text before sharing outside the operator context.

## Safety

- Do not operate on banking, admin, billing, production, or private account pages without explicit confirmation.
- Do not exfiltrate cookies, session storage, tokens, or password fields.
- Do not rely on stale selected-page state; re-list pages after errors.
- Treat browser MCP as local trusted automation with visible side effects.

## Validation

```bash
test -f skills/mcp-browser/SKILL.md
npx -y chrome-devtools-mcp@latest --help
```
