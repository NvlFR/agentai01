# Summary — Phase 7 Real MCP Runtime Wiring

## Scope

- Menambahkan runtime tool executor nyata untuk `notion`, `github`, `slack`, dan `canva_mcp` melalui MCP client atau direct integration adapter.
- Menambahkan runtime khusus `ContentCreator` dengan prompt provider aktual dan side-effect tool execution.
- Menambahkan export `execute` modular pada semua file specialist serta wiring `execute` pada seluruh Department Head.
- Menambahkan `RuntimeOperationalApp.runDepartmentWorkflow()` + `department_run` event + approval request generation untuk owner review.
- Memperbarui spec detail-agent dan checklist task Phase 7.

## File Utama

- `src/runtime/subagents/toolExecutor.ts`
- `src/runtime/subagents/contentCreatorRuntime.ts`
- `src/runtime/subagents/headRuntime.ts`
- `src/runtime/subagents/fileExecuteBindings.ts`
- `src/runtime/subagents/specialistExecutor.ts`
- `src/runtime/subagents/handlers/{ceo,engineering,marketing,support}.ts`
- `src/agents/subagents/index.ts`
- `src/agents/subagents/**/{ceo,marketing,sales,product,engineering,pm,support}/*.ts`
- `src/runtime-app/orchestration/runtimeApp.ts`
- `src/runtime-app/orchestration/messageBus.ts`

## Verification

- `bun test src/runtime/subagents/toolExecutor.test.ts` ✅
- `bun test src/runtime/subagents/departmentRunner.test.ts` ✅
- `bun test src/runtime-app/orchestration/runtimeApp.test.ts` ✅
- `npm run check` ✅
- `npm run runtime:smoke` ✅
- `npm test` ⚠️ masih ada 12 failure di suite lain yang tidak disentuh Phase 7 (infra/filesystem helpers, extension registry low-priority, wiki memory backend, WhatsApp auth store, Telegram update-offset store)
