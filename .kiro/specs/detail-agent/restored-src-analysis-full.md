# Analisis Detail File-per-File (restored-src/src)

Dokumen ini mengurai 1.902 file dengan membaca isi kodenya (mengekstrak JSDoc atau deklarasi export) agar penjelasannya relevan dengan fungsi aslinya.

## Direktori: `restored-src/src`

- **`QueryEngine.ts`**: Mengekspor: QueryEngineConfig, QueryEngine.
- **`Task.ts`**: True when a task is in a terminal state and will not transition further. Used to guard against injecting messages into dead teammates, evicting finish...
- **`Tool.ts`**: Mengekspor: ToolInputJSONSchema, QueryChainTracking, ValidationResult.
- **`commands.ts`**: Mengekspor: INTERNAL_ONLY_COMMANDS, builtInCommandNames, meetsAvailabilityRequirement.
- **`context.ts`**: Mengekspor: getSystemPromptInjection, setSystemPromptInjection, getGitStatus.
- **`cost-tracker.ts`**: Mengekspor: getStoredSessionCosts, restoreCostStateForSession, saveCurrentSessionCosts.
- **`costHook.ts`**: Mengekspor: useCostSummary.
- **`dialogLaunchers.tsx`**: Thin launchers for one-off dialog JSX sites in main.tsx. Each launcher dynamically imports its component and wires the `done` callback identically to ...
- **`history.ts`**: Stored paste content - either inline content or a hash reference to paste store.
- **`ink.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`interactiveHelpers.tsx`**: Mengekspor: completeOnboarding, showDialog, showSetupDialog.
- **`main.tsx`**: Mengekspor: startDeferredPrefetches.
- **`projectOnboardingState.ts`**: Mengekspor: Step, getSteps, isProjectOnboardingComplete.
- **`query.ts`**: Mengekspor: QueryParams.
- **`replLauncher.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`setup.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`tasks.ts`**: Mengekspor: getAllTasks, getTaskByType.
- **`tools.ts`**: Mengekspor: TOOL_PRESETS, ToolPreset, parseToolPreset.

## Direktori: `restored-src/src/assistant`

- **`sessionHistory.ts`**: Chronological order within the page.

## Direktori: `restored-src/src/bootstrap`

- **`state.ts`**: Mengekspor: ChannelEntry, AttributedCounter, getSessionId.

## Direktori: `restored-src/src/bridge`

- **`bridgeApi.ts`**: Called on 401 to attempt OAuth token refresh. Returns true if refreshed, in which case the request is retried once. Injected because handleOAuth401Err...
- **`bridgeConfig.ts`**: Shared bridge auth/URL resolution. Consolidates the ant-only CLAUDE_BRIDGE_ dev overrides that were previously copy-pasted across a dozen files — inbo...
- **`bridgeDebug.ts`**: Ant-only fault injection for manually testing bridge recovery paths.  Real failure modes this targets (BQ 2026-03-12, 7-day window): poll 404 not_foun...
- **`bridgeEnabled.ts`**: Runtime check for bridge mode entitlement.  Remote Control requires a claude.ai subscription (the bridge auths to CCR with the claude.ai OAuth token)....
- **`bridgeMain.ts`**: Mengekspor: BackoffConfig, isConnectionError, isServerError.
- **`bridgeMessaging.ts`**: Shared transport-layer helpers for bridge message handling.  Extracted from replBridge.ts so both the env-based core (initBridgeCore) and the env-less...
- **`bridgePermissionCallbacks.ts`**: Cancel a pending control_request so the web app can dismiss its prompt.
- **`bridgePointer.ts`**: Upper bound on worktree fanout. git worktree list is naturally bounded (50 is a LOT), but this caps the parallel stat() burst and guards against patho...
- **`bridgeStatusUtil.ts`**: Bridge status state machine states.
- **`bridgeUI.ts`**: Mengekspor: createBridgeLogger.
- **`capacityWake.ts`**: Shared capacity-wake primitive for bridge poll loops.  Both replBridge.ts and bridgeMain.ts need to sleep while "at capacity" but wake early when eith...
- **`codeSessionApi.ts`**: Thin HTTP wrappers for the CCR v2 code-session API.  Separate file from remoteBridgeCore.ts so the SDK /bridge subpath can export createCodeSession + ...
- **`createSession.ts`**: Create a session on a bridge environment via POST /v1/sessions.  Used by both `claude remote-control` (empty session so the user has somewhere to type...
- **`debugUtils.ts`**: Mengekspor: redactSecrets, debugTruncate, debugBody.
- **`envLessBridgeConfig.ts`**: Mengekspor: EnvLessBridgeConfig, DEFAULT_ENV_LESS_BRIDGE_CONFIG.
- **`flushGate.ts`**: State machine for gating message writes during an initial flush.  When a bridge session starts, historical messages are flushed to the server via a si...
- **`inboundAttachments.ts`**: Resolve file_uuid attachments on inbound bridge user messages.  Web composer uploads via cookie-authed /api/{org}/upload, sends file_uuid alongside th...
- **`inboundMessages.ts`**: Process an inbound user message from the bridge, extracting content and UUID for enqueueing. Supports both string content and ContentBlockParam[] (e.g...
- **`initReplBridge.ts`**: REPL-specific wrapper around initBridgeCore. Owns the parts that read bootstrap state — gates, cwd, session ID, git context, OAuth, title derivation —...
- **`jwtUtils.ts`**: Format a millisecond duration as a human-readable string (e.g. "5m 30s").
- **`pollConfig.ts`**: Mengekspor: getPollIntervalConfig.
- **`pollConfigDefaults.ts`**: Bridge poll interval defaults. Extracted from pollConfig.ts so callers that don't need live GrowthBook tuning (daemon via Agent SDK) can avoid the gro...
- **`remoteBridgeCore.ts`**: Env-less Remote Control bridge core.  "Env-less" = no Environments API layer. Distinct from "CCR v2" (the /worker/ transport protocol) — the env-based...
- **`replBridge.ts`**: Mengekspor: ReplBridgeHandle, BridgeState, BridgeCoreParams.
- **`replBridgeHandle.ts`**: Global pointer to the active REPL bridge handle, so callers outside useReplBridge's React tree (tools, slash commands) can invoke handle methods like ...
- **`replBridgeTransport.ts`**: Transport abstraction for replBridge. Covers exactly the surface that replBridge.ts uses against HybridTransport so the v1/v2 choice is confined to th...
- **`sessionIdCompat.ts`**: Session ID tag translation helpers for the CCR v2 compat layer.  Lives in its own file (rather than workSecret.ts) so that sessionHandle.ts and replBr...
- **`sessionRunner.ts`**: Sanitize a session ID for use in file names. Strips any characters that could cause path traversal (e.g. `../`, `/`) or other filesystem issues, repla...
- **`trustedDevice.ts`**: Trusted device token source for bridge (remote-control) sessions.  Bridge sessions have SecurityTier=ELEVATED on the server (CCR v2). The server gates...
- **`types.ts`**: Default per-session timeout (24 hours).
- **`workSecret.ts`**: Decode a base64url-encoded work secret and validate its version.

## Direktori: `restored-src/src/buddy`

- **`CompanionSprite.tsx`**: Mengekspor: MIN_COLS_FOR_FULL_SPRITE, companionReservedColumns, CompanionSprite.
- **`companion.ts`**: Mengekspor: Roll, roll, rollWithSeed.
- **`prompt.ts`**: Mengekspor: companionIntroText, getCompanionIntroAttachment.
- **`sprites.ts`**: Mengekspor: renderSprite, spriteFrameCount, renderFace.
- **`types.ts`**: Mengekspor: RARITIES, Rarity, duck.
- **`useBuddyNotification.tsx`**: Mengekspor: isBuddyTeaserWindow, isBuddyLive, useBuddyNotification.

## Direktori: `restored-src/src/cli`

- **`exit.ts`**: CLI exit helpers for subcommand handlers.  Consolidates the 4-5 line "print + lint-suppress + exit" block that was copy-pasted ~60 times across `claud...
- **`ndjsonSafeStringify.ts`**: JSON.stringify for one-message-per-line transports. Escapes U+2028 LINE SEPARATOR and U+2029 PARAGRAPH SEPARATOR so the serialized output cannot be br...
- **`print.ts`**: Mengekspor: joinPromptValues, canBatchWith, createCanUseToolWithPermissionPrompt.
- **`remoteIO.ts`**: Mengekspor: RemoteIO.
- **`structuredIO.ts`**: Mengekspor: SANDBOX_NETWORK_ACCESS_TOOL_NAME, StructuredIO.
- **`update.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/cli/handlers`

- **`agents.ts`**: Agents subcommand handler — prints the list of configured agents. Dynamically imported only when `claude agents` runs.
- **`auth.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`autoMode.ts`**: Auto mode subcommand handlers — dump default/merged classifier rules and critique user-written rules. Dynamically imported when `claude auto-mode ...`...
- **`mcp.tsx`**: MCP subcommand handlers — extracted from main.tsx for lazy loading. These are dynamically imported only when the corresponding `claude mcp ` command r...
- **`plugins.ts`**: Plugin and marketplace subcommand handlers — extracted from main.tsx for lazy loading. These are dynamically imported only when `claude plugin ` or `c...
- **`util.tsx`**: Miscellaneous subcommand handlers — extracted from main.tsx for lazy loading. setup-token, doctor, install

## Direktori: `restored-src/src/cli/transports`

