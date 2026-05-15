# CLAUDE.md

Telegraph style. AI Company Runtime Platform — runtime platform untuk agen otonom.

## Commands

- Install: `npm install`
- Dev Server: `npm run dev`
- Typecheck: `npm run check`
- Unit Tests: `bun test`
- Smoke Test: `npm run runtime:smoke`
- Worker: `npm run runtime:worker`
- Scheduler: `npm run runtime:scheduler`
- Telegram: `npm run runtime:telegram`

## Code Style

- **TypeScript ESM**: Strict mode, no `any`, no `@ts-nocheck`.
- **Runtime Branching**: Prefer discriminated unions over freeform strings.
- **Project Isolation**: Agents only cross via domain types & registry contracts.
- **Provider**: OpenAI-compatible default. Adapter patterns for Anthropic/Google.
- **Secrets**: Mask `AI_API_KEY`, use `.env.local` for credentials.
- **File Size**: Split around ~700 LOC.
- **Comments**: Concise, logic-only.

## Testing

- **Engine**: Bun test.
- **Location**: Colocated `*.test.ts`.
- **Strategy**: Behavior-driven, clean state (env/timers/mocks) per test.
- **Mocks**: Narrow mocks, prefer injection.

## Project Map

- `src/domain/`: Core types, contracts, lifecycle.
- `src/agents/`: Specialized agent implementations.
- `src/runtime/`: Orchestrator core.
- `src/runtime-app/`: Operator shell, HTTP server, storage, providers.
- `src/registry/`: `AgentRegistry` (central state).
- `src/app/`: Application-level read models/snapshots.
- `.kiro/specs/`: Requirements, designs, and task lists.

Refer to `AGENTS.md` for full policy and `VISION.md` for product roadmap.
