# Task Spec — Missing Adapter Modules and Services

## Goal

Implement missing `src/*` namespaces requested in `todo.txt` as real, project-adapted modules that wrap or compose existing `agentai01` capabilities without copying raw reference code.

## Scope

- Add missing core namespaces under `src/` with concrete behavior and colocated tests where practical.
- Add `src/services/*` facades for API, MCP, analytics, compacting, plugin operations, session memory, prompt suggestions, settings synchronization, and tool-use summaries.
- Extend `src/tools/` with concrete tool descriptors and executors for important built-in tools.
- Keep implementations aligned with `AGENTS.md`, `CODEX.md`, and `SECURITY.md`.

## Constraints

- TypeScript ESM strict with `.js` relative imports.
- No `any`, no placeholder `not implemented` paths.
- External boundaries must validate inputs.
- Do not hardcode secrets.
- Reuse existing modules from this repo wherever possible.

## Validation Target

- `npm run check`
- `bun test` for touched public contracts
- Summary note under `summary/`