- **`HybridTransport.ts`**: Hybrid transport: WebSocket for reads, HTTP POST for writes.  Write flow:  write(stream_event) ─┐ │ (100ms timer)
- **`SSETransport.ts`**: Time budget for reconnection attempts before giving up (10 minutes).
- **`SerialBatchEventUploader.ts`**: Serial ordered event uploader with batching, retry, and backpressure.  - enqueue() adds events to a pending buffer - At most 1 POST in-flight at a tim...
- **`WebSocketTransport.ts`**: Time budget for reconnection attempts before giving up (10 minutes).
- **`WorkerStateUploader.ts`**: Coalescing uploader for PUT /worker (session state + metadata).  - 1 in-flight PUT + 1 pending patch - New calls coalesce into pending (never grows be...
- **`ccrClient.ts`**: Mengekspor: CCRInitFailReason, CCRInitError, StreamAccumulatorState.
- **`transportUtils.ts`**: Helper function to get the appropriate transport for a URL.  Transport selection priority: 1. SSETransport (SSE reads + POST writes) when CLAUDE_CODE_...

## Direktori: `restored-src/src/commands/add-dir`

- **`add-dir.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`validation.ts`**: Mengekspor: AddDirectoryResult, addDirHelpMessage.

## Direktori: `restored-src/src/commands`

- **`advisor.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`bridge-kick.ts`**: Ant-only: inject bridge failure states to manually test recovery paths.  /bridge-kick close 1002            — fire ws_closed with code 1002 /bridge-ki...
- **`brief.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`commit-push-pr.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`commit.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`createMovedToPluginCommand.ts`**: The prompt to use while the marketplace is private. External users will get this prompt. Once the marketplace is public, this parameter and the fallba...
- **`init-verifiers.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`init.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`insights.ts`**: Mengekspor: deduplicateSessionBranches, detectMultiClauding, InsightsExport.
- **`install.tsx`**: Mengekspor: install.
- **`review.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`security-review.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`statusline.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`ultraplan.tsx`**: Mengekspor: CCR_TERMS_URL, buildUltraplanPrompt.
- **`version.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/agents`

- **`agents.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/ant-trace`

- **`index.js`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/autofix-pr`

- **`index.js`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/backfill-sessions`

- **`index.js`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/branch`

- **`branch.ts`**: Mengekspor: deriveFirstPrompt.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/break-cache`

- **`index.js`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/bridge`

- **`bridge.tsx`**: /remote-control command — manages the bidirectional bridge connection.  When enabled, sets replBridgeEnabled in AppState, which triggers useReplBridge...
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/btw`

- **`btw.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/bughunter`

- **`index.js`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/chrome`

- **`chrome.tsx`**: Mengekspor: call.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/clear`

- **`caches.ts`**: Session cache clearing utilities. This module is imported at startup by main.tsx, so keep imports minimal.
- **`clear.ts`**: Mengekspor: call.
- **`conversation.ts`**: Conversation clearing utility. This module has heavier dependencies and should be lazy-loaded when possible.
- **`index.ts`**: Clear command - minimal metadata only. Implementation is lazy-loaded from clear.ts to reduce startup time. Utility functions: - clearSessionCaches: im...

## Direktori: `restored-src/src/commands/color`

- **`color.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`index.ts`**: Color command - minimal metadata only. Implementation is lazy-loaded from color.ts to reduce startup time.

## Direktori: `restored-src/src/commands/compact`

- **`compact.ts`**: Mengekspor: call.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/config`

- **`config.tsx`**: Mengekspor: call.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/context`

- **`context-noninteractive.ts`**: Shared data-collection path for `/context` (slash command) and the SDK `get_context_usage` control request. Mirrors query.ts's pre-API transforms (com...
- **`context.tsx`**: Apply the same context transforms query.ts does before the API call, so /context shows what the model actually sees rather than the REPL's raw history...
- **`index.ts`**: Mengekspor: context, contextNonInteractive.

## Direktori: `restored-src/src/commands/copy`

- **`copy.tsx`**: Mengekspor: collectRecentAssistantTexts, fileExtension, call.
- **`index.ts`**: Copy command - minimal metadata only. Implementation is lazy-loaded from copy.tsx to reduce startup time.

## Direktori: `restored-src/src/commands/cost`

- **`cost.ts`**: Mengekspor: call.
- **`index.ts`**: Cost command - minimal metadata only. Implementation is lazy-loaded from cost.ts to reduce startup time.

## Direktori: `restored-src/src/commands/ctx_viz`

- **`index.js`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/debug-tool-call`

- **`index.js`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/desktop`

- **`desktop.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/diff`

- **`diff.tsx`**: Mengekspor: call.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/doctor`

- **`doctor.tsx`**: Mengekspor: call.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/effort`

- **`effort.tsx`**: Mengekspor: showCurrentEffort, executeEffort.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/env`

- **`index.js`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/exit`

- **`exit.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/export`

- **`export.tsx`**: Mengekspor: extractFirstPrompt, sanitizeFilename.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/extra-usage`

- **`extra-usage-core.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`extra-usage-noninteractive.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`extra-usage.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`index.ts`**: Mengekspor: extraUsage, extraUsageNonInteractive.

## Direktori: `restored-src/src/commands/fast`

- **`fast.tsx`**: Mengekspor: FastModePicker.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/feedback`

- **`feedback.tsx`**: Mengekspor: renderFeedbackComponent.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/files`

- **`files.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/good-claude`

- **`index.js`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/heapdump`

- **`heapdump.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/help`

- **`help.tsx`**: Mengekspor: call.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/hooks`

- **`hooks.tsx`**: Mengekspor: call.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/ide`

- **`ide.tsx`**: Mengekspor: formatWorkspaceFolders.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/install-github-app`

- **`ApiKeyStep.tsx`**: Mengekspor: ApiKeyStep.
- **`CheckExistingSecretStep.tsx`**: Mengekspor: CheckExistingSecretStep.
- **`CheckGitHubStep.tsx`**: Mengekspor: CheckGitHubStep.
- **`ChooseRepoStep.tsx`**: Mengekspor: ChooseRepoStep.
- **`CreatingStep.tsx`**: Mengekspor: CreatingStep.
- **`ErrorStep.tsx`**: Mengekspor: ErrorStep.
- **`ExistingWorkflowStep.tsx`**: Mengekspor: ExistingWorkflowStep.
- **`InstallAppStep.tsx`**: Mengekspor: InstallAppStep.
- **`OAuthFlowStep.tsx`**: Mengekspor: OAuthFlowStep.
- **`SuccessStep.tsx`**: Mengekspor: SuccessStep.
- **`WarningsStep.tsx`**: Mengekspor: WarningsStep.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`install-github-app.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`setupGitHubActions.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/install-slack-app`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`install-slack-app.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/issue`

- **`index.js`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/keybindings`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`keybindings.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/login`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`login.tsx`**: Mengekspor: Login.

## Direktori: `restored-src/src/commands/logout`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`logout.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/mcp`

- **`addCommand.ts`**: MCP add CLI subcommand  Extracted from main.tsx to enable direct testing.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`mcp.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`xaaIdpCommand.ts`**: `claude mcp xaa` — manage the XAA (SEP-990) IdP connection.  The IdP connection is user-level: configure once, all XAA-enabled MCP servers reuse it. L...

## Direktori: `restored-src/src/commands/memory`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`memory.tsx`**: Mengekspor: call.

## Direktori: `restored-src/src/commands/mobile`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`mobile.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/mock-limits`

- **`index.js`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/model`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`model.tsx`**: Mengekspor: call.

## Direktori: `restored-src/src/commands/oauth-refresh`

- **`index.js`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/onboarding`

- **`index.js`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/output-style`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`output-style.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/passes`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`passes.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/perf-issue`

- **`index.js`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/permissions`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`permissions.tsx`**: Mengekspor: call.

## Direktori: `restored-src/src/commands/plan`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`plan.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/plugin`

- **`AddMarketplace.tsx`**: Mengekspor: AddMarketplace.
- **`BrowseMarketplace.tsx`**: Mengekspor: BrowseMarketplace.
- **`DiscoverPlugins.tsx`**: Mengekspor: DiscoverPlugins.
- **`ManageMarketplaces.tsx`**: Mengekspor: ManageMarketplaces.
- **`ManagePlugins.tsx`**: Mengekspor: filterManagedDisabledPlugins, ManagePlugins.
- **`PluginErrors.tsx`**: Mengekspor: formatErrorMessage, getErrorGuidance.
- **`PluginOptionsDialog.tsx`**: Build the onSave payload from collected string inputs.  Sensitive fields are never prepopulated in the text buffer (security), so by the time the user...
- **`PluginOptionsFlow.tsx`**: Post-install/post-enable config prompt.  Given a LoadedPlugin, checks both the top-level manifest.userConfig and the channel-specific userConfig. Walk...
- **`PluginSettings.tsx`**: Mengekspor: PluginSettings.
- **`PluginTrustWarning.tsx`**: Mengekspor: PluginTrustWarning.
- **`UnifiedInstalledCell.tsx`**: Mengekspor: UnifiedInstalledCell.
- **`ValidatePlugin.tsx`**: Mengekspor: ValidatePlugin.
- **`index.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`parseArgs.ts`**: Mengekspor: ParsedCommand, parsePluginArgs.
- **`plugin.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`pluginDetailsHelpers.tsx`**: Shared helper functions and types for plugin details views  Used by both DiscoverPlugins and BrowseMarketplace components.
- **`usePagination.ts`**: Mengekspor: usePagination.

## Direktori: `restored-src/src/commands/pr_comments`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/privacy-settings`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`privacy-settings.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/rate-limit-options`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`rate-limit-options.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/release-notes`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`release-notes.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/reload-plugins`

- **`index.ts`**: /reload-plugins — Layer-3 refresh. Applies pending plugin changes to the running session. Implementation lazy-loaded.
- **`reload-plugins.ts`**: Mengekspor: call.

## Direktori: `restored-src/src/commands/remote-env`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`remote-env.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/remote-setup`

- **`api.ts`**: Wraps a raw GitHub token so that its string representation is redacted. `String(token)`, template literals, `JSON.stringify(token)`, and any attached ...
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`remote-setup.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/rename`

- **`generateSessionName.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`rename.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/reset-limits`

- **`index.js`**: Mengekspor: resetLimits, resetLimitsNonInteractive.

## Direktori: `restored-src/src/commands/resume`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`resume.tsx`**: Mengekspor: filterResumableSessions, call.

## Direktori: `restored-src/src/commands/review`

- **`UltrareviewOverageDialog.tsx`**: Mengekspor: UltrareviewOverageDialog.
- **`reviewRemote.ts`**: Teleported /ultrareview execution. Creates a CCR session with the current repo, sends the review prompt as the initial message, and registers a Remote...
- **`ultrareviewCommand.tsx`**: Mengekspor: call.
- **`ultrareviewEnabled.ts`**: Runtime gate for /ultrareview. GB config's `enabled` field controls visibility — isEnabled() on the command filters it from getCommands() when false, ...

## Direktori: `restored-src/src/commands/rewind`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`rewind.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/sandbox-toggle`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`sandbox-toggle.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/session`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`session.tsx`**: Mengekspor: call.

## Direktori: `restored-src/src/commands/share`

- **`index.js`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/skills`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`skills.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/stats`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`stats.tsx`**: Mengekspor: call.

## Direktori: `restored-src/src/commands/status`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`status.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/stickers`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`stickers.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/summary`

- **`index.js`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/tag`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`tag.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/tasks`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`tasks.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/teleport`

- **`index.js`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/terminalSetup`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`terminalSetup.tsx`**: Mengekspor: getNativeCSIuTerminalDisplayName, shouldOfferTerminalSetup, isShiftEnterKeyBindingInstalled.

## Direktori: `restored-src/src/commands/theme`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`theme.tsx`**: Mengekspor: call.

## Direktori: `restored-src/src/commands/thinkback-play`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`thinkback-play.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/thinkback`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`thinkback.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/upgrade`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`upgrade.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/commands/usage`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`usage.tsx`**: Mengekspor: call.

## Direktori: `restored-src/src/commands/vim`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`vim.ts`**: Mengekspor: call.

## Direktori: `restored-src/src/commands/voice`

- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`voice.ts`**: Mengekspor: call.

## Direktori: `restored-src/src/components`

- **`AgentProgressLine.tsx`**: Mengekspor: AgentProgressLine.
- **`App.tsx`**: Top-level wrapper for interactive sessions. Provides FPS metrics, stats context, and app state to the component tree.
- **`ApproveApiKey.tsx`**: Mengekspor: ApproveApiKey.
- **`AutoModeOptInDialog.tsx`**: Mengekspor: AUTO_MODE_DESCRIPTION, AutoModeOptInDialog.
- **`AutoUpdater.tsx`**: Mengekspor: AutoUpdater.
- **`AutoUpdaterWrapper.tsx`**: Mengekspor: AutoUpdaterWrapper.
- **`AwsAuthStatusBox.tsx`**: Mengekspor: AwsAuthStatusBox.
- **`BaseTextInput.tsx`**: A base component for text inputs that handles rendering and basic input
- **`BashModeProgress.tsx`**: Mengekspor: BashModeProgress.
- **`BridgeDialog.tsx`**: Mengekspor: BridgeDialog.
- **`BypassPermissionsModeDialog.tsx`**: Mengekspor: BypassPermissionsModeDialog.
- **`ChannelDowngradeDialog.tsx`**: Dialog shown when switching from latest to stable channel. Allows user to choose whether to downgrade or stay on current version.
- **`ClaudeInChromeOnboarding.tsx`**: Mengekspor: ClaudeInChromeOnboarding.
- **`ClaudeMdExternalIncludesDialog.tsx`**: Mengekspor: ClaudeMdExternalIncludesDialog.
- **`ClickableImageRef.tsx`**: Renders an image reference like [Image #1] as a clickable link. When clicked, opens the stored image file in the default viewer.  Falls back to styled...
- **`CompactSummary.tsx`**: Mengekspor: CompactSummary.
- **`ConfigurableShortcutHint.tsx`**: The keybinding action (e.g., 'app:toggleTranscript')
- **`ConsoleOAuthFlow.tsx`**: Mengekspor: ConsoleOAuthFlow.
- **`ContextSuggestions.tsx`**: Mengekspor: ContextSuggestions.
- **`ContextVisualization.tsx`**: One-liner for the legend header showing what context-collapse has done. Returns null when nothing's summarized/staged so we don't add visual noise in ...
- **`CoordinatorAgentStatus.tsx`**: CoordinatorTaskPanel — Steerable list of background agents.  Renders below the prompt input footer whenever local_agent tasks exist. Visibility is dri...
- **`CostThresholdDialog.tsx`**: Mengekspor: CostThresholdDialog.
- **`CtrlOToExpand.tsx`**: Mengekspor: SubAgentProvider, CtrlOToExpand, ctrlOToExpand.
- **`DesktopHandoff.tsx`**: Mengekspor: getDownloadUrl, DesktopHandoff.
- **`DevBar.tsx`**: Mengekspor: DevBar.
- **`DevChannelsDialog.tsx`**: Mengekspor: DevChannelsDialog.
- **`DiagnosticsDisplay.tsx`**: Mengekspor: DiagnosticsDisplay.
- **`EffortCallout.tsx`**: Mengekspor: EffortCallout, shouldShowEffortCallout.
- **`EffortIndicator.ts`**: Build the text for the effort-changed notification, e.g. "◐ medium · /effort". Returns undefined if the model doesn't support effort.
- **`ExitFlow.tsx`**: Mengekspor: ExitFlow.
- **`ExportDialog.tsx`**: Mengekspor: ExportDialog.
- **`FallbackToolUseErrorMessage.tsx`**: Mengekspor: FallbackToolUseErrorMessage.
- **`FallbackToolUseRejectedMessage.tsx`**: Mengekspor: FallbackToolUseRejectedMessage.
- **`FastIcon.tsx`**: Mengekspor: FastIcon, getFastIconString.
- **`Feedback.tsx`**: Mengekspor: redactSensitiveInfo, Feedback, createGitHubIssueUrl.
- **`FileEditToolDiff.tsx`**: Mengekspor: FileEditToolDiff.
- **`FileEditToolUpdatedMessage.tsx`**: Mengekspor: FileEditToolUpdatedMessage.
- **`FileEditToolUseRejectedMessage.tsx`**: Mengekspor: FileEditToolUseRejectedMessage.
- **`FilePathLink.tsx`**: The absolute file path
- **`FullscreenLayout.tsx`**: Rows of transcript context kept visible above the modal pane's ▔ divider.
- **`GlobalSearchDialog.tsx`**: Mengekspor: GlobalSearchDialog, parseRipgrepLine.
- **`HighlightedCode.tsx`**: Mengekspor: HighlightedCode.
- **`HistorySearchDialog.tsx`**: Mengekspor: HistorySearchDialog.
- **`IdeAutoConnectDialog.tsx`**: Mengekspor: IdeAutoConnectDialog, shouldShowAutoConnectDialog, IdeDisableAutoConnectDialog.
- **`IdeOnboardingDialog.tsx`**: Mengekspor: IdeOnboardingDialog, hasIdeOnboardingDialogBeenShown.
- **`IdeStatusIndicator.tsx`**: Mengekspor: IdeStatusIndicator.
- **`IdleReturnDialog.tsx`**: Mengekspor: IdleReturnDialog.
- **`InterruptedByUser.tsx`**: Mengekspor: InterruptedByUser.
- **`InvalidConfigDialog.tsx`**: Dialog shown when the Claude config file contains invalid JSON
- **`InvalidSettingsDialog.tsx`**: Dialog shown when settings files have validation errors. User must choose to continue (skipping invalid files) or exit to fix them.
- **`KeybindingWarnings.tsx`**: Displays keybinding validation warnings in the UI. Similar to McpParsingWarnings, this provides persistent visibility of configuration issues.  Only s...
- **`LanguagePicker.tsx`**: Mengekspor: LanguagePicker.
- **`LogSelector.tsx`**: Mengekspor: LogSelectorProps, LogSelector.
- **`MCPServerApprovalDialog.tsx`**: Mengekspor: MCPServerApprovalDialog.
- **`MCPServerDesktopImportDialog.tsx`**: Mengekspor: MCPServerDesktopImportDialog.
- **`MCPServerDialogCopy.tsx`**: Mengekspor: MCPServerDialogCopy.
- **`MCPServerMultiselectDialog.tsx`**: Mengekspor: MCPServerMultiselectDialog.
- **`Markdown.tsx`**: When true, render all text content as dim
- **`MarkdownTable.tsx`**: Accounts for parent indentation (e.g. message dot prefix) and terminal resize races. Without enough margin the table overflows its layout box and Ink'...
- **`MemoryUsageIndicator.tsx`**: Mengekspor: MemoryUsageIndicator.
- **`Message.tsx`**: Mengekspor: Props, hasThinkingContent, areMessagePropsEqual.
- **`MessageModel.tsx`**: Mengekspor: MessageModel.
- **`MessageResponse.tsx`**: Mengekspor: MessageResponse.
- **`MessageRow.tsx`**: Whether the previous message in renderableMessages is also a user message.
- **`MessageSelector.tsx`**: Mengekspor: MessageSelector, selectableUserMessagesFilter, messagesAfterAreOnlySynthetic.
- **`MessageTimestamp.tsx`**: Mengekspor: MessageTimestamp.
- **`Messages.tsx`**: Mengekspor: filterForBriefTool, dropTextInBriefTurns, SliceAnchor.
- **`ModelPicker.tsx`**: Overrides the dim header line below "Select model".
- **`NativeAutoUpdater.tsx`**: Categorize error messages for analytics
- **`NotebookEditToolUseRejectedMessage.tsx`**: Mengekspor: NotebookEditToolUseRejectedMessage.
- **`OffscreenFreeze.tsx`**: Freezes children when they scroll above the terminal viewport (into scrollback).  Any content change above the viewport forces log-update.ts into a fu...
- **`Onboarding.tsx`**: Mengekspor: Onboarding, SkippableStep.
- **`OutputStylePicker.tsx`**: Mengekspor: OutputStylePickerProps, OutputStylePicker.
- **`PackageManagerAutoUpdater.tsx`**: Mengekspor: PackageManagerAutoUpdater.
- **`PrBadge.tsx`**: Mengekspor: PrBadge.
- **`PressEnterToContinue.tsx`**: Mengekspor: PressEnterToContinue.
- **`QuickOpenDialog.tsx`**: Quick Open dialog (ctrl+shift+p / cmd+shift+p). Fuzzy file finder with a syntax-highlighted preview of the focused file.
- **`RemoteCallout.tsx`**: Mengekspor: RemoteCallout, shouldShowRemoteCallout.
- **`RemoteEnvironmentDialog.tsx`**: Mengekspor: RemoteEnvironmentDialog.
- **`ResumeTask.tsx`**: Mengekspor: ResumeTask.
- **`SandboxViolationExpandedView.tsx`**: Format a timestamp as "h:mm:ssa" (e.g., "1:30:45pm"). Replaces date-fns format() to avoid pulling in a 39MB dependency for one call.
- **`ScrollKeybindingHandler.tsx`**: Called after every scroll action with the resulting sticky state and the handle (for reading scrollTop/scrollHeight post-scroll).
- **`SearchBox.tsx`**: Mengekspor: SearchBox.
- **`SentryErrorBoundary.ts`**: Mengekspor: SentryErrorBoundary.
- **`SessionBackgroundHint.tsx`**: Shows a hint when user presses Ctrl+B to background the current session. Uses double-press pattern: first press shows hint, second press within 800ms ...
- **`SessionPreview.tsx`**: Mengekspor: SessionPreview.
- **`ShowInIDEPrompt.tsx`**: Mengekspor: ShowInIDEPrompt.
- **`SkillImprovementSurvey.tsx`**: Mengekspor: SkillImprovementSurvey.
- **`Spinner.tsx`**: Mengekspor: SpinnerWithVerb, BriefIdleStatus, Spinner.
- **`Stats.tsx`**: Mengekspor: Stats.
- **`StatusLine.tsx`**: Mengekspor: statusLineShouldDisplay, getLastAssistantMessageId, StatusLine.
- **`StatusNotices.tsx`**: StatusNotices contains the information displayed to users at startup. We have moved neutral or positive status to src/components/Status.tsx instead, w...
- **`StructuredDiff.tsx`**: Mengekspor: StructuredDiff.
- **`StructuredDiffList.tsx`**: Renders a list of diff hunks with ellipsis separators between them.
- **`TagTabs.tsx`**: Calculate the display width of a tab
- **`TaskListV2.tsx`**: Mengekspor: TaskListV2.
- **`TeammateViewHeader.tsx`**: Header shown when viewing a teammate's transcript. Displays teammate name (colored), task description, and exit hint.
- **`TeleportError.tsx`**: Mengekspor: TeleportLocalErrorType, TeleportError.
- **`TeleportProgress.tsx`**: Mengekspor: TeleportProgress.
- **`TeleportRepoMismatchDialog.tsx`**: Mengekspor: TeleportRepoMismatchDialog.
- **`TeleportResumeWrapper.tsx`**: Wrapper component that manages the full teleport resume flow, including session selection, loading state, and error handling
- **`TeleportStash.tsx`**: Mengekspor: TeleportStash.
- **`TextInput.tsx`**: Mengekspor: Props.
- **`ThemePicker.tsx`**: Skip exit handling when running in a context that already has it (e.g., onboarding)
- **`ThinkingToggle.tsx`**: Mengekspor: Props, ThinkingToggle.
- **`TokenWarning.tsx`**: Live collapse progress: "x / y summarized". Sub-component so useSyncExternalStore can subscribe to store mutations unconditionally (hooks-in-condition...
- **`ToolUseLoader.tsx`**: Mengekspor: ToolUseLoader.
- **`ValidationErrorsList.tsx`**: Builds a nested tree structure from dot-notation paths Uses lodash setWith to avoid automatic array creation
- **`VimTextInput.tsx`**: Mengekspor: Props.
- **`VirtualMessageList.tsx`**: Mengekspor: StickyPrompt, JumpHandle, VirtualMessageList.
- **`WorkflowMultiselectDialog.tsx`**: Mengekspor: WorkflowMultiselectDialog.
- **`WorktreeExitDialog.tsx`**: Mengekspor: WorktreeExitDialog.
- **`messageActions.tsx`**: Mengekspor: NavigableType, NavigableOf, NavigableMessage.

## Direktori: `restored-src/src/components/ClaudeCodeHint`

- **`PluginHintMenu.tsx`**: Mengekspor: PluginHintMenu.

## Direktori: `restored-src/src/components/CustomSelect`

- **`SelectMulti.tsx`**: Text for the submit button. When provided, a submit button is shown and Enter toggles selection (submit only fires when the button is focused). When o...
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`option-map.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`select-input-option.tsx`**: Mengekspor: SelectInputOption.
- **`select-option.tsx`**: Determines if option is focused.
- **`select.tsx`**: Mengekspor: OptionWithDescription, SelectProps, Select.
- **`use-multi-select-state.ts`**: When disabled, user input is ignored.  @default false
- **`use-select-input.ts`**: When disabled, user input is ignored.  @default false
- **`use-select-navigation.ts`**: Map where key is option's value and value is option's index.
- **`use-select-state.ts`**: Number of items to display.  @default 5

## Direktori: `restored-src/src/components/DesktopUpsell`

- **`DesktopUpsellStartup.tsx`**: Mengekspor: getDesktopUpsellConfig, shouldShowDesktopUpsellStartup, DesktopUpsellStartup.

## Direktori: `restored-src/src/components/FeedbackSurvey`

- **`FeedbackSurvey.tsx`**: Mengekspor: FeedbackSurvey.
- **`FeedbackSurveyView.tsx`**: Mengekspor: isValidResponseInput, FeedbackSurveyView.
- **`TranscriptSharePrompt.tsx`**: Mengekspor: TranscriptShareResponse, TranscriptSharePrompt.
- **`submitTranscriptShare.ts`**: Mengekspor: TranscriptShareTrigger.
- **`useDebouncedDigitInput.ts`**: Detects when the user types a single valid digit into the prompt input, debounces to avoid accidental submissions (e.g., "1. First item"), trims the d...
- **`useFeedbackSurvey.tsx`**: Mengekspor: useFeedbackSurvey.
- **`useMemorySurvey.tsx`**: Mengekspor: useMemorySurvey.
- **`usePostCompactSurvey.tsx`**: Mengekspor: usePostCompactSurvey.
- **`useSurveyState.tsx`**: Mengekspor: useSurveyState.

## Direktori: `restored-src/src/components/HelpV2`

- **`Commands.tsx`**: Mengekspor: Commands.
- **`General.tsx`**: Mengekspor: General.
- **`HelpV2.tsx`**: Mengekspor: HelpV2.

## Direktori: `restored-src/src/components/HighlightedCode`

- **`Fallback.tsx`**: Mengekspor: HighlightedCodeFallback.

## Direktori: `restored-src/src/components/LogoV2`

- **`AnimatedAsterisk.tsx`**: Mengekspor: AnimatedAsterisk.
- **`AnimatedClawd.tsx`**: Hold a pose for n frames (60ms each).
- **`ChannelsNotice.tsx`**: Mengekspor: ChannelsNotice.
- **`Clawd.tsx`**: row 1 left (no bg): optional raised arm + side
- **`CondensedLogo.tsx`**: Mengekspor: CondensedLogo.
- **`EmergencyTip.tsx`**: Mengekspor: EmergencyTip.
- **`Feed.tsx`**: Mengekspor: FeedLine, FeedConfig, calculateFeedWidth.
- **`FeedColumn.tsx`**: Mengekspor: FeedColumn.
- **`GuestPassesUpsell.tsx`**: Mengekspor: useShowGuestPassesUpsell, incrementGuestPassesSeenCount, GuestPassesUpsell.
- **`LogoV2.tsx`**: Mengekspor: LogoV2.
- **`Opus1mMergeNotice.tsx`**: Mengekspor: shouldShowOpus1mMergeNotice, Opus1mMergeNotice.
- **`OverageCreditUpsell.tsx`**: Whether to show the overage credit upsell on any surface.  Eligibility comes entirely from the backend GET /overage_credit_grant response — the CLI do...
- **`VoiceModeNotice.tsx`**: Mengekspor: VoiceModeNotice.
- **`WelcomeV2.tsx`**: Mengekspor: WelcomeV2.
- **`feedConfigs.tsx`**: Mengekspor: createRecentActivityFeed, createWhatsNewFeed, createProjectOnboardingFeed.

## Direktori: `restored-src/src/components/LspRecommendation`

- **`LspRecommendationMenu.tsx`**: Mengekspor: LspRecommendationMenu.

## Direktori: `restored-src/src/components/ManagedSettingsSecurityDialog`

- **`ManagedSettingsSecurityDialog.tsx`**: Mengekspor: ManagedSettingsSecurityDialog.
- **`utils.ts`**: Extract dangerous settings from a settings object.  Dangerous env vars are determined by checking against SAFE_ENV_VARS - any env var NOT in SAFE_ENV_...

## Direktori: `restored-src/src/components/Passes`

- **`Passes.tsx`**: Mengekspor: Passes.

## Direktori: `restored-src/src/components/PromptInput`

- **`HistorySearchInput.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`IssueFlagBanner.tsx`**: ANT-ONLY: Banner shown in the transcript that prompts users to report issues via /issue. Appears when friction is detected in the conversation.
- **`Notifications.tsx`**: Mengekspor: FOOTER_TEMPORARY_STATUS_TIMEOUT, Notifications.
- **`PromptInput.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`PromptInputFooter.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`PromptInputFooterLeftSide.tsx`**: Mengekspor: PromptInputFooterLeftSide.
- **`PromptInputFooterSuggestions.tsx`**: Get the icon for a suggestion based on its type Icons: + for files, ◇ for MCP resources,  for agents
- **`PromptInputHelpMenu.tsx`**: Format a shortcut for display in the help menu (e.g., "ctrl+o" → "ctrl + o")
- **`PromptInputModeIndicator.tsx`**: Gets the theme color key for the teammate's assigned color. Returns undefined if not a teammate or if the color is invalid.
- **`PromptInputQueuedCommands.tsx`**: Check if a command value is an idle notification that should be hidden. Idle notifications are processed silently without showing to the user.
- **`PromptInputStashNotice.tsx`**: Mengekspor: PromptInputStashNotice.
- **`SandboxPromptFooterHint.tsx`**: Mengekspor: SandboxPromptFooterHint.
- **`ShimmeredInput.tsx`**: Mengekspor: HighlightedInput.
- **`VoiceIndicator.tsx`**: Mengekspor: VoiceIndicator, VoiceWarmupHint.
- **`inputModes.ts`**: Mengekspor: prependModeCharacterToInput, getModeFromInput, getValueFromInput.
- **`inputPaste.ts`**: Determines whether the input text should be truncated. If so, it adds a truncated text placeholder and neturns  @param text The input text @param next...
- **`useMaybeTruncateInput.ts`**: Mengekspor: useMaybeTruncateInput.
- **`usePromptInputPlaceholder.ts`**: Mengekspor: usePromptInputPlaceholder.
- **`useShowFastIconHint.ts`**: Hook to manage the /fast hint display next to the fast icon. Shows the hint for 5 seconds once per session.
- **`useSwarmBanner.ts`**: Mengekspor: useSwarmBanner.
- **`utils.ts`**: Helper function to check if vim mode is currently enabled @returns boolean indicating if vim mode is active

## Direktori: `restored-src/src/components/Settings`

- **`Config.tsx`**: Mengekspor: Config.
- **`Settings.tsx`**: Mengekspor: Settings.
- **`Status.tsx`**: Mengekspor: Status.
- **`Usage.tsx`**: Mengekspor: Usage.

## Direktori: `restored-src/src/components/Spinner`

- **`FlashingChar.tsx`**: Mengekspor: FlashingChar.
- **`GlimmerMessage.tsx`**: Mengekspor: GlimmerMessage.
- **`ShimmerChar.tsx`**: Mengekspor: ShimmerChar.
- **`SpinnerAnimationRow.tsx`**: Mengekspor: SpinnerAnimationRowProps, SpinnerAnimationRow.
- **`SpinnerGlyph.tsx`**: Mengekspor: SpinnerGlyph.
- **`TeammateSpinnerLine.tsx`**: Extract the last 3 lines of content from a teammate's conversation. Shows recent activity from any message type (user or assistant).
- **`TeammateSpinnerTree.tsx`**: Leader's active verb (when leader is actively processing)
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`teammateSelectHint.ts`**: Mengekspor: TEAMMATE_SELECT_HINT.
- **`useShimmerAnimation.ts`**: Mengekspor: useShimmerAnimation.
- **`useStalledAnimation.ts`**: Mengekspor: useStalledAnimation.
- **`utils.ts`**: Mengekspor: getDefaultCharacters, interpolateColor, toRGBColor.

## Direktori: `restored-src/src/components/StructuredDiff`

- **`Fallback.tsx`**: / StructuredDiffFallback Component: Word-Level Diff Highlighting Example  This component shows diff changes with word-level highlighting. Here's a wal...
- **`colorDiff.ts`**: Returns a static reason why the color-diff module is unavailable, or null if available. 'env' = disabled via CLAUDE_CODE_SYNTAX_HIGHLIGHT  The TS port...

## Direktori: `restored-src/src/components/TrustDialog`

- **`TrustDialog.tsx`**: Mengekspor: TrustDialog.
- **`utils.ts`**: Mengekspor: getHooksSources, getBashPermissionSources, formatListWithAnd.

## Direktori: `restored-src/src/components/agents`

- **`AgentDetail.tsx`**: Mengekspor: AgentDetail.
- **`AgentEditor.tsx`**: Mengekspor: AgentEditor.
- **`AgentNavigationFooter.tsx`**: Mengekspor: AgentNavigationFooter.
- **`AgentsList.tsx`**: Mengekspor: AgentsList.
- **`AgentsMenu.tsx`**: Mengekspor: AgentsMenu.
- **`ColorPicker.tsx`**: Mengekspor: ColorPicker.
- **`ModelSelector.tsx`**: Mengekspor: ModelSelector.
- **`ToolSelector.tsx`**: Mengekspor: ToolSelector.
- **`agentFileUtils.ts`**: Formats agent data as markdown file content
- **`generateAgent.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`types.ts`**: Mengekspor: AGENT_PATHS, ModeState, AgentValidationResult.
- **`utils.ts`**: Mengekspor: getAgentSourceDisplayName.
- **`validateAgent.ts`**: Mengekspor: AgentValidationResult, validateAgentType, validateAgent.

## Direktori: `restored-src/src/components/agents/new-agent-creation`

- **`CreateAgentWizard.tsx`**: Mengekspor: CreateAgentWizard.

## Direktori: `restored-src/src/components/agents/new-agent-creation/wizard-steps`

- **`ColorStep.tsx`**: Mengekspor: ColorStep.
- **`ConfirmStep.tsx`**: Mengekspor: ConfirmStep.
- **`ConfirmStepWrapper.tsx`**: Mengekspor: ConfirmStepWrapper.
- **`DescriptionStep.tsx`**: Mengekspor: DescriptionStep.
- **`GenerateStep.tsx`**: Mengekspor: GenerateStep.
- **`LocationStep.tsx`**: Mengekspor: LocationStep.
- **`MemoryStep.tsx`**: Mengekspor: MemoryStep.
- **`MethodStep.tsx`**: Mengekspor: MethodStep.
- **`ModelStep.tsx`**: Mengekspor: ModelStep.
- **`PromptStep.tsx`**: Mengekspor: PromptStep.
- **`ToolsStep.tsx`**: Mengekspor: ToolsStep.
- **`TypeStep.tsx`**: Mengekspor: TypeStep.

## Direktori: `restored-src/src/components/design-system`

- **`Byline.tsx`**: The items to join with a middot separator
- **`Dialog.tsx`**: Custom input guide content. Receives exitState for Ctrl+C/D pending display.
- **`Divider.tsx`**: Width of the divider in characters. Defaults to terminal width.
- **`FuzzyPicker.tsx`**: Hint label shown in the byline, e.g. "mention" → "Tab to mention".
- **`KeyboardShortcutHint.tsx`**: The key or chord to display (e.g., "ctrl+o", "Enter", "↑/↓")
- **`ListItem.tsx`**: Whether this item is currently focused (keyboard selection). Shows the pointer indicator (❯) when true.
- **`LoadingState.tsx`**: The loading message to display next to the spinner.
- **`Pane.tsx`**: Theme color for the top border line.
- **`ProgressBar.tsx`**: How much progress to display, between 0 and 1 inclusive
- **`Ratchet.tsx`**: Mengekspor: Ratchet.
- **`StatusIcon.tsx`**: The status to display. Determines both the icon and color.  - `success`: Green checkmark (✓) - `error`: Red cross (✗) - `warning`: Yellow warning symb...
- **`Tabs.tsx`**: Controlled mode: current selected tab id/title
- **`ThemeProvider.tsx`**: The saved user preference. May be 'auto'.
- **`ThemedBox.tsx`**: Mengekspor: Props.
- **`ThemedText.tsx`**: Colors uncolored ThemedText in the subtree. Precedence: explicit `color` > this > dimColor. Crosses Box boundaries (Ink's style cascade doesn't).
- **`color.ts`**: Curried theme-aware color function. Resolves theme keys to raw color values before delegating to the ink renderer's colorize.

## Direktori: `restored-src/src/components/diff`

- **`DiffDetailView.tsx`**: Displays the diff content for a single file. Uses StructuredDiff for word-level diffing and syntax highlighting. No scrolling - renders all lines (max...
- **`DiffDialog.tsx`**: Mengekspor: DiffDialog.
- **`DiffFileList.tsx`**: Mengekspor: DiffFileList.

## Direktori: `restored-src/src/components/grove`

- **`Grove.tsx`**: Mengekspor: GroveDecision, GroveDialog, PrivacySettingsDialog.

## Direktori: `restored-src/src/components/hooks`

- **`HooksConfigMenu.tsx`**: HooksConfigMenu is a read-only browser for configured hooks.  Users can drill into each hook event, see configured matchers and hooks (of any type: co...
- **`PromptDialog.tsx`**: Mengekspor: PromptDialog.
- **`SelectEventMode.tsx`**: SelectEventMode is the entrypoint of the Hooks config menu, where the user sees the list of available hook events.  The /hooks menu is read-only: sele...
- **`SelectHookMode.tsx`**: SelectHookMode shows all hooks configured for a given event+matcher pair.  The /hooks menu is read-only: this view no longer offers "add new hook" and...
- **`SelectMatcherMode.tsx`**: SelectMatcherMode shows the configured matchers for a selected hook event.  The /hooks menu is read-only: this view no longer offers "add new matcher"...
- **`ViewHookMode.tsx`**: ViewHookMode shows read-only details for a single configured hook.  The /hooks menu is read-only; this view replaces the former delete-hook confirmati...

## Direktori: `restored-src/src/components/mcp`

- **`CapabilitiesSection.tsx`**: Mengekspor: CapabilitiesSection.
- **`ElicitationDialog.tsx`**: Called when the phase 2 waiting state is dismissed (URL elicitations only).
- **`MCPAgentServerMenu.tsx`**: Menu for agent-specific MCP servers. These servers are defined in agent frontmatter and only connect when the agent runs. For HTTP/SSE servers, this a...
- **`MCPListPanel.tsx`**: Mengekspor: MCPListPanel.
- **`MCPReconnect.tsx`**: Mengekspor: MCPReconnect.
- **`MCPRemoteServerMenu.tsx`**: Mengekspor: MCPRemoteServerMenu.
- **`MCPSettings.tsx`**: Mengekspor: MCPSettings.
- **`MCPStdioServerMenu.tsx`**: Mengekspor: MCPStdioServerMenu.
- **`MCPToolDetailView.tsx`**: Mengekspor: MCPToolDetailView.
- **`MCPToolListView.tsx`**: Mengekspor: MCPToolListView.
- **`McpParsingWarnings.tsx`**: Mengekspor: McpParsingWarnings.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/components/mcp/utils`

- **`reconnectHelpers.tsx`**: Handles the result of a reconnect attempt and returns an appropriate user message

## Direktori: `restored-src/src/components/memory`

- **`MemoryFileSelector.tsx`**: Mengekspor: MemoryFileSelector.
- **`MemoryUpdateNotification.tsx`**: Mengekspor: getRelativeMemoryPath, MemoryUpdateNotification.

## Direktori: `restored-src/src/components/messages`

- **`AdvisorMessage.tsx`**: Mengekspor: AdvisorMessage.
- **`AssistantRedactedThinkingMessage.tsx`**: Mengekspor: AssistantRedactedThinkingMessage.
- **`AssistantTextMessage.tsx`**: Mengekspor: AssistantTextMessage.
- **`AssistantThinkingMessage.tsx`**: When true, hide this thinking block entirely (used for past thinking in transcript mode)
- **`AssistantToolUseMessage.tsx`**: Mengekspor: AssistantToolUseMessage.
- **`AttachmentMessage.tsx`**: Mengekspor: AttachmentMessage.
- **`CollapsedReadSearchContent.tsx`**: Mengekspor: CollapsedReadSearchContent.
- **`CompactBoundaryMessage.tsx`**: Mengekspor: CompactBoundaryMessage.
- **`GroupedToolUseContent.tsx`**: Mengekspor: GroupedToolUseContent.
- **`HighlightedThinkingText.tsx`**: Mengekspor: HighlightedThinkingText.
- **`HookProgressMessage.tsx`**: Mengekspor: HookProgressMessage.
- **`PlanApprovalMessage.tsx`**: Renders a plan approval request with a planMode-colored border, showing the plan content and instructions for approving/rejecting.
- **`RateLimitMessage.tsx`**: Mengekspor: getUpsellMessage, RateLimitMessage.
- **`ShutdownMessage.tsx`**: Renders a shutdown request with a warning-colored border.
- **`SystemAPIErrorMessage.tsx`**: Mengekspor: SystemAPIErrorMessage.
- **`SystemTextMessage.tsx`**: Mengekspor: SystemTextMessage.
- **`TaskAssignmentMessage.tsx`**: Renders a task assignment with a cyan border (team-related color).
- **`UserAgentNotificationMessage.tsx`**: Mengekspor: UserAgentNotificationMessage.
- **`UserBashInputMessage.tsx`**: Mengekspor: UserBashInputMessage.
- **`UserBashOutputMessage.tsx`**: Mengekspor: UserBashOutputMessage.
- **`UserChannelMessage.tsx`**: Mengekspor: UserChannelMessage.
- **`UserCommandMessage.tsx`**: Mengekspor: UserCommandMessage.
- **`UserImageMessage.tsx`**: Renders an image attachment in user messages. Shows as a clickable link if the image is stored and terminal supports hyperlinks. Uses MessageResponse ...
- **`UserLocalCommandOutputMessage.tsx`**: Mengekspor: UserLocalCommandOutputMessage.
- **`UserMemoryInputMessage.tsx`**: Mengekspor: UserMemoryInputMessage.
- **`UserPlanMessage.tsx`**: Mengekspor: UserPlanMessage.
- **`UserPromptMessage.tsx`**: Mengekspor: UserPromptMessage.
- **`UserResourceUpdateMessage.tsx`**: URI for resource updates, tool name for polling updates
- **`UserTeammateMessage.tsx`**: Parse all teammate messages from XML format: <teammate-message teammate_id="alice" color="red" summary="Brief update">message content</teammate-messag...
- **`UserTextMessage.tsx`**: Mengekspor: UserTextMessage.
- **`nullRenderingAttachments.ts`**: Attachment types that AttachmentMessage renders as `null` unconditionally (no visible output regardless of runtime state). Messages.tsx filters these ...
- **`teamMemCollapsed.tsx`**: Plain function (not a React component) so the React Compiler won't hoist the teamMemory property accesses for memoization. This module is only loaded ...
- **`teamMemSaved.ts`**: Returns the team-memory segment for the memory-saved UI, plus the count so the caller can derive the private count without accessing teamCount itself....

## Direktori: `restored-src/src/components/messages/UserToolResultMessage`

- **`RejectedPlanMessage.tsx`**: Mengekspor: RejectedPlanMessage.
- **`RejectedToolUseMessage.tsx`**: Mengekspor: RejectedToolUseMessage.
- **`UserToolCanceledMessage.tsx`**: Mengekspor: UserToolCanceledMessage.
- **`UserToolErrorMessage.tsx`**: Mengekspor: UserToolErrorMessage.
- **`UserToolRejectMessage.tsx`**: Mengekspor: UserToolRejectMessage.
- **`UserToolResultMessage.tsx`**: Mengekspor: UserToolResultMessage.
- **`UserToolSuccessMessage.tsx`**: Mengekspor: UserToolSuccessMessage.
- **`utils.tsx`**: Mengekspor: useGetToolFromMessages.

## Direktori: `restored-src/src/components/permissions/AskUserQuestionPermissionRequest`

- **`AskUserQuestionPermissionRequest.tsx`**: Mengekspor: AskUserQuestionPermissionRequest.
- **`PreviewBox.tsx`**: The preview content to display. Markdown is rendered with syntax highlighting for code blocks (```ts, ```py, etc.). Also supports plain multi-line tex...
- **`PreviewQuestionView.tsx`**: Mengekspor: PreviewQuestionView.
- **`QuestionNavigationBar.tsx`**: Mengekspor: QuestionNavigationBar.
- **`QuestionView.tsx`**: Mengekspor: QuestionView.
- **`SubmitQuestionsView.tsx`**: Mengekspor: SubmitQuestionsView.
- **`use-multiple-choice-state.ts`**: Mengekspor: AnswerValue, QuestionState, MultipleChoiceState.

## Direktori: `restored-src/src/components/permissions/BashPermissionRequest`

- **`BashPermissionRequest.tsx`**: Mengekspor: BashPermissionRequest.
- **`bashToolUseOptions.tsx`**: Check if a description already exists in the allow list. Compares lowercase and trailing-whitespace-trimmed versions.

## Direktori: `restored-src/src/components/permissions/ComputerUseApproval`

- **`ComputerUseApproval.tsx`**: Two-panel dispatcher. When `request.tccState` is present, macOS permissions (Accessibility / Screen Recording) are missing and the app list is irrelev...

## Direktori: `restored-src/src/components/permissions/EnterPlanModePermissionRequest`

- **`EnterPlanModePermissionRequest.tsx`**: Mengekspor: EnterPlanModePermissionRequest.

## Direktori: `restored-src/src/components/permissions/ExitPlanModePermissionRequest`

- **`ExitPlanModePermissionRequest.tsx`**: Mengekspor: buildPermissionUpdates, autoNameSessionFromPlan, ExitPlanModePermissionRequest.

## Direktori: `restored-src/src/components/permissions`

- **`FallbackPermissionRequest.tsx`**: Mengekspor: FallbackPermissionRequest.
- **`PermissionDecisionDebugInfo.tsx`**: Mengekspor: PermissionDecisionDebugInfo.
- **`PermissionDialog.tsx`**: Mengekspor: PermissionDialog.
- **`PermissionExplanation.tsx`**: Mengekspor: usePermissionExplainerUI, PermissionExplainerContent.
- **`PermissionPrompt.tsx`**: Mengekspor: FeedbackType, PermissionPromptOption, ToolAnalyticsContext.
- **`PermissionRequest.tsx`**: Mengekspor: PermissionRequestProps, ToolUseConfirm, PermissionRequest.
- **`PermissionRequestTitle.tsx`**: Mengekspor: PermissionRequestTitle.
- **`PermissionRuleExplanation.tsx`**: When set, reasonString is plain text rendered with this theme color instead of <Ansi>.
- **`SandboxPermissionRequest.tsx`**: Mengekspor: SandboxPermissionRequestProps, SandboxPermissionRequest.
- **`WorkerBadge.tsx`**: Renders a colored badge showing the worker's name for permission prompts. Used to indicate which swarm worker is requesting the permission.
- **`WorkerPendingPermission.tsx`**: Visual indicator shown on workers while waiting for leader to approve a permission request. Displays the pending tool with a spinner and information a...
- **`hooks.ts`**: Mengekspor: UnaryEvent, usePermissionRequestLogging.
- **`shellPermissionHelpers.tsx`**: Mengekspor: generateShellSuggestionsLabel.
- **`useShellPermissionFeedback.ts`**: Shared feedback-mode state + handlers for shell permission dialogs (Bash, PowerShell). Encapsulates the yes/no input-mode toggle, feedback text state,...
- **`utils.ts`**: Mengekspor: logUnaryPermissionEvent.

## Direktori: `restored-src/src/components/permissions/FileEditPermissionRequest`

- **`FileEditPermissionRequest.tsx`**: Mengekspor: FileEditPermissionRequest.

## Direktori: `restored-src/src/components/permissions/FilePermissionDialog`

- **`FilePermissionDialog.tsx`**: Mengekspor: FilePermissionDialogProps, FilePermissionDialog.
- **`ideDiffConfig.ts`**: Mengekspor: FileEdit, IDEDiffConfig, IDEDiffChangeInput.
- **`permissionOptions.tsx`**: Check if a path is within the project's .claude/ folder. This is used to determine whether to show the special ".claude folder" permission option.
- **`useFilePermissionDialog.ts`**: Mengekspor: ToolInput, UseFilePermissionDialogProps, UseFilePermissionDialogResult.
- **`usePermissionHandler.ts`**: Mengekspor: PermissionHandlerParams, PermissionHandlerOptions, PERMISSION_HANDLERS.

## Direktori: `restored-src/src/components/permissions/FileWritePermissionRequest`

- **`FileWritePermissionRequest.tsx`**: Mengekspor: FileWritePermissionRequest.
- **`FileWriteToolDiff.tsx`**: Mengekspor: FileWriteToolDiff.

## Direktori: `restored-src/src/components/permissions/FilesystemPermissionRequest`

- **`FilesystemPermissionRequest.tsx`**: Mengekspor: FilesystemPermissionRequest.

## Direktori: `restored-src/src/components/permissions/NotebookEditPermissionRequest`

- **`NotebookEditPermissionRequest.tsx`**: Mengekspor: NotebookEditPermissionRequest.
- **`NotebookEditToolDiff.tsx`**: Mengekspor: NotebookEditToolDiff.

## Direktori: `restored-src/src/components/permissions/PowerShellPermissionRequest`

- **`PowerShellPermissionRequest.tsx`**: Mengekspor: PowerShellPermissionRequest.
- **`powershellToolUseOptions.tsx`**: Mengekspor: PowerShellToolUseOption, powershellToolUseOptions.

## Direktori: `restored-src/src/components/permissions/SedEditPermissionRequest`

- **`SedEditPermissionRequest.tsx`**: Mengekspor: SedEditPermissionRequest.

## Direktori: `restored-src/src/components/permissions/SkillPermissionRequest`

- **`SkillPermissionRequest.tsx`**: Mengekspor: SkillPermissionRequest.

## Direktori: `restored-src/src/components/permissions/WebFetchPermissionRequest`

- **`WebFetchPermissionRequest.tsx`**: Mengekspor: WebFetchPermissionRequest.

## Direktori: `restored-src/src/components/permissions/rules`

- **`AddPermissionRules.tsx`**: Mengekspor: optionForPermissionSaveDestination, AddPermissionRules.
- **`AddWorkspaceDirectory.tsx`**: Mengekspor: AddWorkspaceDirectory.
- **`PermissionRuleDescription.tsx`**: Mengekspor: PermissionRuleDescription.
- **`PermissionRuleInput.tsx`**: Mengekspor: PermissionRuleInputProps, PermissionRuleInput.
- **`PermissionRuleList.tsx`**: Mengekspor: PermissionRuleList.
- **`RecentDenialsTab.tsx`**: Called when approved/retry state changes so parent can act on exit
- **`RemoveWorkspaceDirectory.tsx`**: Mengekspor: RemoveWorkspaceDirectory.
- **`WorkspaceTab.tsx`**: Mengekspor: WorkspaceTab.

## Direktori: `restored-src/src/components/sandbox`

- **`SandboxConfigTab.tsx`**: Mengekspor: SandboxConfigTab.
- **`SandboxDependenciesTab.tsx`**: Mengekspor: SandboxDependenciesTab.
- **`SandboxDoctorSection.tsx`**: Mengekspor: SandboxDoctorSection.
- **`SandboxOverridesTab.tsx`**: Mengekspor: SandboxOverridesTab.
- **`SandboxSettings.tsx`**: Mengekspor: SandboxSettings.

## Direktori: `restored-src/src/components/shell`

- **`ExpandShellOutputContext.tsx`**: Context to indicate that shell output should be shown in full (not truncated). Used to auto-expand the most recent user `!` command output.  This foll...
- **`OutputLine.tsx`**: Mengekspor: tryFormatJson, tryJsonFormatContent, linkifyUrlsInText.
- **`ShellProgressMessage.tsx`**: Mengekspor: ShellProgressMessage.
- **`ShellTimeDisplay.tsx`**: Mengekspor: ShellTimeDisplay.

## Direktori: `restored-src/src/components/skills`

- **`SkillsMenu.tsx`**: Mengekspor: SkillsMenu.

## Direktori: `restored-src/src/components/tasks`

- **`AsyncAgentDetailDialog.tsx`**: Mengekspor: AsyncAgentDetailDialog.
- **`BackgroundTask.tsx`**: Mengekspor: BackgroundTask.
- **`BackgroundTaskStatus.tsx`**: Mengekspor: BackgroundTaskStatus.
- **`BackgroundTasksDialog.tsx`**: Mengekspor: BackgroundTasksDialog.
- **`DreamDetailDialog.tsx`**: Mengekspor: DreamDetailDialog.
- **`InProcessTeammateDetailDialog.tsx`**: Mengekspor: InProcessTeammateDetailDialog.
- **`RemoteSessionDetailDialog.tsx`**: Mengekspor: formatToolUseSummary, RemoteSessionDetailDialog.
- **`RemoteSessionProgress.tsx`**: Stage-appropriate counts line for a running review. Shared between the one-line pill (below) and RemoteSessionDetailDialog's reviewCountsLine so the t...
- **`ShellDetailDialog.tsx`**: Mengekspor: ShellDetailDialog.
- **`ShellProgress.tsx`**: Mengekspor: TaskStatusText, ShellProgress.
- **`renderToolActivity.tsx`**: Mengekspor: renderToolActivity.
- **`taskStatusUtils.tsx`**: Shared utilities for displaying task status across different task types.

## Direktori: `restored-src/src/components/teams`

- **`TeamStatus.tsx`**: Footer status indicator showing teammate count Similar to BackgroundTaskStatus but for teammates
- **`TeamsDialog.tsx`**: Mengekspor: TeamsDialog.

## Direktori: `restored-src/src/components/ui`

- **`OrderedList.tsx`**: Mengekspor: OrderedList.
- **`OrderedListItem.tsx`**: Mengekspor: OrderedListItemContext, OrderedListItem.
- **`TreeSelect.tsx`**: Tree nodes to display.

## Direktori: `restored-src/src/components/wizard`

- **`WizardDialogLayout.tsx`**: Mengekspor: WizardDialogLayout.
- **`WizardNavigationFooter.tsx`**: Mengekspor: WizardNavigationFooter.
- **`WizardProvider.tsx`**: Mengekspor: WizardContext, WizardProvider.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`useWizard.ts`**: Mengekspor: useWizard.

## Direktori: `restored-src/src/constants`

- **`apiLimits.ts`**: Anthropic API Limits  These constants define server-side limits enforced by the Anthropic API. Keep this file dependency-free to prevent circular impo...
- **`betas.ts`**: Mengekspor: CLAUDE_CODE_20250219_BETA_HEADER, INTERLEAVED_THINKING_BETA_HEADER, CONTEXT_1M_BETA_HEADER.
- **`common.ts`**: Mengekspor: getLocalISODate, getSessionStartDate, getLocalMonthYear.
- **`cyberRiskInstruction.ts`**: CYBER_RISK_INSTRUCTION  This instruction provides guidance for Claude's behavior when handling security-related requests. It defines the boundary betw...
- **`errorIds.ts`**: Error IDs for tracking error sources in production. These IDs are obfuscated identifiers that help us trace which logError() call generated an error. ...
- **`figures.ts`**: Mengekspor: BLACK_CIRCLE, BULLET_OPERATOR, TEARDROP_ASTERISK.
- **`files.ts`**: Binary file extensions to skip for text-based operations. These files can't be meaningfully compared as text and are often large.
- **`github-app.ts`**: Mengekspor: PR_TITLE, GITHUB_ACTION_SETUP_DOCS_URL, WORKFLOW_CONTENT.
- **`keys.ts`**: Mengekspor: getGrowthBookClientKey.
- **`messages.ts`**: Mengekspor: NO_CONTENT_MESSAGE.
- **`oauth.ts`**: Mengekspor: fileSuffixForOauthConfig, CLAUDE_AI_INFERENCE_SCOPE, CLAUDE_AI_PROFILE_SCOPE.
- **`outputStyles.ts`**: If true, this output style will be automatically applied when the plugin is enabled. Only applicable to plugin output styles. When multiple plugins ha...
- **`product.ts`**: Determine if we're in a staging environment for remote sessions. Checks session ID format and ingress URL.
- **`prompts.ts`**: Mengekspor: CLAUDE_CODE_DOCS_MAP_URL, SYSTEM_PROMPT_DYNAMIC_BOUNDARY, prependBullets.
- **`spinnerVerbs.ts`**: Mengekspor: getSpinnerVerbs, SPINNER_VERBS.
- **`system.ts`**: All possible CLI sysprompt prefix values, used by splitSysPromptPrefix to identify prefix blocks by content rather than position.
- **`systemPromptSections.ts`**: Create a memoized system prompt section. Computed once, cached until /clear or /compact.
- **`toolLimits.ts`**: Constants related to tool result size limits
- **`tools.ts`**: Mengekspor: ALL_AGENT_DISALLOWED_TOOLS, CUSTOM_AGENT_DISALLOWED_TOOLS, ASYNC_AGENT_ALLOWED_TOOLS.
- **`turnCompletionVerbs.ts`**: Mengekspor: TURN_COMPLETION_VERBS.
- **`xml.ts`**: Mengekspor: COMMAND_NAME_TAG, COMMAND_MESSAGE_TAG, COMMAND_ARGS_TAG.

## Direktori: `restored-src/src/context`

- **`QueuedMessageContext.tsx`**: Width reduction for container padding (e.g., 4 for paddingX={2})
- **`fpsMetrics.tsx`**: Mengekspor: FpsMetricsProvider, useFpsMetrics.
- **`mailbox.tsx`**: Mengekspor: MailboxProvider, useMailbox.
- **`modalContext.tsx`**: Set by FullscreenLayout when rendering content in its `modal` slot — the absolute-positioned bottom-anchored pane for slash-command dialogs. Consumers...
- **`notifications.tsx`**: Keys of notifications that this notification invalidates. If a notification is invalidated, it will be removed from the queue and, if currently displa...
- **`overlayContext.tsx`**: Overlay tracking for Escape key coordination.  This solves the problem of escape key handling when overlays (like Select with onCancel) are open. The ...
- **`promptOverlayContext.tsx`**: Portal for content that floats above the prompt so it escapes FullscreenLayout's bottom-slot `overflowY:hidden` clip.  The clip is load-bearing (CC-66...
- **`stats.tsx`**: Mengekspor: StatsStore, createStatsStore, StatsContext.
- **`voice.tsx`**: Mengekspor: VoiceState, VoiceProvider, useVoiceState.

## Direktori: `restored-src/src/coordinator`

- **`coordinatorMode.ts`**: Mengekspor: isCoordinatorMode, matchSessionMode, getCoordinatorUserContext.

## Direktori: `restored-src/src/entrypoints`

- **`agentSdkTypes.ts`**: Main entrypoint for Claude Code Agent SDK types.  This file re-exports the public SDK API from: - sdk/coreTypes.ts - Common serializable types (messag...
- **`cli.tsx`**: Bootstrap entrypoint - checks for special flags before loading the full CLI. All imports are dynamic to minimize module evaluation for fast paths.
- **`init.ts`**: Mengekspor: init, initializeTelemetryAfterTrust.
- **`mcp.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`sandboxTypes.ts`**: Sandbox types for the Claude Code Agent SDK  This file is the single source of truth for sandbox configuration types. Both the SDK and the settings va...

## Direktori: `restored-src/src/entrypoints/sdk`

- **`controlSchemas.ts`**: SDK Control Schemas - Zod schemas for the control protocol.  These schemas define the control protocol between SDK implementations and the CLI. Used b...
- **`coreSchemas.ts`**: SDK Core Schemas - Zod schemas for serializable SDK data types.  These schemas are the single source of truth for SDK data types. TypeScript types are...
- **`coreTypes.ts`**: Mengekspor: HOOK_EVENTS, EXIT_REASONS.

## Direktori: `restored-src/src/hooks`

- **`fileSuggestions.ts`**: Mengekspor: onIndexBuildComplete, clearFileSuggestionCaches, pathListSignature.
- **`renderPlaceholder.ts`**: Mengekspor: renderPlaceholder.
- **`unifiedSuggestions.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`useAfterFirstRender.ts`**: Mengekspor: useAfterFirstRender.
- **`useApiKeyVerification.ts`**: Mengekspor: VerificationStatus, ApiKeyVerificationResult, useApiKeyVerification.
- **`useArrowKeyHistory.tsx`**: Mengekspor: HistoryMode, useArrowKeyHistory.
- **`useAssistantHistory.ts`**: Gated on viewerOnly — non-viewer sessions have no remote history to page.
- **`useAwaySummary.ts`**: Appends a "while you were away" summary message after the terminal has been blurred for 5 minutes. Fires only when (a) 5min since blur, (b) no turn in...
- **`useBackgroundTaskNavigation.ts`**: Mengekspor: useBackgroundTaskNavigation.
- **`useBlink.ts`**: Hook for synchronized blinking animations that pause when offscreen.  Returns a ref to attach to the animated element and the current blink state. All...
- **`useCanUseTool.tsx`**: Mengekspor: CanUseToolFn.
- **`useCancelRequest.ts`**: CancelRequestHandler component for handling cancel/escape keybinding.  Must be rendered inside KeybindingSetup to have access to the keybinding contex...
- **`useChromeExtensionNotification.tsx`**: Mengekspor: useChromeExtensionNotification.
- **`useClaudeCodeHintRecommendation.tsx`**: Surfaces plugin-install prompts driven by `<claude-code-hint />` tags that CLIs/SDKs emit to stderr. See docs/claude-code-hints.md.  Show-once semanti...
- **`useClipboardImageHint.ts`**: Hook that shows a notification when the terminal regains focus and the clipboard contains an image.  @param isFocused - Whether the terminal is curren...
- **`useCommandKeybindings.tsx`**: Component that registers keybinding handlers for command bindings.  Must be rendered inside KeybindingSetup to have access to the keybinding context. ...
- **`useCommandQueue.ts`**: React hook to subscribe to the unified command queue. Returns a frozen array that only changes reference on mutation. Components re-render only when t...
- **`useCopyOnSelect.ts`**: Auto-copy the selection to the clipboard when the user finishes dragging (mouse-up with a non-empty selection) or multi-clicks to select a word/line. ...
- **`useDeferredHookMessages.ts`**: Manages deferred SessionStart hook messages so the REPL can render immediately instead of blocking on hook execution (~500ms).  Hook messages are inje...
- **`useDiffData.ts`**: Mengekspor: DiffFile, DiffData, useDiffData.
- **`useDiffInIDE.ts`**: Mengekspor: useDiffInIDE, computeEditsFromContents.
- **`useDirectConnect.ts`**: Mengekspor: useDirectConnect.
- **`useDoublePress.ts`**: Mengekspor: DOUBLE_PRESS_TIMEOUT_MS, useDoublePress.
- **`useDynamicConfig.ts`**: React hook for dynamic config values. Returns the default value initially, then updates when the config is fetched.
- **`useElapsedTime.ts`**: Hook that returns formatted elapsed time since startTime. Uses useSyncExternalStore with interval-based updates for efficiency.  @param startTime - Un...
- **`useExitOnCtrlCD.ts`**: Handle ctrl+c and ctrl+d for exiting the application.  Uses a time-based double-press mechanism: - First press: Shows "Press X again to exit" message ...
- **`useExitOnCtrlCDWithKeybindings.ts`**: Convenience hook that wires up useExitOnCtrlCD with useKeybindings.  This is the standard way to use useExitOnCtrlCD in components. The separation exi...
- **`useFileHistorySnapshotInit.ts`**: Mengekspor: useFileHistorySnapshotInit.
- **`useGlobalKeybindings.tsx`**: Component that registers global keybinding handlers.  Must be rendered inside KeybindingSetup to have access to the keybinding context. This component...
- **`useHistorySearch.ts`**: Mengekspor: useHistorySearch.
- **`useIDEIntegration.tsx`**: Mengekspor: useIDEIntegration.
- **`useIdeAtMentioned.ts`**: A hook that tracks IDE at-mention notifications by directly registering
- **`useIdeConnectionStatus.ts`**: Mengekspor: IdeStatus, useIdeConnectionStatus.
- **`useIdeLogging.ts`**: Mengekspor: useIdeLogging.
- **`useIdeSelection.ts`**: Mengekspor: SelectionPoint, SelectionData, IDESelection.
- **`useInboxPoller.ts`**: Mengekspor: useInboxPoller.
- **`useInputBuffer.ts`**: Mengekspor: BufferEntry, UseInputBufferProps, UseInputBufferResult.
- **`useIssueFlagBanner.ts`**: Mengekspor: isSessionContainerCompatible, hasFrictionSignal, useIssueFlagBanner.
- **`useLogMessages.ts`**: Hook that logs messages to the transcript conversation ID that only changes when a new conversation is started.  @param messages The current conversat...
- **`useLspPluginRecommendation.tsx`**: Hook for LSP plugin recommendations  Detects file edits and recommends LSP plugins when: - File extension matches an LSP plugin - LSP binary is alread...
- **`useMailboxBridge.ts`**: Mengekspor: useMailboxBridge.
- **`useMainLoopModel.ts`**: Mengekspor: useMainLoopModel.
- **`useManagePlugins.ts`**: Hook to manage plugin state and synchronize with AppState.  On mount: loads all plugins, runs delisting enforcement, surfaces flagged- plugin notifica...
- **`useMemoryUsage.ts`**: Hook to monitor Node.js process memory usage. Polls every 10 seconds; returns null while status is 'normal'.
- **`useMergedClients.ts`**: Mengekspor: mergeClients, useMergedClients.
- **`useMergedCommands.ts`**: Mengekspor: useMergedCommands.
- **`useMergedTools.ts`**: React hook that assembles the full tool pool for the REPL.  Uses assembleToolPool() (the shared pure function used by both REPL and runAgent) to combi...
- **`useMinDisplayTime.ts`**: Throttles a value so each distinct value stays visible for at least `minMs`. Prevents fast-cycling progress text from flickering past before it's read...
- **`useNotifyAfterTimeout.ts`**: Hook that manages desktop notifications after a timeout period.
- **`useOfficialMarketplaceNotification.tsx`**: Hook that handles official marketplace auto-installation and shows notifications for success/failure in the bottom right of the REPL.
- **`usePasteHandler.ts`**: Mengekspor: usePasteHandler.
- **`usePluginRecommendationBase.tsx`**: Shared state machine + install helper for plugin-recommendation hooks (LSP, claude-code-hint). Centralizes the gate chain, async-guard, and success/fa...
- **`usePrStatus.ts`**: Polls PR review status every 60s while the session is active. When no interaction is detected for 60 minutes, the loop stops — no timers remain. React...
- **`usePromptSuggestion.ts`**: Mengekspor: usePromptSuggestion.
- **`usePromptsFromClaudeInChrome.tsx`**: A hook that listens for prompt notifications from the Claude for Chrome extension, enqueues them as user prompts, and syncs permission mode changes to...
- **`useQueueProcessor.ts`**: Hook that processes queued commands when conditions are met.  Uses a single unified command queue (module-level store). Priority determines processing...
- **`useRemoteSession.ts`**: Mengekspor: useRemoteSession.
- **`useReplBridge.tsx`**: How long after a failure before replBridgeEnabled is auto-cleared (stops retries).
- **`useSSHSession.ts`**: REPL integration hook for `claude ssh` sessions.  Sibling to useDirectConnect — same shape (isRemoteMode/sendMessage/ cancelRequest/disconnect), same ...
- **`useScheduledTasks.ts`**: When true, bypasses the isLoading gate so tasks can enqueue while a query is streaming rather than deferring to the next 1s check tick after the turn ...
- **`useSearchInput.ts`**: Esc + Ctrl+C abandon (distinct from onExit = Enter commit). When provided: single-Esc calls this directly (no clear-first-then-exit two-press). When a...
- **`useSessionBackgrounding.ts`**: Hook for managing session backgrounding (Ctrl+B to background/foreground sessions).  Handles: - Calling onBackgroundQuery to spawn a background task f...
- **`useSettings.ts`**: Settings type as stored in AppState (DeepImmutable wrapped). Use this type when you need to annotate variables that hold settings from useSettings()....
- **`useSettingsChange.ts`**: Mengekspor: useSettingsChange.
- **`useSkillImprovementSurvey.ts`**: Mengekspor: useSkillImprovementSurvey.
- **`useSkillsChange.ts`**: Keep the commands list fresh across two triggers:  1. Skill file changes (watcher) — full cache clear + disk re-scan, since skill content changed on d...
- **`useSwarmInitialization.ts`**: Swarm Initialization Hook  Initializes swarm features: teammate hooks and context. Handles both fresh spawns and resumed teammate sessions.  This hook...
- **`useSwarmPermissionPoller.ts`**: Swarm Permission Poller Hook  This hook polls for permission responses from the team leader when running as a worker agent in a swarm. When a response...
- **`useTaskListWatcher.ts`**: When undefined, the hook does nothing. The task list id is also used as the agent ID.
- **`useTasksV2.ts`**: Singleton store for the TodoV2 task list. Owns the file watcher, timers, and cached task list. Multiple hook instances (REPL, Spinner, PromptInputFoot...
- **`useTeammateViewAutoExit.ts`**: Auto-exits teammate viewing mode when the viewed teammate is killed or encounters an error. Users stay viewing completed teammates so they can review ...
- **`useTeleportResume.tsx`**: Mengekspor: TeleportResumeError, TeleportSource, useTeleportResume.
- **`useTerminalSize.ts`**: Mengekspor: useTerminalSize.
- **`useTextInput.ts`**: Mengekspor: UseTextInputProps, useTextInput.
- **`useTimeout.ts`**: Mengekspor: useTimeout.
- **`useTurnDiffs.ts`**: Mengekspor: TurnFileDiff, TurnDiff, useTurnDiffs.
- **`useTypeahead.tsx`**: Mengekspor: extractSearchToken, formatReplacementValue, applyShellSuggestion.
- **`useUpdateNotification.ts`**: Mengekspor: getSemverPart, shouldShowUpdateNotification, useUpdateNotification.
- **`useVimInput.ts`**: Mengekspor: useVimInput.
- **`useVirtualScroll.ts`**: Estimated height (rows) for items not yet measured. Intentionally LOW: overestimating causes blank space (we stop mounting too early and the viewport ...
- **`useVoice.ts`**: Mengekspor: normalizeLanguageForSTT, FIRST_PRESS_FALLBACK_MS, computeLevel.
- **`useVoiceEnabled.ts`**: Combines user intent (settings.voiceEnabled) with auth + GB kill-switch. Only the auth half is memoized on authVersion — it's the expensive one (cold ...
- **`useVoiceIntegration.tsx`**: Mengekspor: useVoiceIntegration, useVoiceKeybindingHandler, VoiceKeybindingHandler.

## Direktori: `restored-src/src/hooks/notifs`

- **`useAutoModeUnavailableNotification.ts`**: Shows a one-shot notification when the shift-tab carousel wraps past where auto mode would have been. Covers all reasons (settings, circuit-breaker, o...
- **`useCanSwitchToExistingSubscription.tsx`**: Hook to check if the user has a subscription on Console but isn't logged into it.
- **`useDeprecationWarningNotification.tsx`**: Mengekspor: useDeprecationWarningNotification.
- **`useFastModeNotification.tsx`**: Mengekspor: useFastModeNotification.
- **`useIDEStatusIndicator.tsx`**: Mengekspor: useIDEStatusIndicator.
- **`useInstallMessages.tsx`**: Mengekspor: useInstallMessages.
- **`useLspInitializationNotification.tsx`**: Hook that polls LSP status and shows a notification when: 1. Manager initialization fails 2. Any LSP server enters an error state  Also adds errors to...
- **`useMcpConnectivityStatus.tsx`**: Mengekspor: useMcpConnectivityStatus.
- **`useModelMigrationNotifications.tsx`**: Mengekspor: useModelMigrationNotifications.
- **`useNpmDeprecationNotification.tsx`**: Mengekspor: useNpmDeprecationNotification.
- **`usePluginAutoupdateNotification.tsx`**: Hook that displays a notification when plugins have been auto-updated. The notification tells the user to run /reload-plugins to apply the updates.
- **`usePluginInstallationStatus.tsx`**: Mengekspor: usePluginInstallationStatus.
- **`useRateLimitWarningNotification.tsx`**: Mengekspor: useRateLimitWarningNotification.
- **`useSettingsErrors.tsx`**: Mengekspor: useSettingsErrors.
- **`useStartupNotification.ts`**: Fires notification(s) once on mount. Encapsulates the remote-mode gate and once-per-session ref guard that was hand-rolled across 10+ notifs/ hooks.  ...
- **`useTeammateShutdownNotification.ts`**: Mengekspor: useTeammateLifecycleNotification.

## Direktori: `restored-src/src/hooks/toolPermission`

- **`PermissionContext.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`permissionLogging.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/hooks/toolPermission/handlers`

- **`coordinatorHandler.ts`**: Handles the coordinator worker permission flow.  For coordinator workers, automated checks (hooks and classifier) are awaited sequentially before fall...
- **`interactiveHandler.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`swarmWorkerHandler.ts`**: Handles the swarm worker permission flow.  When running as a swarm worker: 1. Tries classifier auto-approval for bash commands

## Direktori: `restored-src/src/ink`

- **`Ansi.tsx`**: When true, force all text to be rendered with dim styling
- **`bidi.ts`**: Bidirectional text reordering for terminal rendering.  Terminals on Windows do not implement the Unicode Bidi Algorithm, so RTL text (Hebrew, Arabic, ...
- **`clearTerminal.ts`**: Cross-platform terminal clearing with scrollback support. Detects modern terminals that support ESC[3J for clearing scrollback.
- **`colorize.ts`**: xterm.js (VS Code, Cursor, code-server, Coder) has supported truecolor since 2017, but code-server/Coder containers often don't set COLORTERM=truecolo...
- **`constants.ts`**: Mengekspor: FRAME_INTERVAL_MS.
- **`dom.ts`**: Mengekspor: TextName, ElementNames, NodeNames.
- **`focus.ts`**: DOM-like focus manager for the Ink terminal UI.  Pure state — tracks activeElement and a focus stack. Has no reference to the tree; callers pass the r...
- **`frame.ts`**: DECSTBM scroll optimization hint (alt-screen only, null otherwise).
- **`get-max-width.ts`**: Returns the yoga node's content width (computed width minus padding and border).  Warning: can return a value WIDER than the parent container. In a co...
- **`hit-test.ts`**: File pengujian (unit/integration test).
- **`ink.tsx`**: Mengekspor: Options, drainStdin.
- **`instances.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`line-width-cache.ts`**: Mengekspor: lineWidth.
- **`log-update.ts`**: Mengekspor: LogUpdate.
- **`measure-element.ts`**: Element width.
- **`measure-text.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`node-cache.ts`**: Cached layout bounds for each rendered node (used for blit + clearing). `top` is the yoga-local getComputedTop() — stored so ScrollBox viewport cullin...
- **`optimizer.ts`**: Optimize a diff by applying all optimization rules in a single pass. This reduces the number of patches that need to be written to the terminal.  Rule...
- **`output.ts`**: A grapheme cluster with precomputed terminal width, styleId, and hyperlink. Built once per unique line (cached via charCache), so the per-char hot loo...
- **`parse-keypress.ts`**: Keyboard input parser - converts terminal input to key events  Uses the termio tokenizer for escape sequence boundary detection, then interprets seque...
- **`reconciler.ts`**: Mengekspor: getOwnerChain, isDebugRepaintsEnabled, dispatcher.
- **`render-border.ts`**: Mengekspor: BorderTextOptions, CUSTOM_BORDER_STYLES, BorderStyle.
- **`render-node-to-output.ts`**: Mengekspor: resetLayoutShifted, didLayoutShift, ScrollHint.
- **`render-to-screen.ts`**: Position of a match within a rendered message, relative to the message's own bounding box (row 0 = message top). Stable across scroll — to highlight o...
- **`renderer.ts`**: Mengekspor: RenderOptions, Renderer.
- **`root.ts`**: Output stream where app will be rendered.  @default process.stdout
- **`screen.ts`**: Mengekspor: CharPool, HyperlinkPool, StylePool.
- **`searchHighlight.ts`**: Highlight all visible occurrences of `query` in the screen buffer by inverting cell styles (SGR 7). Post-render, same damage-tracking machinery as app...
- **`selection.ts`**: Text selection state for fullscreen mode.  Tracks a linear selection in screen-buffer coordinates (0-indexed col/row). Selection is line-based: cells ...
- **`squash-text-nodes.ts`**: A segment of text with its associated styles. Used for structured rendering without ANSI string transforms.
- **`stringWidth.ts`**: Fallback JavaScript implementation of stringWidth when Bun.stringWidth is not available.  Get the display width of a string as it would appear in a te...
- **`styles.ts`**: Mengekspor: RGBColor, HexColor, Ansi256Color.
- **`supports-hyperlinks.ts`**: Returns whether stdout supports OSC 8 hyperlinks. Extends the supports-hyperlinks library with additional terminal detection. @param options Optional ...
- **`tabstops.ts`**: Mengekspor: expandTabs.
- **`terminal-focus-state.ts`**: Mengekspor: TerminalFocusState, setTerminalFocused, getTerminalFocused.
- **`terminal-querier.ts`**: Query the terminal and await responses without timeouts.  Terminal queries (DECRQM, DA1, OSC 11, etc.) share the stdin stream with keyboard input. Res...
- **`terminal.ts`**: Checks if the terminal supports OSC 9;4 progress reporting. Supported terminals: - ConEmu (Windows) - all versions - Ghostty 1.2.0+ - iTerm2 3.6.6+  N...
- **`termio.ts`**: ANSI Parser Module  A semantic ANSI escape sequence parser inspired by ghostty, tmux, and iTerm2.  Key features: - Semantic output: produces structure...
- **`useTerminalNotification.ts`**: Report progress to the terminal via OSC 9;4 sequences. Supported terminals: ConEmu, Ghostty 1.2.0+, iTerm2 3.6.6+ Pass state=null to clear progress....
- **`warn.ts`**: Mengekspor: ifNotInteger.
- **`widest-line.ts`**: Mengekspor: widestLine.
- **`wrap-text.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`wrapAnsi.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/ink/components`

- **`AlternateScreen.tsx`**: Enable SGR mouse tracking (wheel + click/drag). Default true.
- **`App.tsx`**: Mengekspor: handleMouseEvent.
- **`AppContext.ts`**: Exit (unmount) the whole Ink app.
- **`Box.tsx`**: Tab order index. Nodes with `tabIndex >= 0` participate in Tab/Shift+Tab cycling; `-1` means programmatically focusable only.
- **`Button.tsx`**: Called when the button is activated via Enter, Space, or click.
- **`ClockContext.tsx`**: Mengekspor: Clock, createClock, ClockContext.
- **`CursorDeclarationContext.ts`**: Display column (terminal cell width) within the declared node
- **`ErrorOverview.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`Link.tsx`**: Mengekspor: Props.
- **`Newline.tsx`**: Number of newlines to insert.  @default 1
- **`NoSelect.tsx`**: Extend the exclusion zone from column 0 to this box's right edge, for every row this box occupies. Use for gutters rendered inside a wider indented co...
- **`RawAnsi.tsx`**: Pre-rendered ANSI lines. Each element must be exactly one terminal row (already wrapped to `width` by the producer) with ANSI escape codes inline.
- **`ScrollBox.tsx`**: Scroll so `el`'s top is at the viewport top (plus `offset`). Unlike scrollTo which bakes a number that's stale by the time the throttled render fires,...
- **`Spacer.tsx`**: A flexible space that expands along the major axis of its containing layout. It's useful as a shortcut for filling all the available spaces between el...
- **`StdinContext.ts`**: Stdin stream passed to `render()` in `options.stdin` or `process.stdin` by default. Useful if your app needs to handle user input.
- **`TerminalFocusContext.tsx`**: Mengekspor: TerminalFocusContextProps, TerminalFocusProvider.
- **`TerminalSizeContext.tsx`**: Mengekspor: TerminalSize, TerminalSizeContext.
- **`Text.tsx`**: Change text color. Accepts a raw color value (rgb, hex, ansi).

## Direktori: `restored-src/src/ink/events`

- **`click-event.ts`**: Mouse click event. Fired on left-button release without drag, only when mouse tracking is enabled (i.e. inside <AlternateScreen>).  Bubbles from the d...
- **`dispatcher.ts`**: Mengekspor: Dispatcher.
- **`emitter.ts`**: Mengekspor: EventEmitter.
- **`event-handlers.ts`**: Props for event handlers on Box and other host components.  Follows the React/DOM naming convention: - onEventName: handler for bubble phase - onEvent...
- **`event.ts`**: Mengekspor: Event.
- **`focus-event.ts`**: Focus event for component focus changes.  Dispatched when focus moves between elements. 'focus' fires on the newly focused element, 'blur' fires on th...
- **`input-event.ts`**: Mengekspor: Key, InputEvent.
- **`keyboard-event.ts`**: Keyboard event dispatched through the DOM tree via capture/bubble.  Follows browser KeyboardEvent semantics: `key` is the literal character for printa...
- **`terminal-event.ts`**: Base class for all terminal events with DOM-style propagation.  Extends Event so existing event types (ClickEvent, InputEvent, TerminalFocusEvent) sha...
- **`terminal-focus-event.ts`**: Event fired when the terminal window gains or loses focus.  Uses DECSET 1004 focus reporting - the terminal sends: - CSI I (\x1b[I) when the terminal ...

## Direktori: `restored-src/src/ink/hooks`

- **`use-animation-frame.ts`**: Hook for synchronized animations that pause when offscreen.  Returns a ref to attach to the animated element and the current animation time. All insta...
- **`use-app.ts`**: `useApp` is a React hook, which exposes a method to manually exit the app (unmount).
- **`use-declared-cursor.ts`**: Declares where the terminal cursor should be parked after each frame.  Terminal emulators render IME preedit text at the physical cursor position, and...
- **`use-input.ts`**: Enable or disable capturing of user input. Useful when there are multiple useInput hooks used at once to avoid handling the same input several times. ...
- **`use-interval.ts`**: Returns the clock time, updating at the given interval. Subscribes as non-keepAlive — won't keep the clock alive on its own, but updates whenever a ke...
- **`use-search-highlight.ts`**: Set the search highlight query on the Ink instance. Non-empty → all visible occurrences are inverted on the next frame (SGR 7, screen-buffer overlay, ...
- **`use-selection.ts`**: Access to text selection operations on the Ink instance (fullscreen only). Returns no-op functions when fullscreen mode is disabled.
- **`use-stdin.ts`**: `useStdin` is a React hook, which exposes stdin stream.
- **`use-tab-status.ts`**: Mengekspor: TabStatusKind, useTabStatus.
- **`use-terminal-focus.ts`**: Hook to check if the terminal has focus.  Uses DECSET 1004 focus reporting - the terminal sends escape sequences when it gains or loses focus. These a...
- **`use-terminal-title.ts`**: Declaratively set the terminal tab/window title.  Pass a string to set the title. ANSI escape sequences are stripped automatically so callers don't ne...
- **`use-terminal-viewport.ts`**: Whether the element is currently within the terminal viewport

## Direktori: `restored-src/src/ink/layout`

- **`engine.ts`**: Mengekspor: createLayoutNode.
- **`geometry.ts`**: Edge insets (padding, margin, border)
- **`node.ts`**: Mengekspor: LayoutEdge, LayoutEdge, LayoutGutter.
- **`yoga.ts`**: Mengekspor: YogaLayoutNode, createYogaLayoutNode.

## Direktori: `restored-src/src/ink/termio`

- **`ansi.ts`**: ANSI Control Characters and Escape Sequence Introducers  Based on ECMA-48 / ANSI X3.64 standards.
- **`csi.ts`**: CSI (Control Sequence Introducer) Types  Enums and types for CSI command parameters.
- **`dec.ts`**: DEC (Digital Equipment Corporation) Private Mode Sequences  DEC private modes use CSI ? N h (set) and CSI ? N l (reset) format. These are terminal-spe...
- **`esc.ts`**: ESC Sequence Parser  Handles simple escape sequences: ESC + one or two characters
- **`osc.ts`**: OSC (Operating System Command) Types and Parser
- **`parser.ts`**: ANSI Parser - Semantic Action Generator  A streaming parser for ANSI escape sequences that produces semantic actions. Uses the tokenizer for escape se...
- **`sgr.ts`**: SGR (Select Graphic Rendition) Parser  Parses SGR parameters and applies them to a TextStyle. Handles both semicolon (;) and colon (:) separated param...
- **`tokenize.ts`**: Input Tokenizer - Escape sequence boundary detection  Splits terminal input into tokens: text chunks and raw escape sequences. Unlike the Parser which...
- **`types.ts`**: ANSI Parser - Semantic Types  These types represent the semantic meaning of ANSI escape sequences, not their string representation. Inspired by ghostt...

## Direktori: `restored-src/src/keybindings`

- **`KeybindingContext.tsx`**: Handler registration for action callbacks
- **`KeybindingProviderSetup.tsx`**: Setup utilities for integrating KeybindingProvider into the app.  This file provides the bindings and a composed provider that can be added to the app...
- **`defaultBindings.ts`**: Default keybindings that match current Claude Code behavior. These are loaded first, then user keybindings.json overrides them.
- **`loadUserBindings.ts`**: User keybinding configuration loader with hot-reload support.  Loads keybindings from ~/.claude/keybindings.json and watches for changes to reload the...
- **`match.ts`**: Modifier keys from Ink's Key type that we care about for matching. Note: `fn` from Key is intentionally excluded as it's rarely used and not commonly ...
- **`parser.ts`**: Parse a keystroke string like "ctrl+shift+k" into a ParsedKeystroke. Supports various modifier aliases (ctrl/control, alt/opt/option/meta, cmd/command...
- **`reservedShortcuts.ts`**: Shortcuts that are typically intercepted by the OS, terminal, or shell and will likely never reach the application.
- **`resolver.ts`**: Resolve a key input to an action. Pure function - no state, no side effects, just matching logic.  @param input - The character input from Ink @param ...
- **`schema.ts`**: Zod schema for keybindings.json configuration. Used for validation and JSON schema generation.
- **`shortcutFormat.ts`**: Get the display text for a configured shortcut without React hooks. Use this in non-React contexts (commands, services, etc.).  This lives in its own ...
- **`template.ts`**: Keybindings template generator. Generates a well-documented template file for ~/.claude/keybindings.json
- **`useKeybinding.ts`**: Which context this binding belongs to (default: 'Global')
- **`useShortcutDisplay.ts`**: Hook to get the display text for a configured shortcut. Returns the configured binding or a fallback if unavailable.  @param action - The action name ...
- **`validate.ts`**: Types of validation issues that can occur with keybindings.

## Direktori: `restored-src/src/memdir`

- **`findRelevantMemories.ts`**: Find memory files relevant to a query by scanning memory file headers and asking Sonnet to select the most relevant ones.  Returns absolute file paths...
- **`memdir.ts`**: Mengekspor: ENTRYPOINT_NAME, MAX_ENTRYPOINT_LINES, MAX_ENTRYPOINT_BYTES.
- **`memoryAge.ts`**: Days elapsed since mtime.  Floor-rounded — 0 for today, 1 for yesterday, 2+ for older.  Negative inputs (future mtime, clock skew) clamp to 0.
- **`memoryScan.ts`**: Memory-directory scanning primitives. Split out of findRelevantMemories.ts so extractMemories can import the scan without pulling in sideQuery and the...
- **`memoryTypes.ts`**: Memory type taxonomy.  Memories are constrained to four types capturing context NOT derivable from the current project state. Code patterns, architect...
- **`paths.ts`**: Whether auto-memory features are enabled (memdir, agent memory, past session search). Enabled by default. Priority chain (first defined wins): 1. CLAU...
- **`teamMemPaths.ts`**: Error thrown when a path validation detects a traversal or injection attempt.
- **`teamMemPrompts.ts`**: Build the combined prompt when both auto memory and team memory are enabled. Closed four-type taxonomy (user / feedback / project / reference) with pe...

## Direktori: `restored-src/src/migrations`

- **`migrateAutoUpdatesToSettings.ts`**: Migration: Move user-set autoUpdates preference to settings.json env var Only migrates if user explicitly disabled auto-updates (not for protection) T...
- **`migrateBypassPermissionsAcceptedToSettings.ts`**: Migration: Move bypassPermissionsModeAccepted from global config to settings.json as skipDangerousModePermissionPrompt. This is a better home since se...
- **`migrateEnableAllProjectMcpServersToSettings.ts`**: Migration: Move MCP server approval fields from project config to local settings This migrates both enableAllProjectMcpServers and enabledMcpjsonServe...
- **`migrateFennecToOpus.ts`**: Migrate users on removed fennec model aliases to their new Opus 4.6 aliases. - fennec-latest → opus - fennec-latest[1m] → opus[1m] - fennec-fast-lates...
- **`migrateLegacyOpusToCurrent.ts`**: Migrate first-party users off explicit Opus 4.0/4.1 model strings.  The 'opus' alias already resolves to Opus 4.6 for 1P, so anyone still on an explic...
- **`migrateOpusToOpus1m.ts`**: Migrate users with 'opus' pinned in their settings to 'opus[1m]' when they are eligible for the merged Opus 1M experience (Max/Team Premium on 1P).  C...
- **`migrateReplBridgeEnabledToRemoteControlAtStartup.ts`**: Migrate the `replBridgeEnabled` config key to `remoteControlAtStartup`.  The old key was an implementation detail that leaked into user-facing config....
- **`migrateSonnet1mToSonnet45.ts`**: Migrate users who had "sonnet[1m]" saved to the explicit "sonnet-4-5-20250929[1m]".  The "sonnet" alias now resolves to Sonnet 4.6, so users who previ...
- **`migrateSonnet45ToSonnet46.ts`**: Migrate Pro/Max/Team Premium first-party users off explicit Sonnet 4.5 model strings to the 'sonnet' alias (which now resolves to Sonnet 4.6).  Users ...
- **`resetAutoModeOptInForDefaultOffer.ts`**: One-shot migration: clear skipAutoPermissionPrompt for users who accepted the old 2-option AutoModeOptInDialog but don't have auto as their default. R...
- **`resetProToOpusDefault.ts`**: Mengekspor: resetProToOpusDefault.

## Direktori: `restored-src/src/moreright`

- **`useMoreRight.tsx`**: Mengekspor: useMoreRight.

## Direktori: `restored-src/src/native-ts/color-diff`

- **`index.ts`**: Pure TypeScript port of vendor/color-diff-src.  The Rust version uses syntect+bat for syntax highlighting and the similar crate for word diffing. This...

## Direktori: `restored-src/src/native-ts/file-index`

- **`index.ts`**: Pure-TypeScript port of vendor/file-index-src (Rust NAPI module).  The native module wraps nucleo (https:github.com/helix-editor/nucleo) for high-perf...

## Direktori: `restored-src/src/native-ts/yoga-layout`

- **`enums.ts`**: Yoga enums — ported from yoga-layout/src/generated/YGEnums.ts Kept as `const` objects (not TS enums) per repo convention. Values match upstream exactl...
- **`index.ts`**: Pure-TypeScript port of yoga-layout (Meta's flexbox engine).  This matches the `yoga-layout/load` API surface used by src/ink/layout/yoga.ts. The upst...

## Direktori: `restored-src/src/outputStyles`

- **`loadOutputStylesDir.ts`**: Loads markdown files from .claude/output-styles directories throughout the project and from ~/.claude/output-styles directory and converts them to out...

## Direktori: `restored-src/src/plugins`

- **`builtinPlugins.ts`**: Built-in Plugin Registry  Manages built-in plugins that ship with the CLI and can be enabled/disabled by users via the /plugin UI.  Built-in plugins d...

## Direktori: `restored-src/src/plugins/bundled`

- **`index.ts`**: Built-in Plugin Initialization  Initializes built-in plugins that ship with the CLI and appear in the /plugin UI for users to enable/disable.  Not all...

## Direktori: `restored-src/src/query`

- **`config.ts`**: Mengekspor: QueryConfig, buildQueryConfig.
- **`deps.ts`**: Mengekspor: QueryDeps, productionDeps.
- **`stopHooks.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`tokenBudget.ts`**: Mengekspor: BudgetTracker, createBudgetTracker, TokenBudgetDecision.

## Direktori: `restored-src/src/remote`

- **`RemoteSessionManager.ts`**: Type guard to check if a message is an SDKMessage (not a control message)
- **`SessionsWebSocket.ts`**: Maximum retries for 4001 (session not found). During compaction the server may briefly consider the session stale; a short retry window lets the clien...
- **`remotePermissionBridge.ts`**: Create a synthetic AssistantMessage for remote permission requests. The ToolUseConfirm type requires an AssistantMessage, but in remote mode we don't ...
- **`sdkMessageAdapter.ts`**: Converts SDKMessage from CCR to REPL Message types.  The CCR backend sends SDK-format messages via WebSocket. The REPL expects internal Message types ...

## Direktori: `restored-src/src/schemas`

- **`hooks.ts`**: Hook Zod schemas extracted to break import cycles.  This file contains hook-related schema definitions that were originally in src/utils/settings/type...

## Direktori: `restored-src/src/screens`

- **`Doctor.tsx`**: Mengekspor: Doctor.
- **`REPL.tsx`**: Mengekspor: Props, Screen, REPL.
- **`ResumeConversation.tsx`**: Mengekspor: ResumeConversation.

## Direktori: `restored-src/src/server`

- **`createDirectConnectSession.ts`**: Mengekspor: DirectConnectError.
- **`directConnectManager.ts`**: Mengekspor: DirectConnectConfig, DirectConnectCallbacks, DirectConnectSessionManager.
- **`types.ts`**: Idle timeout for detached sessions (ms). 0 = never expire.

## Direktori: `restored-src/src/services/AgentSummary`

- **`agentSummary.ts`**: Periodic background summarization for coordinator mode sub-agents.  Forks the sub-agent's conversation every ~30s using runForkedAgent() to generate a...

## Direktori: `restored-src/src/services/MagicDocs`

- **`magicDocs.ts`**: Magic Docs automatically maintains markdown documentation files marked with special headers. When a file with "# MAGIC DOC: [title]" is read, it runs ...
- **`prompts.ts`**: Get the Magic Docs update prompt template

## Direktori: `restored-src/src/services/PromptSuggestion`

- **`promptSuggestion.ts`**: Mengekspor: PromptVariant, getPromptVariant, shouldEnablePromptSuggestion.
- **`speculation.ts`**: Mengekspor: ActiveSpeculationState, prepareMessagesForInjection, isSpeculationEnabled.

## Direktori: `restored-src/src/services/SessionMemory`

- **`prompts.ts`**: Mengekspor: DEFAULT_SESSION_MEMORY_TEMPLATE, truncateSessionMemoryForCompact.
- **`sessionMemory.ts`**: Session Memory automatically maintains a markdown file with notes about the current conversation. It runs periodically in the background using a forke...
- **`sessionMemoryUtils.ts`**: Session Memory utility functions that can be imported without circular dependencies. These are separate from the main sessionMemory.ts to avoid import...

## Direktori: `restored-src/src/services/analytics`

- **`config.ts`**: Shared analytics configuration  Common logic for determining when analytics should be disabled across all analytics systems (Datadog, 1P)
- **`datadog.ts`**: Mengekspor: initializeDatadog.
- **`firstPartyEventLogger.ts`**: Configuration for sampling individual event types. Each event name maps to an object containing sample_rate (0-1). Events not in the config are logged...
- **`firstPartyEventLoggingExporter.ts`**: Mengekspor: FirstPartyEventLoggingExporter.
- **`growthbook.ts`**: User attributes sent to GrowthBook for targeting. Uses UUID suffix (not Uuid) to align with GrowthBook conventions.
- **`index.ts`**: Analytics service - public API for event logging  This module serves as the main entry point for analytics events in Claude CLI.  DESIGN: This module ...
- **`metadata.ts`**: Shared event metadata enrichment for analytics systems  This module provides a single source of truth for collecting and formatting event metadata acr...
- **`sink.ts`**: Analytics sink implementation  This module contains the actual analytics routing logic and should be initialized during app startup. It routes events ...
- **`sinkKillswitch.ts`**: GrowthBook JSON config that disables individual analytics sinks. Shape: { datadog?: boolean, firstParty?: boolean } A value of true for a key stops al...

## Direktori: `restored-src/src/services/api`

- **`adminRequests.ts`**: Mengekspor: AdminRequestType, AdminRequestStatus, AdminRequestSeatUpgradeDetails.
- **`bootstrap.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`claude.ts`**: Mengekspor: getExtraBodyParams, getPromptCachingEnabled, getCacheControl.
- **`client.ts`**: Mengekspor: CLIENT_REQUEST_ID_HEADER.
- **`dumpPrompts.ts`**: Mengekspor: getLastApiRequests, clearApiRequestCache, clearDumpState.
- **`emptyUsage.ts`**: Zero-initialized usage object. Extracted from logging.ts so that bridge/replBridge.ts can import it without transitively pulling in api/errors.ts → ut...
- **`errorUtils.ts`**: Mengekspor: ConnectionErrorDetails, extractConnectionErrorDetails, getSSLErrorHint.
- **`errors.ts`**: Mengekspor: API_ERROR_MESSAGE_PREFIX, startsWithApiErrorPrefix, PROMPT_TOO_LONG_ERROR_MESSAGE.
- **`filesApi.ts`**: Files API client for managing files  This module provides functionality to download and upload files to Anthropic Public Files API. Used by the Claude...
- **`firstTokenDate.ts`**: Fetch the user's first Claude Code token date and store in config. This is called after successful login to cache when they started using Claude Code....
- **`grove.ts`**: Mengekspor: AccountSettings, GroveConfig, ApiResult.
- **`logging.ts`**: Mengekspor: GlobalCacheStrategy, logAPIQuery, logAPIError.
- **`metricsOptOut.ts`**: Internal function to call the API and check if metrics are enabled
- **`overageCreditGrant.ts`**: Fetch the current user's overage credit grant eligibility from the backend. The backend resolves tier-specific amounts and role-based claim permission...
- **`promptCacheBreakDetection.ts`**: Mengekspor: CACHE_TTL_1HOUR_MS, PromptStateSnapshot, recordPromptState.
- **`referral.ts`**: Mengekspor: checkCachedPassesEligibility, formatCreditAmount, getCachedReferrerReward.
- **`sessionIngress.ts`**: Mengekspor: clearSession, clearAllSessions.
- **`ultrareviewQuota.ts`**: Peek the ultrareview quota for display and nudge decisions. Consume happens server-side at session creation. Null when not a subscriber or the endpoin...
- **`usage.ts`**: Mengekspor: RateLimit, ExtraUsage, Utilization.
- **`withRetry.ts`**: Mengekspor: BASE_DELAY_MS, RetryContext, CannotRetryError.

## Direktori: `restored-src/src/services/autoDream`

- **`autoDream.ts`**: Mengekspor: initAutoDream.
- **`config.ts`**: Whether background memory consolidation should run. User setting (autoDreamEnabled in settings.json) overrides the GrowthBook default when explicitly ...
- **`consolidationLock.ts`**: mtime of the lock file = lastConsolidatedAt. 0 if absent. Per-turn cost: one stat.
- **`consolidationPrompt.ts`**: Mengekspor: buildConsolidationPrompt.

## Direktori: `restored-src/src/services`

- **`awaySummary.ts`**: Generates a short session recap for the "while you were away" card. Returns null on abort, empty transcript, or error.
- **`claudeAiLimits.ts`**: Mengekspor: getRateLimitDisplayName, OverageDisabledReason, ClaudeAILimits.
- **`claudeAiLimitsHook.ts`**: Mengekspor: useClaudeAiLimits.
- **`diagnosticTracking.ts`**: Mengekspor: Diagnostic, DiagnosticFile, DiagnosticTrackingService.
- **`internalLogging.ts`**: Get the current Kubernetes namespace: Returns null on laptops/local development, "default" for devboxes in default namespace, "ts" for devboxes in ts ...
- **`mcpServerApproval.tsx`**: Show MCP server approval dialogs for pending project servers. Uses the provided Ink root to render (reusing the existing instance from main.tsx instea...
- **`mockRateLimits.ts`**: Mengekspor: MockHeaderKey, MockScenario, setMockHeader.
- **`notifier.ts`**: Mengekspor: NotificationOptions.
- **`preventSleep.ts`**: Prevents macOS from sleeping while Claude is working.  Uses the built-in `caffeinate` command to create a power assertion that prevents idle sleep. Th...
- **`rateLimitMessages.ts`**: Centralized rate limit message generation Single source of truth for all rate limit-related messages
- **`rateLimitMocking.ts`**: Facade for rate limit header processing This isolates mock logic from production code
- **`tokenEstimation.ts`**: Mengekspor: roughTokenCountEstimation, bytesPerTokenForFileType, roughTokenCountEstimationForFileType.
- **`vcr.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`voice.ts`**: Mengekspor: _resetArecordProbeForTesting, _resetAlsaCardsForTesting, RecordingAvailability.
- **`voiceKeyterms.ts`**: Mengekspor: splitIdentifier.
- **`voiceStreamSTT.ts`**: Mengekspor: FINALIZE_TIMEOUTS_MS, VoiceStreamCallbacks, FinalizeSource.

## Direktori: `restored-src/src/services/compact`

- **`apiMicrocompact.ts`**: Mengekspor: ContextEditStrategy, ContextManagementConfig, getAPIContextManagement.
- **`autoCompact.ts`**: Mengekspor: getEffectiveContextWindowSize, AutoCompactTrackingState, AUTOCOMPACT_BUFFER_TOKENS.
- **`compact.ts`**: Mengekspor: POST_COMPACT_MAX_FILES_TO_RESTORE, POST_COMPACT_TOKEN_BUDGET, POST_COMPACT_MAX_TOKENS_PER_FILE.
- **`compactWarningHook.ts`**: React hook to subscribe to compact warning suppression state.  Lives in its own file so that compactWarningState.ts stays React-free: microCompact.ts ...
- **`compactWarningState.ts`**: Tracks whether the "context left until autocompact" warning should be suppressed. We suppress immediately after successful compaction since we don't h...
- **`grouping.ts`**: Groups messages at API-round boundaries: one group per API round-trip. A boundary fires when a NEW assistant response begins (different message.id fro...
- **`microCompact.ts`**: Mengekspor: TIME_BASED_MC_CLEARED_MESSAGE, consumePendingCacheEdits, getPinnedCacheEdits.
- **`postCompactCleanup.ts`**: Run cleanup of caches and tracking state after compaction. Call this after both auto-compact and manual /compact to free memory held by tracking struc...
- **`prompt.ts`**: Mengekspor: getPartialCompactPrompt, getCompactPrompt, formatCompactSummary.
- **`sessionMemoryCompact.ts`**: EXPERIMENT: Session memory compaction
- **`timeBasedMCConfig.ts`**: GrowthBook config for time-based microcompact.  Triggers content-clearing microcompact when the gap since the last main-loop assistant message exceeds...

## Direktori: `restored-src/src/services/extractMemories`

- **`extractMemories.ts`**: Extracts durable memories from the current session transcript and writes them to the auto-memory directory (~/.claude/projects/<path>/memory/).  It ru...
- **`prompts.ts`**: Prompt templates for the background memory extraction agent.  The extraction agent runs as a perfect fork of the main conversation — same system promp...

## Direktori: `restored-src/src/services/lsp`

- **`LSPClient.ts`**: LSP client interface.
- **`LSPDiagnosticRegistry.ts`**: Pending LSP diagnostic notification
- **`LSPServerInstance.ts`**: LSP error code for "content modified" - indicates the server's state changed during request processing (e.g., rust-analyzer still indexing the project...
- **`LSPServerManager.ts`**: LSP Server Manager interface returned by createLSPServerManager. Manages multiple LSP server instances and routes requests based on file extensions....
- **`config.ts`**: Get all configured LSP servers from plugins. LSP servers are only supported via plugins, not user/project settings.  @returns Object containing server...
- **`manager.ts`**: Initialization state of the LSP server manager
- **`passiveFeedback.ts`**: Map LSP severity to Claude diagnostic severity  Maps LSP severity numbers to Claude diagnostic severity strings. Accepts numeric severity values (1=Er...

## Direktori: `restored-src/src/services/mcp`

- **`InProcessTransport.ts`**: In-process linked transport pair for running an MCP server and client in the same process without spawning a subprocess.  `send()` on one side deliver...
- **`MCPConnectionManager.tsx`**: Mengekspor: useMcpReconnect, useMcpToggleEnabled, MCPConnectionManager.
- **`SdkControlTransport.ts`**: SDK MCP Transport Bridge  This file implements a transport bridge that allows MCP servers running in the SDK process to communicate with the Claude Co...
- **`auth.ts`**: Mengekspor: AuthenticationCancelledError, getServerKey, hasMcpDiscoveryButNoToken.
- **`channelAllowlist.ts`**: Approved channel plugins allowlist. --channels plugin:name@marketplace entries only register if {marketplace, plugin} is on this list. server: entries...
- **`channelNotification.ts`**: Channel notifications — lets an MCP server push user messages into the conversation. A "channel" (Discord, Slack, SMS, etc.) is just an MCP server tha...
- **`channelPermissions.ts`**: Permission prompts over channels (Telegram, iMessage, Discord).  Mirrors `BridgePermissionCallbacks` — when CC hits a permission dialog, it ALSO sends...
- **`claudeai.ts`**: Mengekspor: fetchClaudeAIMcpConfigsIfEligible, clearClaudeAIMcpConfigsCache, markClaudeAiMcpConnected.
- **`client.ts`**: Mengekspor: McpAuthError, McpToolCallError_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS, isMcpSessionExpiredError.
- **`config.ts`**: Mengekspor: getEnterpriseMcpFilePath, unwrapCcrProxyUrl, getMcpServerSignature.
- **`elicitationHandler.ts`**: Configuration for the waiting state shown after the user opens a URL.
- **`envExpansion.ts`**: Shared utilities for expanding environment variables in MCP server configurations
- **`headersHelper.ts`**: Check if the MCP server config comes from project settings (projectSettings or localSettings) This is important for security checks
- **`mcpStringUtils.ts`**: Pure string utility functions for MCP tool/server name parsing. This file has no heavy dependencies to keep it lightweight for consumers that only nee...
- **`normalization.ts`**: Pure utility functions for MCP name normalization. This file has no dependencies to avoid circular imports.
- **`oauthPort.ts`**: OAuth redirect port helpers — extracted from auth.ts to break the auth.ts ↔ xaaIdpLogin.ts circular dependency.
- **`officialRegistry.ts`**: Fire-and-forget fetch of the official MCP registry.
- **`types.ts`**: Mengekspor: ConfigScopeSchema, ConfigScope, TransportSchema.
- **`useManageMCPConnections.ts`**: Mengekspor: useManageMCPConnections.
- **`utils.ts`**: Mengekspor: filterToolsByServer, commandBelongsToServer, filterCommandsByServer.
- **`vscodeSdkMcp.ts`**: Mengekspor: LogEventNotificationSchema, notifyVscodeFileUpdated, setupVscodeSdkMcp.
- **`xaa.ts`**: Cross-App Access (XAA) / Enterprise Managed Authorization (SEP-990)  Obtains an MCP access token WITHOUT a browser consent screen by chaining: 1. RFC ...
- **`xaaIdpLogin.ts`**: XAA IdP Login — acquires an OIDC id_token from an enterprise IdP via the standard authorization_code + PKCE flow, then caches it by IdP issuer.  This ...

## Direktori: `restored-src/src/services/oauth`

- **`auth-code-listener.ts`**: Temporary localhost HTTP server that listens for OAuth authorization code redirects.  When the user authorizes in their browser, the OAuth provider re...
- **`client.ts`**: Mengekspor: shouldUseClaudeAIAuth, parseScopes, buildAuthUrl.
- **`crypto.ts`**: Mengekspor: generateCodeVerifier, generateCodeChallenge, generateState.
- **`getOauthProfile.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`index.ts`**: OAuth service that handles the OAuth 2.0 authorization code flow with PKCE.  Supports two ways to get authorization codes: 1. Automatic: Opens browser...

## Direktori: `restored-src/src/services/plugins`

- **`PluginInstallationManager.ts`**: Background plugin and marketplace installation manager  This module handles automatic installation of plugins and marketplaces from trusted sources (r...
- **`pluginCliCommands.ts`**: CLI command wrappers for plugin operations  This module provides thin wrappers around the core plugin operations that handle CLI-specific concerns lik...
- **`pluginOperations.ts`**: Core plugin operations (install, uninstall, enable, disable, update)  This module provides pure library functions that can be used by both: - CLI comm...

## Direktori: `restored-src/src/services/policyLimits`

- **`index.ts`**: Policy Limits Service  Fetches organization-level policy restrictions from the API and uses them to disable CLI features. Follows the same patterns as...
- **`types.ts`**: Schema for the policy limits API response Only blocked policies are included. If a policy key is absent, it's allowed.

## Direktori: `restored-src/src/services/remoteManagedSettings`

- **`index.ts`**: Remote Managed Settings Service  Manages fetching, caching, and validation of remote-managed settings for enterprise customers. Uses checksum-based va...
- **`securityCheck.tsx`**: Check if new remote managed settings contain dangerous settings that require user approval. Shows a blocking dialog if dangerous settings have changed...
- **`syncCache.ts`**: Eligibility check for remote managed settings.  The cache state itself lives in syncCacheState.ts (a leaf, no auth import). This file keeps isRemoteMa...
- **`syncCacheState.ts`**: Leaf state module for the remote-managed-settings sync cache.  Split from syncCache.ts to break the settings.ts → syncCache.ts → auth.ts → settings.ts...
- **`types.ts`**: Schema for the remotely managed settings response. Note: Uses permissive z.record() instead of SettingsSchema to avoid circular dependency. Full valid...

## Direktori: `restored-src/src/services/settingsSync`

- **`index.ts`**: Settings Sync Service  Syncs user settings and memory files across Claude Code environments.  - Interactive CLI: Uploads local settings to remote (inc...
- **`types.ts`**: Settings Sync Types  Zod schemas and types for the user settings sync API. Based on the backend API contract from anthropic/anthropic#218817.

## Direktori: `restored-src/src/services/teamMemorySync`

- **`index.ts`**: Team Memory Sync Service  Syncs team memory files between the local filesystem and the server API. Team memory is scoped per-repo (identified by git r...
- **`secretScanner.ts`**: Client-side secret scanner for team memory (PSR M22174).  Scans content for credentials before upload so secrets never leave the user's machine. Uses ...
- **`teamMemSecretGuard.ts`**: Check if a file write/edit to a team memory path contains secrets. Returns an error message if secrets are detected, or null if safe.  This is called ...
- **`types.ts`**: Team Memory Sync Types  Zod schemas and types for the repo-scoped team memory sync API. Based on the backend API contract from anthropic/anthropic#250...
- **`watcher.ts`**: Team Memory File Watcher  Watches the team memory directory for changes and triggers a debounced push to the server when files are modified. Performs ...

## Direktori: `restored-src/src/services/tips`

- **`tipHistory.ts`**: Mengekspor: recordTipShown, getSessionsSinceLastShown.
- **`tipRegistry.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`tipScheduler.ts`**: Mengekspor: selectTipWithLongestTimeSinceShown, recordShownTip.

## Direktori: `restored-src/src/services/toolUseSummary`

- **`toolUseSummaryGenerator.ts`**: Tool Use Summary Generator  Generates human-readable summaries of completed tool batches using Haiku. Used by the SDK to provide high-level progress u...

## Direktori: `restored-src/src/services/tools`

- **`StreamingToolExecutor.ts`**: Mengekspor: StreamingToolExecutor.
- **`toolExecution.ts`**: Mengekspor: HOOK_TIMING_DISPLAY_THRESHOLD_MS, classifyToolError, MessageUpdateLazy.
- **`toolHooks.ts`**: Mengekspor: PostToolUseHooksResult.
- **`toolOrchestration.ts`**: Mengekspor: MessageUpdate.

## Direktori: `restored-src/src/skills/bundled`

- **`batch.ts`**: Mengekspor: registerBatchSkill.
- **`claudeApi.ts`**: Mengekspor: registerClaudeApiSkill.
- **`claudeApiContent.ts`**: Mengekspor: SKILL_MODEL_VARS, SKILL_PROMPT, SKILL_FILES.
- **`claudeInChrome.ts`**: Mengekspor: registerClaudeInChromeSkill.
- **`debug.ts`**: Mengekspor: registerDebugSkill.
- **`index.ts`**: Initialize all bundled skills. Called at startup to register skills that ship with the CLI.  To add a new bundled skill: 1. Create a new file in src/s...
- **`keybindings.ts`**: Build a markdown table of all contexts.
- **`loop.ts`**: Mengekspor: registerLoopSkill.
- **`loremIpsum.ts`**: Mengekspor: registerLoremIpsumSkill.
- **`remember.ts`**: Mengekspor: registerRememberSkill.
- **`scheduleRemoteAgents.ts`**: Decode a mcpsrv_ tagged ID to a UUID string. Tagged IDs have format: mcpsrv_01{base58(uuid.int)} where 01 is the version prefix.
- **`simplify.ts`**: Mengekspor: registerSimplifySkill.
- **`skillify.ts`**: Mengekspor: registerSkillifySkill.
- **`stuck.ts`**: Mengekspor: registerStuckSkill.
- **`updateConfig.ts`**: Generate JSON Schema from the settings Zod schema. This keeps the skill prompt in sync with the actual types.
- **`verify.ts`**: Mengekspor: registerVerifySkill.
- **`verifyContent.ts`**: Mengekspor: SKILL_MD, SKILL_FILES.

## Direktori: `restored-src/src/skills`

- **`bundledSkills.ts`**: Definition for a bundled skill that ships with the CLI. These are registered programmatically at startup.
- **`loadSkillsDir.ts`**: Mengekspor: LoadedFrom, getSkillsPath, estimateSkillFrontmatterTokens.
- **`mcpSkillBuilders.ts`**: Write-once registry for the two loadSkillsDir functions that MCP skill discovery needs. This module is a dependency-graph leaf: it imports nothing but...

## Direktori: `restored-src/src/state`

- **`AppState.tsx`**: Mengekspor: AppStoreContext, AppStateProvider, useAppState.
- **`AppStateStore.ts`**: Mengekspor: CompletionBoundary, SpeculationResult, SpeculationState.
- **`onChangeAppState.ts`**: Mengekspor: externalMetadataToAppState, onChangeAppState.
- **`selectors.ts`**: Selectors for deriving computed state from AppState. Keep selectors pure and simple - just data extraction, no side effects.
- **`store.ts`**: Mengekspor: Store, createStore.
- **`teammateViewHelpers.ts`**: Return the task released back to stub form: retain dropped, messages cleared, evictAfter set if terminal. Shared by exitTeammateView and the switch-aw...

## Direktori: `restored-src/src/tasks/DreamTask`

- **`DreamTask.ts`**: Paths observed in Edit/Write tool_use blocks via onMessage. This is an

## Direktori: `restored-src/src/tasks/InProcessTeammateTask`

- **`InProcessTeammateTask.tsx`**: InProcessTeammateTask - Manages in-process teammate lifecycle  This component implements the Task interface for in-process teammates. Unlike LocalAgen...
- **`types.ts`**: Teammate identity stored in task state. Same shape as TeammateContext (runtime) but stored as plain data. TeammateContext is for AsyncLocalStorage; th...

## Direktori: `restored-src/src/tasks/LocalAgentTask`

- **`LocalAgentTask.tsx`**: Pre-computed activity description from the tool, e.g. "Reading src/foo.ts"

## Direktori: `restored-src/src/tasks`

- **`LocalMainSessionTask.ts`**: LocalMainSessionTask - Handles backgrounding the main session query.  When user presses Ctrl+B twice during a query, the session is "backgrounded": - ...
- **`pillLabel.ts`**: Produces the compact footer-pill label for a set of background tasks. Used by both the footer pill and the turn-duration transcript line so the two su...
- **`stopTask.ts`**: Mengekspor: StopTaskError.
- **`types.ts`**: Mengekspor: TaskState, BackgroundTaskState, isBackgroundTask.

## Direktori: `restored-src/src/tasks/LocalShellTask`

- **`LocalShellTask.tsx`**: Prefix that identifies a LocalShellTask summary to the UI collapse transform.
- **`guards.ts`**: Mengekspor: BashTaskKind, LocalShellTaskState, isLocalShellTask.
- **`killShellTasks.ts`**: Mengekspor: killTask, killShellTasksForAgent.

## Direktori: `restored-src/src/tasks/RemoteAgentTask`

- **`RemoteAgentTask.tsx`**: Task-specific metadata (PR number, repo, etc.).

## Direktori: `restored-src/src/tools/AgentTool`

- **`AgentTool.tsx`**: Mengekspor: inputSchema, outputSchema, RemoteLaunchedOutput.
- **`UI.tsx`**: Mengekspor: AgentPromptDisplay, AgentResponseDisplay, renderToolResultMessage.
- **`agentColorManager.ts`**: Mengekspor: AgentColorName, AGENT_COLORS, AGENT_COLOR_TO_THEME_COLOR.
- **`agentDisplay.ts`**: Shared utilities for displaying agent information. Used by both the CLI `claude agents` handler and the interactive `/agents` command.
- **`agentMemory.ts`**: Sanitize an agent type name for use as a directory name. Replaces colons (invalid on Windows, used in plugin-namespaced agent types like "my-plugin:my...
- **`agentMemorySnapshot.ts`**: Returns the path to the snapshot directory for an agent in the current project. e.g., <cwd>/.claude/agent-memory-snapshots/<agentType>/
- **`agentToolUtils.ts`**: Mengekspor: ResolvedAgentTools, filterToolsForAgent, resolveAgentTools.
- **`builtInAgents.ts`**: Mengekspor: areExplorePlanAgentsEnabled, getBuiltInAgents.
- **`constants.ts`**: Mengekspor: AGENT_TOOL_NAME, LEGACY_AGENT_TOOL_NAME, VERIFICATION_AGENT_TYPE.
- **`forkSubagent.ts`**: Fork subagent feature gate.  When enabled: - `subagent_type` becomes optional on the Agent tool schema - Omitting `subagent_type` triggers an implicit...
- **`loadAgentsDir.ts`**: Mengekspor: AgentMcpServerSpec, BaseAgentDefinition, BuiltInAgentDefinition.
- **`prompt.ts`**: Mengekspor: formatAgentLine, shouldInjectAgentListInMessages.
- **`resumeAgent.ts`**: Mengekspor: ResumeAgentResult.
- **`runAgent.ts`**: Mengekspor: filterIncompleteToolCalls.

## Direktori: `restored-src/src/tools/AgentTool/built-in`

- **`claudeCodeGuideAgent.ts`**: Mengekspor: CLAUDE_CODE_GUIDE_AGENT_TYPE, CLAUDE_CODE_GUIDE_AGENT.
- **`exploreAgent.ts`**: Mengekspor: EXPLORE_AGENT_MIN_QUERIES, EXPLORE_AGENT.
- **`generalPurposeAgent.ts`**: Mengekspor: GENERAL_PURPOSE_AGENT.
- **`planAgent.ts`**: Mengekspor: PLAN_AGENT.
- **`statuslineSetup.ts`**: Mengekspor: STATUSLINE_SETUP_AGENT.
- **`verificationAgent.ts`**: Mengekspor: VERIFICATION_AGENT.

## Direktori: `restored-src/src/tools/AskUserQuestionTool`

- **`AskUserQuestionTool.tsx`**: Mengekspor: _sdkInputSchema, _sdkOutputSchema, Question.
- **`prompt.ts`**: Mengekspor: ASK_USER_QUESTION_TOOL_NAME, ASK_USER_QUESTION_TOOL_CHIP_WIDTH, DESCRIPTION.

## Direktori: `restored-src/src/tools/BashTool`

- **`BashTool.tsx`**: Mengekspor: isSearchOrReadBashCommand, BashToolInput, Out.
- **`BashToolResultMessage.tsx`**: Extracts sandbox violations from stderr if present Returns both the cleaned stderr and the violations content
- **`UI.tsx`**: Mengekspor: BackgroundHint, renderToolUseMessage, renderToolUseProgressMessage.
- **`bashCommandHelpers.ts`**: Mengekspor: CommandIdentityCheckers.
- **`bashPermissions.ts`**: Mengekspor: MAX_SUBCOMMANDS_FOR_SECURITY_CHECK, MAX_SUGGESTED_RULES_FOR_COMPOUND, getSimpleCommandPrefix.
- **`bashSecurity.ts`**: Mengekspor: stripSafeHeredocSubstitutions, hasSafeHeredocSubstitution, bashCommandIsSafe_DEPRECATED.
- **`commandSemantics.ts`**: Command semantics configuration for interpreting exit codes in different contexts.  Many commands use exit codes to convey information other than just...
- **`commentLabel.ts`**: If the first line of a bash command is a `# comment` (not a `#!` shebang), return the comment text stripped of the `#` prefix. Otherwise undefined.  U...
- **`destructiveCommandWarning.ts`**: Detects potentially destructive bash commands and returns a warning string for display in the permission dialog. This is purely informational — it doe...
- **`modeValidation.ts`**: Mengekspor: checkPermissionMode, getAutoAllowedCommands.
- **`pathValidation.ts`**: Mengekspor: PathCommand, PATH_EXTRACTORS, COMMAND_OPERATION_TYPE.
- **`prompt.ts`**: Mengekspor: getDefaultTimeoutMs, getMaxTimeoutMs, getSimplePrompt.
- **`readOnlyValidation.ts`**: Mengekspor: isCommandSafeViaFlagParsing, checkReadOnlyConstraints.
- **`sedEditParser.ts`**: Parser for sed edit commands (-i flag substitutions) Extracts file paths and substitution patterns to enable file-edit-style rendering
- **`sedValidation.ts`**: Helper: Validate flags against an allowlist Handles both single flags and combined flags (e.g., -nE) @param flags Array of flags to validate @param al...
- **`shouldUseSandbox.ts`**: Mengekspor: shouldUseSandbox.
- **`toolName.ts`**: Mengekspor: BASH_TOOL_NAME.
- **`utils.ts`**: Strips leading and trailing lines that contain only whitespace/newlines. Unlike trim(), this preserves whitespace within content lines and only remove...

## Direktori: `restored-src/src/tools/BriefTool`

- **`BriefTool.ts`**: Mengekspor: Output, isBriefEntitled, isBriefEnabled.
- **`UI.tsx`**: Mengekspor: renderToolUseMessage, renderToolResultMessage, AttachmentList.
- **`attachments.ts`**: Shared attachment validation + resolution for SendUserMessage and SendUserFile. Lives in BriefTool/ so the dynamic `./upload.js` import inside the fea...
- **`prompt.ts`**: Mengekspor: BRIEF_TOOL_NAME, LEGACY_BRIEF_TOOL_NAME, DESCRIPTION.
- **`upload.ts`**: Upload BriefTool attachments to private_api so web viewers can preview them.  When the repl bridge is active, attachment paths are meaningless to a we...

## Direktori: `restored-src/src/tools/ConfigTool`

- **`ConfigTool.ts`**: Mengekspor: Input, Output, ConfigTool.
- **`UI.tsx`**: Mengekspor: renderToolUseMessage, renderToolResultMessage, renderToolUseRejectedMessage.
- **`constants.ts`**: Mengekspor: CONFIG_TOOL_NAME.
- **`prompt.ts`**: Generate the prompt documentation from the registry
- **`supportedSettings.ts`**: AppState keys that can be synced for immediate UI effect

## Direktori: `restored-src/src/tools/EnterPlanModeTool`

- **`EnterPlanModeTool.ts`**: Mengekspor: Output, EnterPlanModeTool.
- **`UI.tsx`**: Mengekspor: renderToolUseMessage, renderToolResultMessage, renderToolUseRejectedMessage.
- **`constants.ts`**: Mengekspor: ENTER_PLAN_MODE_TOOL_NAME.
- **`prompt.ts`**: Mengekspor: getEnterPlanModeToolPrompt.

## Direktori: `restored-src/src/tools/EnterWorktreeTool`

- **`EnterWorktreeTool.ts`**: Mengekspor: Output, EnterWorktreeTool.
- **`UI.tsx`**: Mengekspor: renderToolUseMessage, renderToolResultMessage.
- **`constants.ts`**: Mengekspor: ENTER_WORKTREE_TOOL_NAME.
- **`prompt.ts`**: Mengekspor: getEnterWorktreeToolPrompt.

## Direktori: `restored-src/src/tools/ExitPlanModeTool`

- **`ExitPlanModeV2Tool.ts`**: Mengekspor: AllowedPrompt, _sdkInputSchema, outputSchema.
- **`UI.tsx`**: Mengekspor: renderToolUseMessage, renderToolResultMessage, renderToolUseRejectedMessage.
- **`constants.ts`**: Mengekspor: EXIT_PLAN_MODE_TOOL_NAME, EXIT_PLAN_MODE_V2_TOOL_NAME.
- **`prompt.ts`**: Mengekspor: EXIT_PLAN_MODE_V2_TOOL_PROMPT.

## Direktori: `restored-src/src/tools/ExitWorktreeTool`

- **`ExitWorktreeTool.ts`**: Mengekspor: Output, ExitWorktreeTool.
- **`UI.tsx`**: Mengekspor: renderToolUseMessage, renderToolResultMessage.
- **`constants.ts`**: Mengekspor: EXIT_WORKTREE_TOOL_NAME.
- **`prompt.ts`**: Mengekspor: getExitWorktreeToolPrompt.

## Direktori: `restored-src/src/tools/FileEditTool`

- **`FileEditTool.ts`**: Mengekspor: FileEditTool.
- **`UI.tsx`**: Mengekspor: userFacingName, getToolUseSummary, renderToolUseMessage.
- **`constants.ts`**: Mengekspor: FILE_EDIT_TOOL_NAME, CLAUDE_FOLDER_PERMISSION_PATTERN, GLOBAL_CLAUDE_FOLDER_PERMISSION_PATTERN.
- **`prompt.ts`**: Mengekspor: getEditToolDescription.
- **`types.ts`**: Mengekspor: FileEditInput, EditInput, FileEdit.
- **`utils.ts`**: Normalizes quotes in a string by converting curly quotes to straight quotes @param str The string to normalize @returns The string with all curly quot...

## Direktori: `restored-src/src/tools/FileReadTool`

- **`FileReadTool.ts`**: Mengekspor: registerFileReadListener, MaxFileReadTokenExceededError, Input.
- **`UI.tsx`**: Check if a file path is an agent output file and extract the task ID. Agent output files follow the pattern: {projectTempDir}/tasks/{taskId}.output
- **`imageProcessor.ts`**: Mengekspor: SharpInstance, SharpFunction.
- **`limits.ts`**: Read tool output limits.  Two caps apply to text reads:  | limit         | default | checks                    | cost          | on overflow     | |--...
- **`prompt.ts`**: Renders the Read tool prompt template.  The caller (FileReadTool) supplies the runtime-computed parts.

## Direktori: `restored-src/src/tools/FileWriteTool`

- **`FileWriteTool.ts`**: Mengekspor: Output, FileWriteToolInput, FileWriteTool.
- **`UI.tsx`**: Mengekspor: countLines, userFacingName, isResultTruncated.
- **`prompt.ts`**: Mengekspor: FILE_WRITE_TOOL_NAME, DESCRIPTION, getWriteToolDescription.

## Direktori: `restored-src/src/tools/GlobTool`

- **`GlobTool.ts`**: Mengekspor: Output, GlobTool.
- **`UI.tsx`**: Mengekspor: userFacingName, renderToolUseMessage, renderToolUseErrorMessage.
- **`prompt.ts`**: Mengekspor: GLOB_TOOL_NAME, DESCRIPTION.

## Direktori: `restored-src/src/tools/GrepTool`

- **`GrepTool.ts`**: Mengekspor: GrepTool.
- **`UI.tsx`**: Mengekspor: renderToolUseMessage, renderToolUseErrorMessage, renderToolResultMessage.
- **`prompt.ts`**: Mengekspor: GREP_TOOL_NAME, getDescription.

## Direktori: `restored-src/src/tools/LSPTool`

- **`LSPTool.ts`**: Mengekspor: Output, Input, LSPTool.
- **`UI.tsx`**: Mengekspor: userFacingName, renderToolUseMessage, renderToolUseErrorMessage.
- **`formatters.ts`**: Formats a URI by converting it to a relative path if possible. Handles URI decoding and gracefully falls back to un-decoded path if malformed. Only us...
- **`prompt.ts`**: Mengekspor: LSP_TOOL_NAME, DESCRIPTION.
- **`schemas.ts`**: Discriminated union of all LSP operations Uses 'operation' as the discriminator field
- **`symbolContext.ts`**: Extracts the symbol/word at a specific position in a file. Used to show context in tool use messages.  @param filePath - The file path (absolute or re...

## Direktori: `restored-src/src/tools/ListMcpResourcesTool`

- **`ListMcpResourcesTool.ts`**: Mengekspor: Output, ListMcpResourcesTool.
- **`UI.tsx`**: Mengekspor: renderToolUseMessage, renderToolResultMessage.
- **`prompt.ts`**: Mengekspor: LIST_MCP_RESOURCES_TOOL_NAME, DESCRIPTION, PROMPT.

## Direktori: `restored-src/src/tools/MCPTool`

- **`MCPTool.ts`**: Mengekspor: inputSchema, outputSchema, Output.
- **`UI.tsx`**: Mengekspor: renderToolUseMessage, renderToolUseProgressMessage, renderToolResultMessage.
- **`classifyForCollapse.ts`**: Classify an MCP tool as a search/read operation for UI collapsing. Returns { isSearch: false, isRead: false } for tools that should not collapse (e.g....
- **`prompt.ts`**: Mengekspor: PROMPT, DESCRIPTION.

## Direktori: `restored-src/src/tools/McpAuthTool`

- **`McpAuthTool.ts`**: Mengekspor: McpAuthOutput, createMcpAuthTool.

## Direktori: `restored-src/src/tools/NotebookEditTool`

- **`NotebookEditTool.ts`**: Mengekspor: inputSchema, outputSchema, Output.
- **`UI.tsx`**: Mengekspor: getToolUseSummary, renderToolUseMessage, renderToolUseRejectedMessage.
- **`constants.ts`**: Mengekspor: NOTEBOOK_EDIT_TOOL_NAME.
- **`prompt.ts`**: Mengekspor: DESCRIPTION, PROMPT.

## Direktori: `restored-src/src/tools/PowerShellTool`

- **`PowerShellTool.tsx`**: Mengekspor: detectBlockedSleepPattern, PowerShellToolInput, Out.
- **`UI.tsx`**: Mengekspor: renderToolUseMessage, renderToolUseProgressMessage, renderToolUseQueuedMessage.
- **`clmTypes.ts`**: PowerShell Constrained Language Mode allowed types.  Microsoft's CLM restricts .NET type usage to this allowlist when PS runs under AppLocker/WDAC sys...
- **`commandSemantics.ts`**: Command semantics configuration for interpreting exit codes in PowerShell.  PowerShell-native cmdlets do NOT need exit-code semantics: - Select-String...
- **`commonParameters.ts`**: PowerShell Common Parameters (available on all cmdlets via [CmdletBinding()]). Source: about_CommonParameters (PowerShell docs) + Get-Command output. ...
- **`destructiveCommandWarning.ts`**: Detects potentially destructive PowerShell commands and returns a warning string for display in the permission dialog. This is purely informational --...
- **`gitSafety.ts`**: Git can be weaponized for sandbox escape via two vectors: 1. Bare-repo attack: if cwd contains HEAD + objects/ + refs/ but no valid .git/HEAD, Git tre...
- **`modeValidation.ts`**: PowerShell permission mode validation.  Checks if commands should be auto-allowed based on the current permission mode. In acceptEdits mode, filesyste...
- **`pathValidation.ts`**: PowerShell-specific path validation for command arguments.  Extracts file paths from PowerShell commands using the AST parser and validates they stay ...
- **`powershellPermissions.ts`**: PowerShell-specific permission checking, adapted from bashPermissions.ts for case-insensitive cmdlet matching.
- **`powershellSecurity.ts`**: PowerShell-specific security analysis for command validation.  Detects dangerous patterns: code injection, download cradles, privilege escalation, dyn...
- **`prompt.ts`**: Mengekspor: getDefaultTimeoutMs, getMaxTimeoutMs.
- **`readOnlyValidation.ts`**: PowerShell read-only command validation.  Cmdlets are case-insensitive; all matching is done in lowercase.
- **`toolName.ts`**: Mengekspor: POWERSHELL_TOOL_NAME.

## Direktori: `restored-src/src/tools/REPLTool`

- **`constants.ts`**: REPL mode is default-on for ants in the interactive CLI (opt out with CLAUDE_CODE_REPL=0). The legacy CLAUDE_REPL_MODE=1 also forces it on.  SDK entry...
- **`primitiveTools.ts`**: Primitive tools hidden from direct model use when REPL mode is on (REPL_ONLY_TOOLS) but still accessible inside the REPL VM context. Exported so displ...

## Direktori: `restored-src/src/tools/ReadMcpResourceTool`

- **`ReadMcpResourceTool.ts`**: Mengekspor: inputSchema, outputSchema, Output.
- **`UI.tsx`**: Mengekspor: renderToolUseMessage, userFacingName, renderToolResultMessage.
- **`prompt.ts`**: Mengekspor: DESCRIPTION, PROMPT.

## Direktori: `restored-src/src/tools/RemoteTriggerTool`

- **`RemoteTriggerTool.ts`**: Mengekspor: Input, Output, RemoteTriggerTool.
- **`UI.tsx`**: Mengekspor: renderToolUseMessage, renderToolResultMessage.
- **`prompt.ts`**: Mengekspor: REMOTE_TRIGGER_TOOL_NAME, DESCRIPTION, PROMPT.

## Direktori: `restored-src/src/tools/ScheduleCronTool`

- **`CronCreateTool.ts`**: Mengekspor: CreateOutput, CronCreateTool.
- **`CronDeleteTool.ts`**: Mengekspor: DeleteOutput, CronDeleteTool.
- **`CronListTool.ts`**: Mengekspor: ListOutput, CronListTool.
- **`UI.tsx`**: Mengekspor: renderCreateToolUseMessage, renderCreateResultMessage, renderDeleteToolUseMessage.
- **`prompt.ts`**: Unified gate for the cron scheduling system. Combines the build-time `feature('AGENT_TRIGGERS')` flag (dead code elimination) with the runtime `tengu_...

## Direktori: `restored-src/src/tools/SendMessageTool`

- **`SendMessageTool.ts`**: Mengekspor: Input, MessageRouting, MessageOutput.
- **`UI.tsx`**: Mengekspor: renderToolUseMessage, renderToolResultMessage.
- **`constants.ts`**: Mengekspor: SEND_MESSAGE_TOOL_NAME.
- **`prompt.ts`**: Mengekspor: DESCRIPTION, getPrompt.

## Direktori: `restored-src/src/tools/SkillTool`

- **`SkillTool.ts`**: Mengekspor: inputSchema, outputSchema, Output.
- **`UI.tsx`**: Mengekspor: renderToolResultMessage, renderToolUseMessage, renderToolUseProgressMessage.
- **`constants.ts`**: Mengekspor: SKILL_TOOL_NAME.
- **`prompt.ts`**: Mengekspor: SKILL_BUDGET_CONTEXT_PERCENT, CHARS_PER_TOKEN, DEFAULT_CHAR_BUDGET.

## Direktori: `restored-src/src/tools/SleepTool`

- **`prompt.ts`**: Mengekspor: SLEEP_TOOL_NAME, DESCRIPTION, SLEEP_TOOL_PROMPT.

## Direktori: `restored-src/src/tools/SyntheticOutputTool`

- **`SyntheticOutputTool.ts`**: Mengekspor: Output, SYNTHETIC_OUTPUT_TOOL_NAME, isSyntheticOutputToolEnabled.

## Direktori: `restored-src/src/tools/TaskCreateTool`

- **`TaskCreateTool.ts`**: Mengekspor: Output, TaskCreateTool.
- **`constants.ts`**: Mengekspor: TASK_CREATE_TOOL_NAME.
- **`prompt.ts`**: Mengekspor: DESCRIPTION, getPrompt.

## Direktori: `restored-src/src/tools/TaskGetTool`

- **`TaskGetTool.ts`**: Mengekspor: Output, TaskGetTool.
- **`constants.ts`**: Mengekspor: TASK_GET_TOOL_NAME.
- **`prompt.ts`**: Mengekspor: DESCRIPTION, PROMPT.

## Direktori: `restored-src/src/tools/TaskListTool`

- **`TaskListTool.ts`**: Mengekspor: Output, TaskListTool.
- **`constants.ts`**: Mengekspor: TASK_LIST_TOOL_NAME.
- **`prompt.ts`**: Mengekspor: DESCRIPTION, getPrompt.

## Direktori: `restored-src/src/tools/TaskOutputTool`

- **`TaskOutputTool.tsx`**: Mengekspor: TaskOutputTool.
- **`constants.ts`**: Mengekspor: TASK_OUTPUT_TOOL_NAME.

## Direktori: `restored-src/src/tools/TaskStopTool`

- **`TaskStopTool.ts`**: Mengekspor: Output, TaskStopTool.
- **`UI.tsx`**: Mengekspor: renderToolUseMessage, renderToolResultMessage.
- **`prompt.ts`**: Mengekspor: TASK_STOP_TOOL_NAME, DESCRIPTION.

## Direktori: `restored-src/src/tools/TaskUpdateTool`

- **`TaskUpdateTool.ts`**: Mengekspor: Output, TaskUpdateTool.
- **`constants.ts`**: Mengekspor: TASK_UPDATE_TOOL_NAME.
- **`prompt.ts`**: Mengekspor: DESCRIPTION, PROMPT.

## Direktori: `restored-src/src/tools/TeamCreateTool`

- **`TeamCreateTool.ts`**: Mengekspor: Output, Input, TeamCreateTool.
- **`UI.tsx`**: Mengekspor: renderToolUseMessage.
- **`constants.ts`**: Mengekspor: TEAM_CREATE_TOOL_NAME.
- **`prompt.ts`**: Mengekspor: getPrompt.

## Direktori: `restored-src/src/tools/TeamDeleteTool`

- **`TeamDeleteTool.ts`**: Mengekspor: Output, Input, TeamDeleteTool.
- **`UI.tsx`**: Mengekspor: renderToolUseMessage, renderToolResultMessage.
- **`constants.ts`**: Mengekspor: TEAM_DELETE_TOOL_NAME.
- **`prompt.ts`**: Mengekspor: getPrompt.

## Direktori: `restored-src/src/tools/TodoWriteTool`

- **`TodoWriteTool.ts`**: Mengekspor: Output, TodoWriteTool.
- **`constants.ts`**: Mengekspor: TODO_WRITE_TOOL_NAME.
- **`prompt.ts`**: Mengekspor: PROMPT, DESCRIPTION.

## Direktori: `restored-src/src/tools/ToolSearchTool`

- **`ToolSearchTool.ts`**: Mengekspor: inputSchema, outputSchema, Output.
- **`constants.ts`**: Mengekspor: TOOL_SEARCH_TOOL_NAME.
- **`prompt.ts`**: Mengekspor: isDeferredTool, formatDeferredToolLine, getPrompt.

## Direktori: `restored-src/src/tools/WebFetchTool`

- **`UI.tsx`**: Mengekspor: renderToolUseMessage, renderToolUseProgressMessage, renderToolResultMessage.
- **`WebFetchTool.ts`**: Mengekspor: Output, WebFetchTool.
- **`preapproved.ts`**: Mengekspor: PREAPPROVED_HOSTS, isPreapprovedHost.
- **`prompt.ts`**: Mengekspor: WEB_FETCH_TOOL_NAME, DESCRIPTION, makeSecondaryModelPrompt.
- **`utils.ts`**: Mengekspor: clearWebFetchCache, MAX_MARKDOWN_LENGTH, isPreapprovedUrl.

## Direktori: `restored-src/src/tools/WebSearchTool`

- **`UI.tsx`**: Mengekspor: renderToolUseMessage, renderToolUseProgressMessage, renderToolResultMessage.
- **`WebSearchTool.ts`**: Mengekspor: SearchResult, Output, WebSearchTool.
- **`prompt.ts`**: Mengekspor: WEB_SEARCH_TOOL_NAME, getWebSearchPrompt.

## Direktori: `restored-src/src/tools/shared`

- **`gitOperationTracking.ts`**: Shell-agnostic git operation tracking for usage metrics.  Detects `git commit`, `git push`, `gh pr create`, `glab mr create`, and curl-based PR creati...
- **`spawnMultiAgent.ts`**: Shared spawn module for teammate creation. Extracted from TeammateTool to allow reuse by AgentTool.

## Direktori: `restored-src/src/tools/testing`

- **`TestingPermissionTool.tsx`**: This testing-only tool will always pop up a permission dialog when called by the model.

## Direktori: `restored-src/src/tools`

- **`utils.ts`**: Tags user messages with a sourceToolUseID so they stay transient until the tool resolves. This prevents the "is running" message from being duplicated...

## Direktori: `restored-src/src/types`

- **`command.ts`**: Mengekspor: LocalCommandResult, PromptCommand, LocalCommandCall.
- **`hooks.ts`**: Mengekspor: isHookEvent, promptRequestSchema, PromptRequest.
- **`ids.ts`**: Branded types for session and agent IDs. These prevent accidentally mixing up session IDs and agent IDs at compile time.
- **`logs.ts`**: Mengekspor: SerializedMessage, LogOption, SummaryMessage.
- **`permissions.ts`**: Pure permission type definitions extracted to break import cycles.  This file contains only type definitions and constants with no runtime dependencie...
- **`plugin.ts`**: Definition for a built-in plugin that ships with the CLI. Built-in plugins appear in the /plugin UI and can be enabled/disabled by users (persisted to...
- **`textInputTypes.ts`**: Inline ghost text for mid-input command autocomplete

## Direktori: `restored-src/src/types/generated/events_mono/claude_code/v1`

- **`claude_code_internal_event.ts`**: Mengekspor: GitHubActionsMetadata, EnvironmentMetadata, SlackContext.

## Direktori: `restored-src/src/types/generated/events_mono/common/v1`

- **`auth.ts`**: Mengekspor: PublicApiAuth, PublicApiAuth.

## Direktori: `restored-src/src/types/generated/events_mono/growthbook/v1`

- **`growthbook_experiment_event.ts`**: Mengekspor: GrowthbookExperimentEvent, GrowthbookExperimentEvent.

## Direktori: `restored-src/src/types/generated/google/protobuf`

- **`timestamp.ts`**: Mengekspor: Timestamp, Timestamp.

## Direktori: `restored-src/src/upstreamproxy`

- **`relay.ts`**: Mengekspor: encodeChunk, decodeChunk, UpstreamProxyRelay.
- **`upstreamproxy.ts`**: CCR upstreamproxy — container-side wiring.  When running inside a CCR session container with upstreamproxy configured, this module: 1. Reads the sessi...

## Direktori: `restored-src/src/utils`

- **`CircularBuffer.ts`**: A fixed-size circular buffer that automatically evicts the oldest items when the buffer is full. Useful for maintaining a rolling window of data.
- **`Cursor.ts`**: Kill ring for storing killed (cut) text that can be yanked (pasted) with Ctrl+Y. This is global state that shares one kill ring across all input field...
- **`QueryGuard.ts`**: Synchronous state machine for the query lifecycle, compatible with React's `useSyncExternalStore`.  Three states: idle        → no query, safe to dequ...
- **`Shell.ts`**: Mengekspor: ShellConfig, getShellConfig, getPsProvider.
- **`ShellCommand.ts`**: Set when assistant-mode auto-backgrounded a long-running blocking command.
- **`abortController.ts`**: Default max listeners for standard operations
- **`activityManager.ts`**: ActivityManager handles generic activity tracking for both user and CLI operations. It automatically deduplicates overlapping activities and provides ...
- **`advisor.ts`**: Mengekspor: AdvisorServerToolUseBlock, AdvisorToolResultBlock, AdvisorBlock.
- **`agentContext.ts`**: Agent context for analytics attribution using AsyncLocalStorage.  This module provides a way to track agent identity across async operations without p...
- **`agentId.ts`**: Deterministic Agent ID System  This module provides helper functions for formatting and parsing deterministic agent IDs used in the swarm/teammate sys...
- **`agentSwarmsEnabled.ts`**: Check if --agent-teams flag is provided via CLI. Checks process.argv directly to avoid import cycles with bootstrap/state. Note: The flag is only show...
- **`agenticSessionSearch.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`analyzeContext.ts`**: Mengekspor: TOOL_TOKEN_COUNT_OVERHEAD, DeferredBuiltinTool, SystemToolDetail.
- **`ansiToPng.ts`**: Render ANSI-escaped terminal text directly to a PNG image.  Replaces the previous ansiToSvg → @resvg/resvg-wasm pipeline. The SVG was just a lossy int...
- **`ansiToSvg.ts`**: Converts ANSI-escaped terminal text to SVG format Supports basic ANSI color codes (foreground colors)
- **`api.ts`**: Mengekspor: CacheScope, SystemPromptBlock, logAPIPrefix.
- **`apiPreconnect.ts`**: Preconnect to the Anthropic API to overlap TCP+TLS handshake with startup.  The TCP+TLS handshake is ~100-200ms that normally blocks inside the first ...
- **`appleTerminalBackup.ts`**: Mengekspor: markTerminalSetupInProgress, markTerminalSetupComplete, getTerminalPlistPath.
- **`argumentSubstitution.ts`**: Utility for substituting $ARGUMENTS placeholders in skill/command prompts.  Supports: - $ARGUMENTS - replaced with the full arguments string - $ARGUME...
- **`array.ts`**: Mengekspor: intersperse, count, uniq.
- **`asciicast.ts`**: Get the asciicast recording file path. For ants with CLAUDE_CODE_TERMINAL_RECORDING=1: returns a path. Otherwise: returns null. The path is computed o...
- **`attachments.ts`**: Mengekspor: TODO_REMINDER_CONFIG, PLAN_MODE_ATTACHMENT_CONFIG, AUTO_MODE_ATTACHMENT_CONFIG.
- **`attribution.ts`**: Mengekspor: AttributionTexts, getAttributionTexts, countUserPromptsInMessages.
- **`auth.ts`**: Mengekspor: isAnthropicAuthEnabled, getAuthTokenSource, ApiKeySource.
- **`authFileDescriptor.ts`**: Well-known token file locations in CCR. The Go environment-manager creates /home/claude/.claude/remote/ and will (eventually) write these files too. U...
- **`authPortable.ts`**: Mengekspor: normalizeApiKeyForConfig.
- **`autoModeDenials.ts`**: Tracks commands recently denied by the auto mode classifier. Populated from useCanUseTool.ts, read from RecentDenialsTab.tsx in /permissions.
- **`autoRunIssue.tsx`**: Component that shows a notification about running /issue command with the ability to cancel via ESC key
- **`autoUpdater.ts`**: Mengekspor: InstallStatus, AutoUpdaterResult, MaxVersionConfig.
- **`aws.ts`**: AWS short-term credentials format.
- **`awsAuthStatusManager.ts`**: Singleton manager for cloud-provider authentication status (AWS Bedrock, GCP Vertex). Communicates auth refresh state between auth utilities and React...
- **`backgroundHousekeeping.ts`**: Mengekspor: startBackgroundHousekeeping.
- **`betas.ts`**: Mengekspor: filterAllowedSdkBetas, modelSupportsISP, modelSupportsContextManagement.
- **`billing.ts`**: Mengekspor: hasConsoleBillingAccess, setMockBillingAccessOverride, hasClaudeAiBillingAccess.
- **`binaryCheck.ts`**: Check if a binary/command is installed and available on the system. Uses 'which' on Unix systems (macOS, Linux, WSL) and 'where' on Windows.  @param c...
- **`browser.ts`**: Open a file or folder path using the system's default handler. Uses `open` on macOS, `explorer` on Windows, `xdg-open` on Linux.
- **`bufferedWriter.ts`**: Mengekspor: BufferedWriter, createBufferedWriter.
- **`bundledMode.ts`**: Detects if the current runtime is Bun. Returns true when: - Running a JS file via the `bun` command - Running a Bun-compiled standalone executable
- **`caCerts.ts`**: Load CA certificates for TLS connections.  Since setting `ca` on an HTTPS agent replaces the default certificate store, we must always include base CA...
- **`caCertsConfig.ts`**: Config/settings-backed NODE_EXTRA_CA_CERTS population for `caCerts.ts`.  Split from `caCerts.ts` because `config.ts` → `file.ts` → `permissions/filesy...
- **`cachePaths.ts`**: Mengekspor: CACHE_PATHS.
- **`classifierApprovals.ts`**: Tracks which tool uses were auto-approved by classifiers. Populated from useCanUseTool.ts and permissions.ts, read from UserToolSuccessMessage.tsx.
- **`classifierApprovalsHook.ts`**: React hook for classifierApprovals store. Split from classifierApprovals.ts so pure-state importers (permissions.ts, toolExecution.ts, postCompactClea...
- **`claudeCodeHints.ts`**: Claude Code hints protocol.  CLIs and SDKs running under Claude Code can emit a self-closing `<claude-code-hint />` tag to stderr (merged into stdout ...
- **`claudeDesktop.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`claudemd.ts`**: Files are loaded in the following order:  1. Managed memory (eg. /etc/claude-code/CLAUDE.md) - Global instructions for all users 2. User memory (~/.cl...
- **`cleanup.ts`**: Mengekspor: CleanupResult, addCleanupResults, convertFileNameToDate.
- **`cleanupRegistry.ts`**: Global registry for cleanup functions that should run during graceful shutdown. This module is separate from gracefulShutdown.ts to avoid circular dep...
- **`cliArgs.ts`**: Parse a CLI flag value early, before Commander.js processes arguments. Supports both space-separated (--flag value) and equals-separated (--flag=value...
- **`cliHighlight.ts`**: Mengekspor: CliHighlight, getCliHighlightPromise.
- **`codeIndexing.ts`**: Utility functions for detecting code indexing tool usage.  Tracks usage of common code indexing solutions like Sourcegraph, Cody, etc. both via CLI co...
- **`collapseBackgroundBashNotifications.ts`**: Mengekspor: collapseBackgroundBashNotifications.
- **`collapseHookSummaries.ts`**: Collapses consecutive hook summary messages with the same hookLabel (e.g. PostToolUse) into a single summary. This happens when parallel tool calls ea...
- **`collapseReadSearch.ts`**: Mengekspor: SearchOrReadResult, getToolSearchOrReadInfo, getSearchOrReadFromContent.
- **`collapseTeammateShutdowns.ts`**: Collapses consecutive in-process teammate shutdown task_status attachments into a single `teammate_shutdown_batch` attachment with a count.
- **`combinedAbortSignal.ts`**: Creates a combined AbortSignal that aborts when the input signal aborts, an optional second signal aborts, or an optional timeout elapses. Returns bot...
- **`commandLifecycle.ts`**: Mengekspor: setCommandLifecycleListener, notifyCommandLifecycle.
- **`commitAttribution.ts`**: List of repos where internal model names are allowed in trailers. Includes both SSH and HTTPS URL formats.  NOTE: This is intentionally a repo allowli...
- **`completionCache.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`concurrentSessions.ts`**: Kind override from env. Set by the spawner (`claude --bg`, daemon supervisor) so the child can register without the parent having to write the file fo...
- **`config.ts`**: Mengekspor: PastedContent, SerializedStructuredHistoryEntry, HistoryEntry.
- **`configConstants.ts`**: Mengekspor: NOTIFICATION_CHANNELS, EDITOR_MODES, TEAMMATE_MODES.
- **`contentArray.ts`**: Utility for inserting a block into a content array relative to tool_result blocks. Used by the API layer to position supplementary content (e.g., cach...
- **`context.ts`**: Check if 1M context is disabled via environment variable. Used by C4E admins to disable 1M context for HIPAA compliance.
- **`contextAnalysis.ts`**: Mengekspor: analyzeContext, tokenStatsToStatsigMetrics.
- **`contextSuggestions.ts`**: Estimated tokens that could be saved
- **`controlMessageCompat.ts`**: Normalize camelCase `requestId` → snake_case `request_id` on incoming control messages (control_request, control_response).  Older iOS app builds send...
- **`conversationRecovery.ts`**: Mengekspor: TeleportRemoteResponse, TurnInterruptionState, DeserializeResult.
- **`cron.ts`**: Mengekspor: CronFields, parseCronExpression, computeNextCronRun.
- **`cronJitterConfig.ts`**: Mengekspor: getCronJitterConfig.
- **`cronScheduler.ts`**: Mengekspor: isRecurringTaskAged, CronScheduler, createCronScheduler.
- **`cronTasks.ts`**: Mengekspor: CronTask, getCronFilePath, hasCronTasksSync.
- **`cronTasksLock.ts`**: Mengekspor: SchedulerLockOptions.
- **`crossProjectResume.ts`**: Check if a log is from a different project directory and determine whether it's a related worktree or a completely different project.  For same-repo w...
- **`crypto.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`cwd.ts`**: Run a function with an overridden working directory for the current async context. All calls to pwd()/getCwd() within the function (and its async desc...
- **`debug.ts`**: Minimum log level to include in debug output. Defaults to 'debug', which filters out 'verbose' messages. Set CLAUDE_CODE_DEBUG_LOG_LEVEL=verbose to
- **`debugFilter.ts`**: Parse debug filter string into a filter configuration Examples: - "api,hooks" -> include only api and hooks categories - "!1p,!file" -> exclude loggin...
- **`desktopDeepLink.ts`**: Mengekspor: DesktopInstallStatus.
- **`detectRepository.ts`**: Like detectCurrentRepository, but also returns the host (e.g. "github.com" or a GHE hostname). Callers that need to construct URLs against a specific ...
- **`diagLogs.ts`**: Logs diagnostic information to a logfile. This information is sent via the environment manager to session-ingress to monitor issues from within the co...
- **`diff.ts`**: Shifts hunk line numbers by offset. Use when getPatchForDisplay received a slice of the file (e.g. readEditContext) rather than the whole file — calle...
- **`directMemberMessage.ts`**: Parse `@agent-name message` syntax for direct team member messaging.
- **`displayTags.ts`**: Matches any XML-like `<tag>…</tag>` block (lowercase tag names, optional attributes, multi-line content). Used to strip system-injected wrapper tags f...
- **`doctorContextWarnings.ts`**: Mengekspor: ContextWarning, ContextWarnings.
- **`doctorDiagnostic.ts`**: Mengekspor: InstallationType, DiagnosticInfo, getInvokedBinary.
- **`earlyInput.ts`**: Early Input Capture  This module captures terminal input that is typed before the REPL is fully initialized. Users often type `claude` and immediately...
- **`editor.ts`**: Mengekspor: classifyGuiEditor, openFileInExternalEditor, getExternalEditor.
- **`effort.ts`**: Mengekspor: EFFORT_LEVELS, EffortValue, modelSupportsEffort.
- **`embeddedTools.ts`**: Whether this build has bfs/ugrep embedded in the bun binary (ant-native only).  When true: - `find` and `grep` in Claude's Bash shell are shadowed by ...
- **`env.ts`**: Mengekspor: getGlobalClaudeFile, JETBRAINS_IDES, detectDeploymentEnvironment.
- **`envDynamic.ts`**: Mengekspor: getTerminalWithJetBrainsDetection, envDynamic.
- **`envUtils.ts`**: Check if NODE_OPTIONS contains a specific flag. Splits on whitespace and checks for exact match to avoid false positives.
- **`envValidation.ts`**: Mengekspor: EnvVarValidationResult, validateBoundedIntEnvVar.
- **`errorLogSink.ts`**: Error log sink implementation  This module contains the heavy implementation for error logging and should be initialized during app startup. It handle...
- **`errors.ts`**: True iff `e` is any of the abort-shaped errors the codebase encounters: our AbortError class, a DOMException from AbortController.abort() (.name === '...
- **`exampleCommands.ts`**: Mengekspor: countAndSortItems, pickDiverseCoreFiles, getExampleCommandFromCache.
- **`execFileNoThrow.ts`**: Mengekspor: execFileNoThrow, execFileNoThrowWithCwd.
- **`execFileNoThrowPortable.ts`**: @deprecated Use `execa` directly with `{ shell: true, reject: false }` for non-blocking execution. Sync exec calls block the event loop and cause perf...
- **`execSyncWrapper.ts`**: @deprecated Use async alternatives when possible. Sync exec calls block the event loop.  Wrapped execSync with slow operation logging. Use this instea...
- **`exportRenderer.tsx`**: Minimal keybinding provider for static/headless renders. Provides keybinding context without the ChordInterceptor (which uses useInput and would hang ...
- **`extraUsage.ts`**: Mengekspor: isBilledAsExtraUsage.
- **`fastMode.ts`**: Mengekspor: isFastModeEnabled, isFastModeAvailable, getFastModeUnavailableReason.
- **`file.ts`**: Mengekspor: File, MAX_OUTPUT_SIZE, readFileSafe.
- **`fileHistory.ts`**: Mengekspor: FileHistoryBackup, FileHistorySnapshot, FileHistoryState.
- **`fileOperationAnalytics.ts`**: Creates a truncated SHA256 hash (16 chars) for file paths Used for privacy-preserving analytics on file operations
- **`fileRead.ts`**: Sync file-read path, extracted from file.ts.  file.ts sits in the settings SCC via log.ts → types/logs.ts → types/message.ts → Tool.ts → commands.ts →...
- **`fileReadCache.ts`**: A simple in-memory cache for file contents with automatic invalidation based on modification time. This eliminates redundant file reads in FileEditToo...
- **`fileStateCache.ts`**: A file state cache that normalizes all path keys before access. This ensures consistent cache hits regardless of whether callers pass relative vs abso...
- **`findExecutable.ts`**: Find an executable by searching PATH, similar to `which`. Replaces spawn-rx's findActualExecutable to avoid pulling in rxjs (~313 KB).  Returns { cmd,...
- **`fingerprint.ts`**: Hardcoded salt from backend validation. Must match exactly for fingerprint validation to pass.
- **`forkedAgent.ts`**: Helper for running forked agent query loops with usage tracking.  This utility ensures forked agents: 1. Share identical cache-critical params with th...
- **`format.ts`**: Formats a byte count to a human-readable string (KB, MB, GB). @example formatFileSize(1536) → "1.5KB"
- **`formatBriefTimestamp.ts`**: Format an ISO timestamp for the brief/chat message label line.  Display scales with age (like a messaging app): - same day:      "1:30 PM" or "13:30" ...
- **`fpsTracker.ts`**: Mengekspor: FpsMetrics, FpsTracker.
- **`frontmatterParser.ts`**: Frontmatter parser for markdown files Extracts and parses YAML frontmatter between --- delimiters
- **`fsOperations.ts`**: Simplified filesystem operations interface based on Node.js fs module. Provides a subset of commonly used sync operations with type safety. Allows abs...
- **`fullscreen.ts`**: Cached result from `tmux display-message -p '#{client_control_mode}'`. undefined = not yet queried (or probe failed) — env heuristic stays authoritati...
- **`generatedFiles.ts`**: File patterns that should be excluded from attribution. Based on GitHub Linguist vendored patterns and common generated file patterns.
- **`generators.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`genericProcessUtils.ts`**: Check if a process with the given PID is running (signal 0 probe).  PID ≤ 1 returns false (0 is current process group, 1 is init).  Note: `process.kil...
- **`getWorktreePaths.ts`**: Returns the paths of all worktrees for the current git repository. If git is not available, not in a git repo, or only has one worktree, returns an em...
- **`getWorktreePathsPortable.ts`**: Portable worktree detection using only child_process — no analytics, no bootstrap deps, no execa. Used by listSessionsImpl.ts (SDK) and anywhere that ...
- **`ghPrStatus.ts`**: Derive review state from GitHub API values. Draft PRs always show as 'draft' regardless of reviewDecision. reviewDecision can be: APPROVED, CHANGES_RE...
- **`git.ts`**: Mengekspor: findGitRoot, findCanonicalGitRoot, gitExe.
- **`gitDiff.ts`**: Mengekspor: GitDiffStats, PerFileStats, GitDiffResult.
- **`gitSettings.ts`**: Mengekspor: shouldIncludeGitInstructions.
- **`githubRepoPathMapping.ts`**: Updates the GitHub repository path mapping in global config. Called at startup (fire-and-forget) to track known local paths for repos. This is non-blo...
- **`glob.ts`**: Extracts the static base directory from a glob pattern. The base directory is everything before the first glob special character ( ? [ {). Returns the...
- **`gracefulShutdown.ts`**: Mengekspor: setupGracefulShutdown, gracefulShutdownSync, isShuttingDown.
- **`groupToolUses.ts`**: Mengekspor: MessageWithoutProgress, GroupingResult, applyGrouping.
- **`handlePromptSubmit.ts`**: Mengekspor: PromptInputHelpers, HandlePromptSubmitParams.
- **`hash.ts`**: djb2 string hash — fast non-cryptographic hash returning a signed 32-bit int. Deterministic across runtimes (unlike Bun.hash which uses wyhash). Use a...
- **`headlessProfiler.ts`**: Headless mode profiling utility for measuring per-turn latency in -p (print) mode.  Tracks key timing phases per turn: - Time to system message output...
- **`heapDumpService.ts`**: Service for heap dump capture. Used by the /heapdump command.
- **`heatmap.ts`**: Pre-calculates percentiles from activity data for use in intensity calculations
- **`highlightMatch.tsx`**: Inverse-highlight every occurrence of `query` in `text` (case-insensitive). Used by search dialogs to show where the query matched in result rows and ...
- **`hooks.ts`**: Hooks are user-defined shell commands that can be executed at various points in Claude Code's lifecycle.
- **`horizontalScroll.ts`**: Calculate the visible window of items that fit within available width, ensuring the selected item is always visible. Uses edge-based scrolling: the wi...
- **`http.ts`**: HTTP utility constants and helpers
- **`hyperlink.ts`**: Create a clickable hyperlink using OSC 8 escape sequences. Falls back to plain text if the terminal doesn't support hyperlinks.  @param url - The URL ...
- **`iTermBackup.ts`**: Mengekspor: markITerm2SetupComplete.
- **`ide.ts`**: Mengekspor: DetectedIDEInfo, IdeType, isVSCodeIde.
- **`idePathConversion.ts`**: Path conversion utilities for IDE communication Handles conversions between Claude's environment and the IDE's environment
- **`idleTimeout.ts`**: Creates an idle timeout manager for SDK mode. Automatically exits the process after the specified idle duration.  @param isIdle Function that returns ...
- **`imagePaste.ts`**: Mengekspor: PASTE_THRESHOLD, ImageWithDimensions, IMAGE_EXTENSION_REGEX.
- **`imageResizer.ts`**: Mengekspor: ImageResizeError, ImageDimensions, ResizeResult.
- **`imageStore.ts`**: Get the image store directory for the current session.
- **`imageValidation.ts`**: Information about an oversized image.
- **`immediateCommand.ts`**: Whether inference-config commands (/model, /fast, /effort) should execute immediately (during a running query) rather than waiting for the current tur...
- **`inProcessTeammateHelpers.ts`**: In-Process Teammate Helpers  Helper functions for in-process teammate integration. Provides utilities to: - Find task ID by agent name - Handle plan a...
- **`ink.ts`**: Convert a color string to Ink's TextProps['color'] format. Colors are typically AgentColorName values like 'blue', 'green', etc. This converts them to...
- **`intl.ts`**: Shared Intl object instances with lazy initialization.  Intl constructors are expensive (~0.05-0.1ms each), so we cache instances for reuse across the...
- **`jetbrains.ts`**: Mengekspor: isJetBrainsPluginInstalledCachedSync.
- **`json.ts`**: Mengekspor: safeParseJSON, safeParseJSONC, parseJSONL.
- **`jsonRead.ts`**: Leaf stripBOM — extracted from json.ts to break settings → json → log → types/logs → … → settings. json.ts imports this for its memoized+logging safeP...
- **`keyboardShortcuts.ts`**: Mengekspor: MACOS_OPTION_SPECIAL_CHARS, isMacosOptionChar.
- **`lazySchema.ts`**: Returns a memoized factory function that constructs the value on first call. Used to defer Zod schema construction from module init time to first acce...
- **`listSessionsImpl.ts`**: Standalone implementation of listSessions for the Agent SDK.  Dependencies are kept minimal and portable — no bootstrap/state.ts, no analytics, no bun...
- **`localInstaller.ts`**: Utilities for handling local installation
- **`lockfile.ts`**: Lazy accessor for proper-lockfile.  proper-lockfile depends on graceful-fs, which monkey-patches every fs method on first require (~8ms). Static impor...
- **`log.ts`**: Gets the display title for a log/session with fallback logic. Skips firstPrompt if it starts with a tick/goal tag (autonomous mode auto-prompt). Strip...
- **`logoV2Utils.ts`**: Mengekspor: LayoutMode, LayoutDimensions, getLayoutMode.
- **`mailbox.ts`**: Mengekspor: MessageSource, Message, Mailbox.
- **`managedEnv.ts`**: `claude ssh` remote: ANTHROPIC_UNIX_SOCKET routes auth through a -R forwarded socket to a local proxy, and the launcher sets a handful of placeholder ...
- **`managedEnvConstants.ts`**: Environment variables that control inference routing: which provider to use, which endpoint to hit, and which model IDs to send.  When CLAUDE_CODE_PRO...
- **`markdown.ts`**: Mengekspor: configureMarked, applyMarkdown, formatToken.
- **`markdownConfigLoader.ts`**: Mengekspor: CLAUDE_CONFIG_DIRECTORIES, ClaudeConfigDirectory, MarkdownFile.
- **`mcpInstructionsDelta.ts`**: Server names — for stateless-scan reconstruction.
- **`mcpOutputStorage.ts`**: Generates a format description string based on the MCP result type and schema.
- **`mcpValidation.ts`**: Resolve the MCP output token cap. Precedence: 1. MAX_MCP_OUTPUT_TOKENS env var (explicit user override) 2. tengu_satin_quoll GrowthBook flag's `mcp_to...
- **`mcpWebSocketTransport.ts`**: Mengekspor: WebSocketTransport.
- **`memoize.ts`**: Creates a memoized function that returns cached values while refreshing in parallel.
- **`memoryFileDetection.ts`**: Mengekspor: detectSessionFileType, detectSessionPatternType, isAutoMemFile.
- **`messagePredicates.ts`**: Mengekspor: isHumanTurn.
- **`messageQueueManager.ts`**: Mengekspor: SetAppState, subscribeToCommandQueue, getCommandQueueSnapshot.
- **`messages.ts`**: Mengekspor: withMemoryCorrectionHint, deriveShortMessageId, INTERRUPT_MESSAGE.
- **`modelCost.ts`**: Mengekspor: ModelCosts, COST_TIER_3_15, COST_TIER_15_75.
- **`modifiers.ts`**: Pre-warm the native module by loading it in advance. Call this early to avoid delay on first use.
- **`mtls.ts`**: Get mTLS configuration from environment variables
- **`notebook.ts`**: Mengekspor: mapNotebookCellsToToolResult, parseCellId.
- **`objectGroupBy.ts`**: https:tc39.es/ecma262/multipage/fundamental-objects.html#sec-object.groupby
- **`pasteStore.ts`**: Get the paste store directory (persistent across sessions).
- **`path.ts`**: Expands a path that may contain tilde notation (~) to an absolute path.  On Windows, POSIX-style paths (e.g., `/c/Users/...`) are automatically conver...
- **`pdf.ts`**: Read a PDF file and return it as base64-encoded data.
- **`pdfUtils.ts`**: Parse a page range string into firstPage/lastPage numbers. Supported formats: - "5" → { firstPage: 5, lastPage: 5 } - "1-10" → { firstPage: 1, lastPag...
- **`peerAddress.ts`**: Peer address parsing — kept separate from peerRegistry.ts so that SendMessageTool can import parseAddress without transitively loading the bridge (axi...
- **`planModeV2.ts`**: Mengekspor: getPlanModeV2AgentCount, getPlanModeV2ExploreAgentCount, isPlanModeInterviewPhaseEnabled.
- **`plans.ts`**: Get or generate a word slug for the current session's plan. The slug is generated lazily on first access and cached for the session. If a plan file wi...
- **`platform.ts`**: Mengekspor: Platform, SUPPORTED_PLATFORMS, getPlatform.
- **`preflightChecks.tsx`**: Mengekspor: PreflightCheckResult, PreflightStep.
- **`privacyLevel.ts`**: Privacy level controls how much nonessential network traffic and telemetry Claude Code generates.  Levels are ordered by restrictiveness: default < no...
- **`process.ts`**: Mengekspor: registerProcessOutputErrorHandlers, writeToStdout, writeToStderr.
- **`profilerBase.ts`**: Shared infrastructure for profiler modules (startupProfiler, queryProfiler, headlessProfiler). All three use the same perf_hooks timeline and the same...
- **`promptCategory.ts`**: Determines the prompt category for agent usage. Used for analytics to track different agent patterns.  @param agentType - The type/name of the agent @...
- **`promptEditor.ts`**: Mengekspor: EditorResult, editFileInEditor, editPromptInEditor.
- **`promptShellExecution.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`proxy.ts`**: Mengekspor: disableKeepAlive, _resetKeepAliveForTesting, getAddressFamily.
- **`queryContext.ts`**: Shared helpers for building the API cache-key prefix (systemPrompt, userContext, systemContext) for query() calls.  Lives in its own file because it i...
- **`queryHelpers.ts`**: Mengekspor: PermissionPromptTool, isResultSuccessful, extractReadFilesFromMessages.
- **`queryProfiler.ts`**: Query profiling utility for measuring and reporting time spent in the query pipeline from user input to first token arrival. Enable by setting CLAUDE_...
- **`queueProcessor.ts`**: Check if a queued command is a slash command (value starts with '/').
- **`readEditContext.ts`**: Slice of the file: contextLines before/after the match, on line boundaries.
- **`readFileInRange.ts`**: Mengekspor: ReadFileRangeResult, FileTooLargeError.
- **`releaseNotes.ts`**: We fetch the changelog from GitHub instead of bundling it with the build.  This is necessary because Ink's static rendering makes it difficult to dyna...
- **`renderOptions.ts`**: Gets a ReadStream for /dev/tty when stdin is piped. This allows interactive Ink rendering even when stdin is a pipe. Result is cached for the lifetime...
- **`ripgrep.ts`**: Mengekspor: ripgrepCommand, RipgrepTimeoutError, countFilesRoundedRg.
- **`sanitization.ts`**: Unicode Sanitization for Hidden Character Attack Mitigation  This module implements security measures against Unicode-based hidden character attacks, ...
- **`screenshotClipboard.ts`**: Copies an image (from ANSI text) to the system clipboard. Supports macOS, Linux (with xclip/xsel), and Windows.  Pure-TS pipeline: ANSI text → bitmap-...
- **`sdkEventQueue.ts`**: Mengekspor: SdkEvent, enqueueSdkEvent, drainSdkEvents.
- **`semanticBoolean.ts`**: Boolean that also accepts the string literals "true"/"false".  Tool inputs arrive as model-generated JSON. The model occasionally quotes booleans — `"...
- **`semanticNumber.ts`**: Number that also accepts numeric string literals like "30", "-5", "3.14".  Tool inputs arrive as model-generated JSON. The model occasionally quotes n...
- **`semver.ts`**: Semver comparison utilities that use Bun.semver when available and fall back to the npm `semver` package in Node.js environments.  Bun.semver.order() ...
- **`sequential.ts`**: Creates a sequential execution wrapper for async functions to prevent race conditions. Ensures that concurrent calls to the wrapped function are execu...
- **`sessionActivity.ts`**: Session activity tracking with refcount-based heartbeat timer.  The transport registers its keep-alive sender via registerSessionActivityCallback(). C...
- **`sessionEnvVars.ts`**: Session-scoped environment variables set via /env. Applied only to spawned child processes (via bash provider env overrides), not to the REPL process ...
- **`sessionEnvironment.ts`**: Mengekspor: invalidateSessionEnvCache.
- **`sessionFileAccessHooks.ts`**: Session file access analytics hooks. Tracks access to session memory and transcript files via Read, Grep, Glob tools. Also tracks memdir file access v...
- **`sessionIngressAuth.ts`**: Read token via file descriptor, falling back to well-known file. Uses global state to cache the result since file descriptors can only be read once....
- **`sessionRestore.ts`**: Mengekspor: restoreSessionStateFromLog, computeRestoredAttributionState, computeStandaloneAgentContext.
- **`sessionStart.ts`**: Mengekspor: takeInitialUserMessage.
- **`sessionState.ts`**: Context carried with requires_action transitions so downstream surfaces (CCR sidebar, push notifications) can show what the session is blocked on, not...
- **`sessionStorage.ts`**: Mengekspor: isTranscriptMessage, isChainParticipant, isEphemeralToolProgress.
- **`sessionStoragePortable.ts`**: Portable session storage utilities.  Pure Node.js — no internal dependencies on logging, experiments, or feature flags. Shared between the CLI (src/ut...
- **`sessionTitle.ts`**: Session title generation via Haiku.  Standalone module with minimal dependencies so it can be imported from print.ts (SDK control request handler) wit...
- **`sessionUrl.ts`**: Parses a session resume identifier which can be either: - A URL containing session ID (e.g., https:api.example.com/v1/session_ingress/session/550e8400...
- **`set.ts`**: Note: this code is hot, so is optimized for speed.
- **`shellConfig.ts`**: Utilities for managing shell configuration files (like .bashrc, .zshrc) Used for managing claude aliases and PATH entries
- **`sideQuery.ts`**: Model to use for the query
- **`sideQuestion.ts`**: Side Question ("/btw") feature - allows asking quick questions without interrupting the main agent context.  Uses runForkedAgent to leverage prompt ca...
- **`signal.ts`**: Tiny listener-set primitive for pure event signals (no stored state).  Collapses the ~8-line `const listeners = new Set(); function subscribe(){…}; fu...
- **`sinks.ts`**: Attach error log and analytics sinks, draining any events queued before attachment. Both inits are idempotent. Called from setup() for the default com...
- **`slashCommandParsing.ts`**: Centralized utilities for parsing slash commands
- **`sleep.ts`**: Abort-responsive sleep. Resolves after `ms` milliseconds, or immediately when `signal` aborts (so backoff loops don't block shutdown).  By default, ab...
- **`sliceAnsi.ts`**: Slice a string containing ANSI escape codes.  Unlike the slice-ansi package, this properly handles OSC 8 hyperlink sequences because @alcalzone/ansi-t...
- **`slowOperations.ts`**: Threshold in milliseconds for logging slow JSON/clone operations. Operations taking longer than this will be logged for debugging. - Override: set CLA...
- **`standaloneAgent.ts`**: Standalone agent utilities for sessions with custom names/colors  These helpers provide access to standalone agent context (name and color) for sessio...
- **`startupProfiler.ts`**: Startup profiling utility for measuring and reporting time spent in various initialization phases.  Two modes: 1. Sampled logging: 100% of ant users, ...
- **`staticRender.tsx`**: Wrapper component that exits after rendering. Uses useLayoutEffect to ensure we wait for React's commit phase to complete before exiting. This is more...
- **`stats.ts`**: Mengekspor: DailyActivity, DailyModelTokens, StreakInfo.
- **`statsCache.ts`**: Simple in-memory lock to prevent concurrent cache operations.
- **`status.tsx`**: Mengekspor: Property, Diagnostic, buildSandboxProperties.
- **`statusNoticeDefinitions.tsx`**: Mengekspor: StatusNoticeType, StatusNoticeContext, StatusNoticeDefinition.
- **`statusNoticeHelpers.ts`**: Calculate cumulative token estimate for agent descriptions
- **`stream.ts`**: Mengekspor: Stream.
- **`streamJsonStdoutGuard.ts`**: Sentinel written to stderr ahead of any diverted non-JSON line, so that log scrapers and tests can grep for guard activity.
- **`streamlinedTransform.ts`**: Transforms SDK messages for streamlined output mode.  Streamlined mode is a "distillation-resistant" output format that: - Keeps text messages intact ...
- **`stringUtils.ts`**: General string utility functions and classes for safe string accumulation
- **`subprocessEnv.ts`**: Env vars to strip from subprocess environments when running inside GitHub Actions. This prevents prompt-injection attacks from exfiltrating secrets vi...
- **`systemDirectories.ts`**: Get cross-platform system directories Handles differences between Windows, macOS, Linux, and WSL @param options Optional overrides for testing (env, h...
- **`systemPrompt.ts`**: Mengekspor: buildEffectiveSystemPrompt.
- **`systemPromptType.ts`**: Branded type for system prompt arrays.  This module is intentionally dependency-free so it can be imported from anywhere without risking circular init...
- **`systemTheme.ts`**: Terminal dark/light mode detection for the 'auto' theme setting.  Detection is based on the terminal's actual background color (queried via OSC 11 by ...
- **`taggedId.ts`**: Tagged ID encoding compatible with the API's tagged_id.py format.  Produces IDs like "user_01PaGUP2rbg1XDh7Z9W1CEpd" from a UUID string. The format is...
- **`tasks.ts`**: Team name set by the leader when creating a team. Used by getTaskListId() so the leader's tasks are stored under the team name (matching where tmux/iT...
- **`teamDiscovery.ts`**: Team Discovery - Utilities for discovering teams and teammate status  Scans ~/.claude/teams/ to find teams where the current session is the leader. Us...
- **`teamMemoryOps.ts`**: Check if a search tool use targets team memory files by examining its path.
- **`teammate.ts`**: Teammate utilities for agent swarm coordination  These helpers identify whether this Claude Code instance is running as a spawned teammate in a swarm....
- **`teammateContext.ts`**: TeammateContext - Runtime context for in-process teammates  This module provides AsyncLocalStorage-based context for in-process teammates, enabling co...
- **`teammateMailbox.ts`**: Teammate Mailbox - File-based messaging system for agent swarms  Each teammate has an inbox file at .claude/teams/{team_name}/inboxes/{agent_name}.jso...
- **`telemetryAttributes.ts`**: Mengekspor: getTelemetryAttributes.
- **`teleport.tsx`**: Mengekspor: TeleportResult, TeleportProgressStep, TeleportProgressCallback.
- **`tempfile.ts`**: Generate a temporary file path.  @param prefix Optional prefix for the temp file name @param extension Optional file extension (defaults to '.md') @pa...
- **`terminal.ts`**: Inserts newlines in a string to wrap it at the specified width. Uses ANSI-aware slicing to avoid splitting escape sequences. @param text The text to w...
- **`terminalPanel.ts`**: Built-in terminal panel toggled with Meta+J.  Uses tmux for shell persistence: a separate tmux server with a per-instance socket (e.g., "claude-panel-...
- **`textHighlighting.ts`**: Mengekspor: TextHighlight, TextSegment, segmentTextByHighlights.
- **`theme.ts`**: Mengekspor: Theme, THEME_NAMES, ThemeName.
- **`thinking.ts`**: Build-time gate (feature) + runtime gate (GrowthBook). The build flag controls code inclusion in external builds; the GB flag controls rollout.
- **`timeouts.ts`**: Get the default timeout for bash operations in milliseconds Checks BASH_DEFAULT_TIMEOUT_MS environment variable or returns 2 minutes default @param en...
- **`tmuxSocket.ts`**: TMUX SOCKET ISOLATION ===================== This module manages an isolated tmux socket for Claude's operations.  WHY THIS EXISTS: Without isolation, ...
- **`tokenBudget.ts`**: Mengekspor: parseTokenBudget, findTokenBudgetPositions, getBudgetContinuationMessage.
- **`tokens.ts`**: Get the API response id for an assistant message with real (non-synthetic) usage. Used to identify split assistant records that came from the same API...
- **`toolErrors.ts`**: Mengekspor: formatError, getErrorParts, formatZodValidationError.
- **`toolPool.ts`**: Mengekspor: isPrActivitySubscriptionTool, applyCoordinatorToolFilter, mergeAndFilterTools.
- **`toolResultStorage.ts`**: Utility for persisting large tool results to disk instead of truncating them.
- **`toolSchemaCache.ts`**: Mengekspor: getToolSchemaCache, clearToolSchemaCache.
- **`toolSearch.ts`**: Tool Search utilities for dynamically discovering deferred tools.  When enabled, deferred tools (MCP and shouldDefer tools) are sent with defer_loadin...
- **`transcriptSearch.ts`**: Flatten a RenderableMessage to lowercased searchable text. WeakMap- cached — messages are append-only and immutable so a hit is always valid. Lowercas...
- **`treeify.ts`**: Mengekspor: TreeNode, TreeifyOptions, treeify.
- **`truncate.ts`**: Truncates a file path in the middle to preserve both directory context and filename. Width-aware: uses stringWidth() for correct CJK/emoji measurement...
- **`unaryLogging.ts`**: Mengekspor: CompletionType.
- **`undercover.ts`**: Undercover mode — safety utilities for contributing to public/open-source repos.  When active, Claude Code adds safety instructions to commit/PR promp...
- **`user.ts`**: GitHub Actions metadata when running in CI
- **`userAgent.ts`**: User-Agent string helpers.  Kept dependency-free so SDK-bundled code (bridge, cli/transports) can import without pulling in auth.ts and its transitive...
- **`userPromptKeywords.ts`**: Checks if input matches negative keyword patterns
- **`uuid.ts`**: Validate uuid @param maybeUUID The value to be checked if it is a uuid @returns string as UUID or null if it is not valid
- **`warningHandler.ts`**: Mengekspor: MAX_WARNING_KEYS, resetWarningHandler, initializeWarningHandler.
- **`which.ts`**: Mengekspor: which, whichSync.
- **`windowsPaths.ts`**: Check if a file or directory exists on Windows using the dir command @param path - The path to check @returns true if the path exists, false otherwise...
- **`withResolvers.ts`**: Polyfill for Promise.withResolvers() (ES2024, Node 22+). package.json declares "engines": { "node": ">=18.0.0" } so we can't use the native one.
- **`words.ts`**: Random word slug generator for plan IDs Inspired by https:github.com/nas5w/random-word-slugs with Claude-flavored words
- **`workloadContext.ts`**: Turn-scoped workload tag via AsyncLocalStorage.  WHY a separate module from bootstrap/state.ts: bootstrap is transitively imported by src/entrypoints/...
- **`worktree.ts`**: Mengekspor: validateWorktreeSlug, WorktreeSession, getCurrentWorktreeSession.
- **`worktreeModeEnabled.ts`**: Worktree mode is now unconditionally enabled for all users.  Previously gated by GrowthBook flag 'tengu_worktree_mode', but the CACHED_MAY_BE_STALE pa...
- **`xdg.ts`**: XDG Base Directory utilities for Claude CLI Native Installer  Implements the XDG Base Directory specification for organizing native installer componen...
- **`xml.ts`**: Escape XML/HTML special characters for safe interpolation into element text content (between tags). Use when untrusted strings (process stdout, user i...
- **`yaml.ts`**: YAML parsing wrapper.  Uses Bun.YAML (built-in, zero-cost) when running under Bun, otherwise falls back to the `yaml` npm package. The package is lazy...
- **`zodToJsonSchema.ts`**: Converts Zod v4 schemas to JSON Schema using native toJSONSchema.

## Direktori: `restored-src/src/utils/background/remote`

- **`preconditions.ts`**: Checks if user needs to log in with Claude.ai Extracted from getTeleportErrors() in TeleportError.tsx @returns true if login is required, false otherw...
- **`remoteSession.ts`**: Background remote session type for managing teleport sessions

## Direktori: `restored-src/src/utils/bash`

- **`ParsedCommand.ts`**: Interface for parsed command implementations. Both tree-sitter and regex fallback implementations conform to this.
- **`ShellSnapshot.ts`**: Creates a shell function that invokes `binaryPath` with a specific argv[0]. This uses the bun-internal ARGV0 dispatch trick: the bun binary checks its...
- **`ast.ts`**: AST-based bash command analysis using tree-sitter.  This module replaces the shell-quote + hand-rolled char-walker approach in bashSecurity.ts / comma...
- **`bashParser.ts`**: Pure-TypeScript bash parser producing tree-sitter-bash-compatible ASTs.  Downstream code in parser.ts, ast.ts, prefix.ts, ParsedCommand.ts walks this ...
- **`bashPipeCommand.ts`**: Rearranges a command with pipes to place stdin redirect after the first command. This fixes an issue where eval treats the entire piped command as a s...
- **`commands.ts`**: Generates placeholder strings with random salt to prevent injection attacks. The salt prevents malicious commands from containing literal placeholder ...
- **`heredoc.ts`**: Heredoc extraction and restoration utilities.  The shell-quote library parses `<<` as two separate `<` redirect operators, which breaks command splitt...
- **`parser.ts`**: Mengekspor: Node, ParsedCommandData, PARSE_ABORTED.
- **`prefix.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`registry.ts`**: Mengekspor: CommandSpec, Argument, Option.
- **`shellCompletion.ts`**: Check if a parsed token is a command operator (|, ||, &&, ;)
- **`shellPrefix.ts`**: Parses a shell prefix that may contain an executable path and arguments.  Examples: - "bash" -> quotes as 'bash' - "/usr/bin/bash -c" -> quotes as '/u...
- **`shellQuote.ts`**: Safe wrappers for shell-quote library functions that handle errors gracefully These are drop-in replacements for the original functions
- **`shellQuoting.ts`**: Detects if a command contains a heredoc pattern Matches patterns like: <<EOF, <<'EOF', <<"EOF", <<-EOF, <<-'EOF', <<\EOF, etc.
- **`treeSitterAnalysis.ts`**: Tree-sitter AST analysis utilities for bash command security validation.  These functions extract security-relevant information from tree-sitter parse...

## Direktori: `restored-src/src/utils/bash/specs`

- **`alias.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`index.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`nohup.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`pyright.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`sleep.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`srun.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`time.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`timeout.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.

## Direktori: `restored-src/src/utils/claudeInChrome`

- **`chromeNativeHost.ts`**: Chrome Native Host - Pure TypeScript Implementation  This module provides the Chrome native messaging host functionality, previously implemented as a ...
- **`common.ts`**: Mengekspor: CLAUDE_IN_CHROME_MCP_SERVER_NAME, CHROMIUM_BROWSERS, BROWSER_DETECTION_ORDER.
- **`mcpServer.ts`**: Mengekspor: createChromeContext.
- **`prompt.ts`**: Mengekspor: BASE_CHROME_PROMPT, CHROME_TOOL_SEARCH_INSTRUCTIONS, getChromeSystemPrompt.
- **`setup.ts`**: Mengekspor: shouldEnableClaudeInChrome, shouldAutoEnableClaudeInChrome, setupClaudeInChrome.
- **`setupPortable.ts`**: Mengekspor: CHROME_EXTENSION_URL, ChromiumBrowser, BrowserPath.
- **`toolRendering.tsx`**: All tool names from BROWSER_TOOLS in @ant/claude-for-chrome-mcp. Keep in sync with the package's BROWSER_TOOLS array.

## Direktori: `restored-src/src/utils/computerUse`

- **`appNames.ts`**: Filter and sanitize installed-app data for inclusion in the `request_access` tool description. Ported from Cowork's appNames.ts. Two concerns: noise f...
- **`cleanup.ts`**: Turn-end cleanup for the chicago MCP surface: auto-unhide apps that `prepareForAction` hid, then release the file-based lock.  Called from three sites...
- **`common.ts`**: Sentinel bundle ID for the frontmost gate. Claude Code is a terminal — it has no window. This never matches a real `NSWorkspace.frontmostApplication`,...
- **`computerUseLock.ts`**: Mengekspor: AcquireResult, CheckResult, isLockHeldLocally.
- **`drainRunLoop.ts`**: Shared CFRunLoop pump. Swift's four `@MainActor` async methods (captureExcluding, captureRegion, apps.listInstalled, resolvePrepareCapture) and `@ant/...
- **`escHotkey.ts`**: Global Escape → abort. Mirrors Cowork's `escAbort.ts` but without Electron: CGEventTap via `@ant/computer-use-swift`. While registered, Escape is cons...
- **`executor.ts`**: CLI `ComputerExecutor` implementation. Wraps two native modules: - `@ant/computer-use-input` (Rust/enigo) — mouse, keyboard, frontmost app - `@ant/com...
- **`gates.ts`**: Mengekspor: getChicagoEnabled, getChicagoSubGates, getChicagoCoordinateMode.
- **`hostAdapter.ts`**: Mengekspor: getComputerUseHostAdapter.
- **`inputLoader.ts`**: Package's js/index.js reads COMPUTER_USE_INPUT_NODE_PATH (baked by build-with-plugins.ts on darwin targets, unset otherwise — falls through to the nod...
- **`mcpServer.ts`**: Enumerate installed apps, timed. Fails soft — if Spotlight is slow or claude-swift throws, the tool description just omits the list. Resolution happen...
- **`setup.ts`**: Build the dynamic MCP config + allowed tool names. Mirror of `setupClaudeInChrome`. The `mcp__computer-use__` tools are added to `allowedTools` so the...
- **`swiftLoader.ts`**: Package's js/index.js reads COMPUTER_USE_SWIFT_NODE_PATH (baked by build-with-plugins.ts on darwin targets, unset otherwise — falls through to the nod...
- **`toolRendering.tsx`**: Mengekspor: getComputerUseMCPRenderingOverrides.
- **`wrapper.tsx`**: The `.call()` override — thin adapter between `ToolUseContext` and `bindSessionContext`. Spread into the MCP tool object in `client.ts` (same pattern ...

## Direktori: `restored-src/src/utils/deepLink`

- **`banner.ts`**: Deep Link Origin Banner  Builds the warning text shown when a session was opened by an external claude-cli: deep link. Linux xdg-open and browsers wit...
- **`parseDeepLink.ts`**: Deep Link URI Parser  Parses `claude-cli:open` URIs. All parameters are optional: q    — pre-fill the prompt input (not submitted) cwd  — working dire...
- **`protocolHandler.ts`**: Protocol Handler  Entry point for `claude --handle-uri <url>`. When the OS invokes claude with a `claude-cli:` URL, this module: 1. Parses the URI int...
- **`registerProtocol.ts`**: Protocol Handler Registration  Registers the `claude-cli:` custom URI scheme with the OS, so that clicking a `claude-cli:` link in a browser (or any a...
- **`terminalLauncher.ts`**: Terminal Launcher  Detects the user's preferred terminal emulator and launches Claude Code inside it. Used by the deep link protocol handler when invo...
- **`terminalPreference.ts`**: Terminal preference capture for deep link handling.  Separate from terminalLauncher.ts so interactiveHelpers.tsx can import this without pulling the f...

## Direktori: `restored-src/src/utils/dxt`

- **`helpers.ts`**: Parses and validates a DXT manifest from a JSON object.  Lazy-imports @anthropic-ai/mcpb: that package uses zod v3 which eagerly creates 24 .bind(this...
- **`zip.ts`**: State tracker for zip file validation during extraction

## Direktori: `restored-src/src/utils/filePersistence`

- **`filePersistence.ts`**: File persistence orchestrator  This module provides the main orchestration logic for persisting files at the end of each turn: - BYOC mode: Upload fil...
- **`outputsScanner.ts`**: Outputs directory scanner for file persistence  This module provides utilities to: - Detect the session type from environment variables - Capture turn...

## Direktori: `restored-src/src/utils/git`

- **`gitConfigParser.ts`**: Lightweight parser for .git/config files.  Verified against git's config.c: - Section names: case-insensitive, alphanumeric + hyphen - Subsection name...
- **`gitFilesystem.ts`**: Filesystem-based git state reading — avoids spawning git subprocesses.  Covers: resolving .git directories (including worktrees/submodules), parsing H...
- **`gitignore.ts`**: Checks if a path is ignored by git (via `git check-ignore`).  This consults all applicable gitignore sources: repo `.gitignore` files (nested), `.git/...

## Direktori: `restored-src/src/utils/github`

- **`ghAuthStatus.ts`**: Returns gh CLI install + auth status for telemetry. Uses which() first (Bun.which — no subprocess) to detect install, then exit code of `gh auth token...

## Direktori: `restored-src/src/utils/hooks`

- **`AsyncHookRegistry.ts`**: Mengekspor: PendingAsyncHook, registerPendingAsyncHook, getPendingAsyncHooks.
- **`apiQueryHookHelper.ts`**: Mengekspor: ApiQueryHookContext, ApiQueryHookConfig, ApiQueryResult.
- **`execAgentHook.ts`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`execHttpHook.ts`**: Get the sandbox proxy config for routing HTTP hook requests through the sandbox network proxy when sandboxing is enabled.  Uses dynamic import to avoi...
- **`execPromptHook.ts`**: Execute a prompt-based hook using an LLM
- **`fileChangedWatcher.ts`**: Mengekspor: setEnvHookNotifier, initializeFileChangedWatcher, updateWatchPaths.
- **`hookEvents.ts`**: Hook event system for broadcasting hook execution events.  This module provides a generic event system that is separate from the main message stream. ...
- **`hookHelpers.ts`**: Schema for hook responses (shared by prompt and agent hooks)
- **`hooksConfigManager.ts`**: Mengekspor: MatcherMetadata, HookEventMetadata, getHookEventMetadata.
- **`hooksConfigSnapshot.ts`**: Get hooks from allowed sources. If allowManagedHooksOnly is set in policySettings, only managed hooks are returned. If disableAllHooks is set in polic...
- **`hooksSettings.ts`**: Mengekspor: HookSource, IndividualHookConfig, isHookEqual.
- **`postSamplingHooks.ts`**: Register a post-sampling hook that will be called after model sampling completes This is an internal API not exposed through settings
- **`registerFrontmatterHooks.ts`**: Register hooks from frontmatter (agent or skill) into session-scoped hooks. These hooks will be active for the duration of the session/agent and clean...
- **`registerSkillHooks.ts`**: Registers hooks from a skill's frontmatter as session hooks.  Hooks are registered as session-scoped hooks that persist for the duration of the sessio...
- **`sessionHooks.ts`**: Function hook callback - returns true if check passes, false to block
- **`skillImprovement.ts`**: Mengekspor: SkillUpdate, initSkillImprovement.
- **`ssrfGuard.ts`**: SSRF guard for HTTP hooks.  Blocks private, link-local, and other non-routable address ranges to prevent project-configured HTTP hooks from reaching c...

## Direktori: `restored-src/src/utils/mcp`

- **`dateTimeParser.ts`**: Parse natural language date/time input into ISO 8601 format using Haiku.  Examples: - "tomorrow at 3pm" → "2025-10-15T15:00:00-07:00" - "next Monday" ...
- **`elicitationValidation.ts`**: Mengekspor: ValidationResult, isEnumSchema, isMultiSelectEnumSchema.

## Direktori: `restored-src/src/utils/memory`

- **`types.ts`**: Mengekspor: MEMORY_TYPE_VALUES, MemoryType.
- **`versions.ts`**: Mengekspor: projectIsInGitRepo.

## Direktori: `restored-src/src/utils/messages`

- **`mappers.ts`**: Mengekspor: toInternalMessages, toSDKCompactMetadata, fromSDKCompactMetadata.
- **`systemInit.ts`**: Mengekspor: sdkCompatToolName, SystemInitInputs, buildSystemInitMessage.

## Direktori: `restored-src/src/utils/model`

- **`agent.ts`**: Get the default subagent model. Returns 'inherit' so subagents inherit the model from the parent thread.
- **`aliases.ts`**: Bare model family aliases that act as wildcards in the availableModels allowlist. When "opus" is in the allowlist, ANY opus model is allowed (opus 4.5...
- **`antModels.ts`**: Model defaults to adaptive thinking and rejects `thinking: { type: 'disabled' }`.
- **`bedrock.ts`**: Mengekspor: getBedrockInferenceProfiles, findFirstMatch, getInferenceProfileBackingModel.
- **`check1mAccess.ts`**: Check if extra usage is enabled based on the cached disabled reason. Extra usage is considered enabled if there's no disabled reason, or if the disabl...
- **`configs.ts`**: Mengekspor: ModelConfig, CLAUDE_3_7_SONNET_CONFIG, CLAUDE_3_5_V2_SONNET_CONFIG.
- **`contextWindowUpgradeCheck.ts`**: Get available model upgrade for more context Returns null if no upgrade available or user already has max context
- **`deprecation.ts`**: Model deprecation utilities  Contains information about deprecated models and their retirement dates.
- **`model.ts`**: Ensure that any model codenames introduced here are also added to scripts/excluded-strings.txt to avoid leaking them. Wrap any codename string literal...
- **`modelAllowlist.ts`**: Check if a model belongs to a given family by checking if its name (or resolved name) contains the family identifier.
- **`modelCapabilities.ts`**: Mengekspor: ModelCapability, getModelCapability.
- **`modelOptions.ts`**: Mengekspor: ModelOption, getDefaultOptionForUser, getSonnet46_1MOption.
- **`modelStrings.ts`**: Maps each model version to its provider-specific model ID string. Derived from ALL_MODEL_CONFIGS — adding a model there extends this type.
- **`modelSupportOverrides.ts`**: Check whether a 3p model capability override is set for a model that matches one of the pinned ANTHROPIC_DEFAULT__MODEL env vars.
- **`providers.ts`**: Check if ANTHROPIC_BASE_URL is a first-party Anthropic API URL. Returns true if not set (default API) or points to api.anthropic.com (or api-staging.a...
- **`validateModel.ts`**: Validates a model by attempting an actual API call.

## Direktori: `restored-src/src/utils/nativeInstaller`

- **`download.ts`**: Download functionality for native installer  Handles downloading Claude binaries from various sources: - Artifactory NPM packages - GCS bucket
- **`index.ts`**: Native Installer - Public API  This is the barrel file that exports only the functions actually used by external modules. External modules should only...
- **`installer.ts`**: Native Installer Implementation  This module implements the file-based native installer system described in docs/native-installer.md. It provides: - D...
- **`packageManagers.ts`**: Package manager detection for Claude CLI
- **`pidLock.ts`**: PID-Based Version Locking  This module provides PID-based locking for running Claude Code versions. Unlike mtime-based locking (which can hold locks f...

## Direktori: `restored-src/src/utils/permissions`

- **`PermissionMode.ts`**: Mengekspor: permissionModeSchema, externalPermissionModeSchema, isExternalPermissionMode.
- **`PermissionPromptToolResultSchema.ts`**: Mengekspor: inputSchema, Input, outputSchema.
- **`PermissionResult.ts`**: Mengekspor: getRuleBehaviorDescription.
- **`PermissionRule.ts`**: ToolPermissionBehavior is the behavior associated with a permission rule. 'allow' means the rule allows the tool to run. 'deny' means the rule denies ...
- **`PermissionUpdate.ts`**: Mengekspor: extractRules, hasRules, applyPermissionUpdate.
- **`PermissionUpdateSchema.ts`**: Zod schemas for permission updates.  This file is intentionally kept minimal with no complex dependencies so it can be safely imported by src/types/ho...
- **`autoModeState.ts`**: Mengekspor: setAutoModeActive, isAutoModeActive, setAutoModeFlagCli.
- **`bashClassifier.ts`**: Mengekspor: PROMPT_PREFIX, ClassifierResult, ClassifierBehavior.
- **`bypassPermissionsKillswitch.ts`**: Mengekspor: resetBypassPermissionsCheck, useKickOffCheckAndDisableBypassPermissionsIfNeeded, resetAutoModeGateCheck.
- **`classifierDecision.ts`**: Mengekspor: isAutoModeAllowlistedTool.
- **`classifierShared.ts`**: Shared infrastructure for classifier-based permission systems.  This module provides common types, schemas, and utilities used by both: - bashClassifi...
- **`dangerousPatterns.ts`**: Pattern lists for dangerous shell-tool allow-rule prefixes.  An allow rule like `Bash(python:)` or `PowerShell(node:)` lets the model run arbitrary co...
- **`denialTracking.ts`**: Denial tracking infrastructure for permission classifiers. Tracks consecutive denials and total denials to determine when to fall back to prompting....
- **`filesystem.ts`**: Mengekspor: DANGEROUS_FILES, DANGEROUS_DIRECTORIES, normalizeCaseForComparison.
- **`getNextPermissionMode.ts`**: Mengekspor: getNextPermissionMode, cyclePermissionMode.
- **`pathValidation.ts`**: Mengekspor: FileOperationType, PathCheckResult, ResolvedPathCheckResult.
- **`permissionExplainer.ts`**: Mengekspor: RiskLevel, PermissionExplanation, isPermissionExplainerEnabled.
- **`permissionRuleParser.ts`**: Mengekspor: normalizeLegacyToolName, getLegacyToolNames, escapeRuleContent.
- **`permissionSetup.ts`**: Mengekspor: isDangerousBashPermission, isDangerousPowerShellPermission, isDangerousTaskPermission.
- **`permissions.ts`**: Mengekspor: permissionRuleSourceDisplayString, getAllowRules, createPermissionRequestMessage.
- **`permissionsLoader.ts`**: Returns true if allowManagedPermissionRulesOnly is enabled in managed settings (policySettings). When enabled, only permission rules from managed sett...
- **`shadowedRuleDetection.ts`**: Type of shadowing that makes a rule unreachable
- **`shellRuleMatching.ts`**: Shared permission rule matching utilities for shell tools.  Extracts common logic for: - Parsing permission rules (exact, prefix, wildcard) - Matching...
- **`yoloClassifier.ts`**: Mengekspor: AutoModeRules, getDefaultExternalAutoModeRules, buildDefaultExternalSystemPrompt.

## Direktori: `restored-src/src/utils/plugins`

- **`addDirPluginSettings.ts`**: Reads plugin-related settings (enabledPlugins, extraKnownMarketplaces) from --add-dir directories.  These have the LOWEST priority — callers must spre...
- **`cacheUtils.ts`**: Mengekspor: clearAllPluginCaches, clearAllCaches.
- **`dependencyResolver.ts`**: Plugin dependency resolution — pure functions, no I/O.  Semantics are `apt`-style: a dependency is a presence guarantee, not a module graph. Plugin A ...
- **`fetchTelemetry.ts`**: Telemetry for plugin/marketplace fetches that hit the network.  Added for inc-5046 (GitHub complained about claude-plugins-official load). Before this...
- **`gitAvailability.ts`**: Utility for checking git availability.  Git is required for installing GitHub-based marketplaces. This module provides a memoized check to determine i...
- **`headlessPluginInstall.ts`**: Plugin installation for headless/CCR mode.  This module provides plugin installation without AppState updates, suitable for non-interactive environmen...
- **`hintRecommendation.ts`**: Plugin-hint recommendations.  Companion to lspRecommendation.ts: where LSP recommendations are triggered by file edits, plugin hints are triggered by ...
- **`installCounts.ts`**: Plugin install counts data layer  This module fetches and caches plugin install counts from the official Claude plugins statistics repository. The cac...
- **`installedPluginsManager.ts`**: Manages plugin installation metadata stored in installed_plugins.json  This module separates plugin installation state (global) from enabled/disabled ...
- **`loadPluginAgents.ts`**: Mengekspor: loadPluginAgents, clearPluginAgentCache.
- **`loadPluginCommands.ts`**: Mengekspor: getPluginCommands, clearPluginCommandCache, getPluginSkills.
- **`loadPluginHooks.ts`**: Convert plugin hooks configuration to native matchers with plugin context
- **`loadPluginOutputStyles.ts`**: Mengekspor: loadPluginOutputStyles, clearPluginOutputStyleCache.
- **`lspPluginIntegration.ts`**: Validate that a resolved path stays within the plugin directory. Prevents path traversal attacks via .. or absolute paths.
- **`lspRecommendation.ts`**: LSP Plugin Recommendation Utility  Scans installed marketplaces for LSP plugins and recommends plugins based on file extensions, but ONLY when the LSP...
- **`managedPlugins.ts`**: Plugin names locked by org policy (policySettings.enabledPlugins).  Returns null when managed settings declare no plugin entries (common case — no pol...
- **`marketplaceHelpers.ts`**: Format plugin failure details for user display @param failures - Array of failures with names and reasons @param includeReasons - Whether to include f...
- **`marketplaceManager.ts`**: Marketplace manager for Claude Code plugins  This module provides functionality to: - Manage known marketplace sources (URLs, GitHub repos, npm packag...
- **`mcpPluginIntegration.ts`**: Mengekspor: UnconfiguredChannel, getUnconfiguredChannels, addPluginScopeToServers.
- **`mcpbHandler.ts`**: User configuration values for MCPB
- **`officialMarketplace.ts`**: Constants for the official Anthropic plugins marketplace.  The official marketplace is hosted on GitHub and provides first-party plugins developed by ...
- **`officialMarketplaceGcs.ts`**: inc-5046: fetch the official marketplace from a GCS mirror instead of git-cloning GitHub on every startup.  Backend (anthropic#317037) publishes a mar...
- **`officialMarketplaceStartupCheck.ts`**: Auto-install logic for the official Anthropic marketplace.  This module handles automatically installing the official marketplace on startup for new u...
- **`orphanedPluginFilter.ts`**: Provides ripgrep glob exclusion patterns for orphaned plugin versions.  When plugin versions are updated, old versions are marked with a `.orphaned_at...
- **`parseMarketplaceInput.ts`**: Parses a marketplace input string and returns the appropriate marketplace source type. Handles various input formats: - Git SSH URLs (user@host:path o...
- **`performStartupChecks.tsx`**: Perform plugin startup checks and initiate background installations  This function starts background installation of marketplaces and plugins from tru...
- **`pluginAutoupdate.ts`**: Background plugin autoupdate functionality  At startup, this module: 1. First updates marketplaces that have autoUpdate enabled 2. Then checks all ins...
- **`pluginBlocklist.ts`**: Plugin delisting detection.  Compares installed plugins against marketplace manifests to find plugins that have been removed, and auto-uninstalls them...
- **`pluginDirectories.ts`**: Centralized plugin directory configuration.  This module provides the single source of truth for the plugins directory path. It supports switching bet...
- **`pluginFlagging.ts`**: Flagged plugin tracking utilities  Tracks plugins that were auto-removed because they were delisted from their marketplace. Data is stored in ~/.claud...
- **`pluginIdentifier.ts`**: Extended scope type that includes 'flag' for session-only plugins. 'flag' scope is NOT persisted to installed_plugins.json.
- **`pluginInstallationHelpers.ts`**: Shared helper functions for plugin installation  This module contains common utilities used across the plugin installation system to reduce code dupli...
- **`pluginLoader.ts`**: Plugin Loader Module  This module is responsible for discovering, loading, and validating Claude Code plugins from various sources including marketpla...
- **`pluginOptionsStorage.ts`**: Plugin option storage and substitution.  Plugins declare user-configurable options in `manifest.userConfig` — a record of field schemas matching `Mcpb...
- **`pluginPolicy.ts`**: Plugin policy checks backed by managed settings (policySettings).  Kept as a leaf module (only imports settings) to avoid circular dependencies — mark...
- **`pluginStartupCheck.ts`**: Checks for enabled plugins across all settings sources, including --add-dir.
- **`pluginVersioning.ts`**: Plugin Version Calculation Module  Handles version calculation for plugins from various sources. Versions are used for versioned cache paths and updat...
- **`reconciler.ts`**: Marketplace reconciler — makes known_marketplaces.json consistent with declared intent in settings.  Two layers: - diffMarketplaces(): comparison (rea...
- **`refresh.ts`**: Layer-3 refresh primitive: swap active plugin components in the running session.  Three-layer model (see reconciler.ts for Layer-2): - Layer 1: intent...
- **`schemas.ts`**: First-layer defense against official marketplace impersonation.  This validation blocks direct impersonation attempts like "anthropic-official", "clau...
- **`validatePlugin.ts`**: Fields that belong in marketplace.json entries (PluginMarketplaceEntrySchema) but not plugin.json (PluginManifestSchema). Plugin authors reasonably co...
- **`walkPluginMarkdown.ts`**: Recursively walk a plugin directory, invoking onFile for each .md file.  The namespace array tracks the subdirectory path relative to the root (e.g., ...
- **`zipCache.ts`**: Plugin Zip Cache Module  Manages plugins as ZIP archives in a mounted directory (e.g., Filestore). When CLAUDE_CODE_PLUGIN_USE_ZIP_CACHE is enabled an...
- **`zipCacheAdapters.ts`**: Zip Cache Adapters  I/O helpers for the plugin zip cache. These functions handle reading/writing zip-cache-local metadata files, extracting ZIPs to se...

## Direktori: `restored-src/src/utils/powershell`

- **`dangerousCmdlets.ts`**: Shared constants for PowerShell cmdlets that execute arbitrary code.  These lists are consumed by both the permission-engine validators (powershellSec...
- **`parser.ts`**: The PowerShell AST element type for pipeline elements. Maps directly to CommandBaseAst derivatives in System.Management.Automation.Language.
- **`staticPrefix.ts`**: PowerShell static command prefix extraction.  Mirrors bash's getCommandPrefixStatic / getCompoundCommandPrefixesStatic (src/utils/bash/prefix.ts) but ...

## Direktori: `restored-src/src/utils/processUserInput`

- **`processBashCommand.tsx`**: Berisi logika internal atau utilitas tanpa export utama yang eksplisit.
- **`processSlashCommand.tsx`**: Mengekspor: looksLikeCommand, formatSkillLoadingMetadata.
- **`processTextPrompt.ts`**: Mengekspor: processTextPrompt.
- **`processUserInput.ts`**: Mengekspor: ProcessUserInputContext, ProcessUserInputBaseResult.

## Direktori: `restored-src/src/utils/sandbox`

- **`sandbox-adapter.ts`**: Adapter layer that wraps @anthropic-ai/sandbox-runtime with Claude CLI-specific integrations. This file provides the bridge between the external sandb...
- **`sandbox-ui-utils.ts`**: UI utilities for sandbox violations These utilities are used for displaying sandbox-related information in the UI

## Direktori: `restored-src/src/utils/secureStorage`

- **`fallbackStorage.ts`**: Creates a fallback storage that tries to use the primary storage first, and if that fails, falls back to the secondary storage
- **`index.ts`**: Get the appropriate secure storage implementation for the current platform
- **`keychainPrefetch.ts`**: Minimal module for firing macOS keychain reads in parallel with main.tsx module evaluation, same pattern as startMdmRawRead() in settings/mdm/rawRead....
- **`macOsKeychainHelpers.ts`**: Lightweight helpers shared between keychainPrefetch.ts and macOsKeychainStorage.ts.  This module MUST NOT import execa, execFileNoThrow, or execFileNo...
- **`macOsKeychainStorage.ts`**: Mengekspor: macOsKeychainStorage, isMacOsKeychainLocked.
- **`plainTextStorage.ts`**: Mengekspor: plainTextStorage.

## Direktori: `restored-src/src/utils/settings`

- **`allErrors.ts`**: Combines settings validation errors with MCP configuration errors.  This module exists to break a circular dependency: settings.ts → mcp/config.ts → s...
- **`applySettingsChange.ts`**: Apply a settings change to app state. Re-reads settings from disk, reloads permissions and hooks, and pushes the new state.  Used by both the interact...
- **`changeDetector.ts`**: Time in milliseconds to wait for file writes to stabilize before processing. This helps avoid processing partial writes or rapid successive changes....
- **`constants.ts`**: All possible sources where settings can come from Order matters - later sources override earlier ones
- **`internalWrites.ts`**: Tracks timestamps of in-process settings-file writes so the chokidar watcher in changeDetector.ts can ignore its own echoes.  Extracted from changeDet...
- **`managedPath.ts`**: Get the path to the managed settings directory based on the current platform.
- **`permissionValidation.ts`**: Checks if a character at a given index is escaped (preceded by odd number of backslashes).
- **`pluginOnlyPolicy.ts`**: Check whether a customization surface is locked to plugin-only sources by the managed `strictPluginOnlyCustomization` policy.  "Locked" means user-lev...
- **`schemaOutput.ts`**: Mengekspor: generateSettingsJSONSchema.
- **`settings.ts`**: Mengekspor: loadManagedFileSettings, getManagedFileSettingsPresence, parseSettingsFile.
- **`settingsCache.ts`**: Per-source cache for getSettingsForSource. Invalidated alongside the merged sessionSettingsCache — same resetSettingsCache() triggers (settings write,...
- **`toolValidationConfig.ts`**: Tool validation configuration  Most tools need NO configuration - basic validation works automatically. Only add your tool here if it has special patt...
- **`types.ts`**: Mengekspor: EnvironmentVariablesSchema, PermissionsSchema, ExtraKnownMarketplaceSchema.
- **`validateEditTool.ts`**: Validates settings file edits to ensure the result conforms to SettingsSchema. This is used by FileEditTool to avoid code duplication.  @param filePat...
- **`validation.ts`**: Helper type guards for specific Zod v4 issue types In v4, issue types have different structures than v3
- **`validationTips.ts`**: Mengekspor: ValidationTip, TipContext, getValidationTip.

## Direktori: `restored-src/src/utils/settings/mdm`

- **`constants.ts`**: Shared constants and path builders for MDM settings modules.  This module has ZERO heavy imports (only `os`) — safe to use from mdmRawRead.ts. Both md...
- **`rawRead.ts`**: Minimal module for firing MDM subprocess reads without blocking the event loop. Has minimal imports — only child_process, fs, and mdmConstants (which ...
- **`settings.ts`**: MDM (Mobile Device Management) profile enforcement for Claude Code managed settings.  Reads enterprise settings from OS-level MDM configuration: - mac...

## Direktori: `restored-src/src/utils/shell`

- **`bashProvider.ts`**: Returns a shell command to disable extended glob patterns for security. Extended globs (bash extglob, zsh EXTENDED_GLOB) can be exploited via maliciou...
- **`outputLimits.ts`**: Mengekspor: BASH_MAX_OUTPUT_UPPER_LIMIT, BASH_MAX_OUTPUT_DEFAULT, getMaxOutputLength.
- **`powershellDetection.ts`**: Attempts to find PowerShell on the system via PATH. Prefers pwsh (PowerShell Core 7+), falls back to powershell (5.1).  On Linux, if PATH resolves to ...
- **`powershellProvider.ts`**: PowerShell invocation flags + command. Shared by the provider's getSpawnArgs and the hook spawn path in hooks.ts so the flag set stays in one place....
- **`prefix.ts`**: Shared command prefix extraction using Haiku LLM  This module provides a factory for creating command prefix extractors that can be used by different ...
- **`readOnlyCommandValidation.ts`**: Shared command validation maps for shell tools (BashTool, PowerShellTool, etc.).  Exports complete command configuration maps that any shell tool can ...
- **`resolveDefaultShell.ts`**: Resolve the default shell for input-box `!` commands.  Resolution order (docs/design/ps-shell-selection.md §4.2): settings.defaultShell → 'bash'  Plat...
- **`shellProvider.ts`**: Build the full command string including all shell-specific setup. For bash: source snapshot, session env, disable extglob, eval-wrap, pwd tracking.
- **`shellToolUtils.ts`**: Runtime gate for PowerShellTool. Windows-only (the permission engine uses Win32-specific path normalizations). Ant defaults on (opt-out via env=0); ex...
- **`specPrefix.ts`**: Fig-spec-driven command prefix extraction.  Given a command name + args array + its @withfig/autocomplete spec, walks the spec to find how deep into t...

## Direktori: `restored-src/src/utils/skills`

- **`skillChangeDetector.ts`**: Time in milliseconds to wait for file writes to stabilize before processing.

## Direktori: `restored-src/src/utils/suggestions`

- **`commandSuggestions.ts`**: Mengekspor: MidInputSlashCommand, findMidInputSlashCommand, getBestCommandMatch.
- **`directoryCompletion.ts`**: Mengekspor: DirectoryEntry, PathEntry, CompletionOptions.
- **`shellHistoryCompletion.ts`**: Result of shell history completion lookup
- **`skillUsageTracking.ts`**: Records a skill usage for ranking purposes. Updates both usage count and last used timestamp.
- **`slackChannelSuggestions.ts`**: Mengekspor: subscribeKnownChannels, hasSlackMcpServer, getKnownChannelsVersion.

## Direktori: `restored-src/src/utils/swarm`

- **`It2SetupPrompt.tsx`**: Mengekspor: It2SetupPrompt.
- **`constants.ts`**: Gets the socket name for external swarm sessions (when user is not in tmux). Uses a separate socket to isolate swarm operations from user's tmux sessi...
- **`inProcessRunner.ts`**: In-process teammate runner  Wraps runAgent() for in-process teammates, providing: - AsyncLocalStorage-based context isolation via runWithTeammateConte...
- **`leaderPermissionBridge.ts`**: Leader Permission Bridge  Module-level bridge that allows the REPL to register its setToolUseConfirmQueue and setToolPermissionContext functions for i...
- **`permissionSync.ts`**: Synchronized Permission Prompts for Agent Swarms  This module provides infrastructure for coordinating permission prompts across multiple agents in a ...
- **`reconnection.ts`**: Swarm Reconnection Module  Handles initialization of swarm context for teammates. - Fresh spawns: Initialize from CLI args (set in main.tsx via dynami...
- **`spawnInProcess.ts`**: In-process teammate spawning  Creates and registers an in-process teammate task. Unlike process-based teammates (tmux/iTerm2), in-process teammates ru...
- **`spawnUtils.ts`**: Shared utilities for spawning teammates across different backends.
- **`teamHelpers.ts`**: Mengekspor: inputSchema, SpawnTeamOutput, CleanupOutput.
- **`teammateInit.ts`**: Teammate Initialization Module  Handles initialization for Claude Code instances running as teammates in a swarm. Registers a Stop hook to notify the ...
- **`teammateLayoutManager.ts`**: Gets the appropriate backend for the current environment. detectAndGetBackend() caches internally — no need for a second cache here.
- **`teammateModel.ts`**: Mengekspor: getHardcodedTeammateModelFallback.
- **`teammatePromptAddendum.ts`**: Teammate-specific system prompt addendum.  This is appended to the full main agent system prompt for teammates. It explains visibility constraints and...

## Direktori: `restored-src/src/utils/swarm/backends`

- **`ITermBackend.ts`**: Acquires a lock for pane creation, ensuring sequential execution. Returns a release function that must be called when done.
- **`InProcessBackend.ts`**: InProcessBackend implements TeammateExecutor for in-process teammates.  Unlike pane-based backends (tmux/iTerm2), in-process teammates run in the same...
- **`PaneBackendExecutor.ts`**: PaneBackendExecutor adapts a PaneBackend to the TeammateExecutor interface.  This allows pane-based backends (tmux, iTerm2) to be used through the sam...
- **`TmuxBackend.ts`**: Mengekspor: TmuxBackend.
- **`detection.ts`**: Captured at module load time to detect if the user started Claude from within tmux. Shell.ts may override TMUX env var later, so we capture the origin...
- **`it2Setup.ts`**: Package manager types for installing it2. Listed in order of preference.
- **`registry.ts`**: Cached backend detection result. Once detected, the backend selection is fixed for the lifetime of the process.
- **`teammateModeSnapshot.ts`**: Teammate mode snapshot module.  Captures the teammate mode at session startup, following the same pattern as hooksConfigSnapshot.ts. This ensures that...
- **`types.ts`**: Types of backends available for teammate execution. - 'tmux': Uses tmux for pane management (works in tmux or standalone) - 'iterm2': Uses iTerm2 nati...

## Direktori: `restored-src/src/utils/task`

- **`TaskOutput.ts`**: Single source of truth for a shell command's output.  For bash commands (file mode): both stdout and stderr go directly to a file via stdio fds — neit...
- **`diskOutput.ts`**: Disk cap for task output files. In file mode (bash), a watchdog polls file size and kills the process. In pipe mode (hooks), DiskTaskOutput drops chun...
- **`framework.ts`**: Mengekspor: POLL_INTERVAL_MS, STOPPED_DISPLAY_MS, PANEL_GRACE_MS.
- **`outputFormatting.ts`**: Format task output for API consumption, truncating if too large. When truncated, includes a header with the file path and returns the last N character...
- **`sdkProgress.ts`**: Emit a `task_progress` SDK event. Shared by background agents (per tool_use in runAsyncAgentLifecycle) and workflows (per flushProgress batch). Accept...

## Direktori: `restored-src/src/utils/telemetry`

- **`betaSessionTracing.ts`**: Beta Session Tracing for Claude Code  This module contains beta tracing features enabled when ENABLE_BETA_TRACING_DETAILED=1 and BETA_TRACING_ENDPOINT...
- **`bigqueryExporter.ts`**: Mengekspor: BigQueryMetricsExporter.
- **`events.ts`**: Mengekspor: redactIfDisabled.
- **`instrumentation.ts`**: Mengekspor: bootstrapTelemetry, parseExporterTypes, isTelemetryEnabled.
- **`logger.ts`**: Mengekspor: ClaudeCodeDiagLogger.
- **`perfettoTracing.ts`**: Perfetto Tracing for Claude Code (Ant-only)  This module generates traces in the Chrome Trace Event format that can be viewed in ui.perfetto.dev or Ch...
- **`pluginTelemetry.ts`**: Plugin telemetry helpers — shared field builders for plugin lifecycle events.  Implements the twin-column privacy pattern: every user-defined-name fie...
- **`sessionTracing.ts`**: Session Tracing for Claude Code using OpenTelemetry (BETA)  This module provides a high-level API for creating and managing spans to trace Claude Code...
- **`skillLoadedEvent.ts`**: Logs a tengu_skill_loaded event for each skill available at session startup. This enables analytics on which skills are available across sessions.

## Direktori: `restored-src/src/utils/teleport`

- **`api.ts`**: Checks if an axios error is a transient network error that should be retried
- **`environmentSelection.ts`**: Gets information about available environments and the currently selected one.  @returns Promise<EnvironmentSelectionInfo> containing: - availableEnvir...
- **`environments.ts`**: Fetches the list of available environments from the Environment API @returns Promise<EnvironmentResource[]> Array of available environments @throws Er...
- **`gitBundle.ts`**: Git bundle creation + upload for CCR seed-bundle seeding.  Flow: 1. git stash create → update-ref refs/seed/stash (makes it reachable) 2. git bundle c...

## Direktori: `restored-src/src/utils/todo`

- **`types.ts`**: Mengekspor: TodoItemSchema, TodoItem, TodoListSchema.

## Direktori: `restored-src/src/utils/ultraplan`

- **`ccrSession.ts`**: Mengekspor: PollFailReason, UltraplanPollError, ULTRAPLAN_TELEPORT_SENTINEL.
- **`keyword.ts`**: Find keyword positions, skipping occurrences that are clearly not a launch directive:  - Inside paired delimiters: backticks, double quotes, angle bra...

## Direktori: `restored-src/src/vim`

- **`motions.ts`**: Vim Motion Functions  Pure functions for resolving vim motions to cursor positions.
- **`operators.ts`**: Vim Operator Functions  Pure functions for executing vim operators (delete, change, yank, etc.)
- **`textObjects.ts`**: Vim Text Object Finding  Functions for finding text object boundaries (iw, aw, i", a(, etc.)
- **`transitions.ts`**: Vim State Transition Table  This is the scannable source of truth for state transitions. To understand what happens in any state, look up that state's...
- **`types.ts`**: Vim Mode State Machine Types  This file defines the complete state machine for vim input handling. The types ARE the documentation - reading them tell...

## Direktori: `restored-src/src/voice`

- **`voiceModeEnabled.ts`**: Kill-switch check for voice mode. Returns true unless the `tengu_amber_quartz_disabled` GrowthBook flag is flipped on (emergency off). Default `false`...

