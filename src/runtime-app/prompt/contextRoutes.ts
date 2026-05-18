export type RestoredContextRoute = {
  readonly sourceModule: string
  readonly targetSurface: 'operator-surface' | 'runtime-context' | 'speech-context' | 'diagnostics-context'
  readonly landingPath: 'src/runtime-app/ui' | 'src/runtime-app/prompt' | 'src/runtime' | 'src/runtime-app/speech' | 'src/runtime-app/diagnostics'
  readonly rationale: string
}

export const RESTORED_CONTEXT_ROUTES: readonly RestoredContextRoute[] = [
  {
    sourceModule: 'restored-src/src/context/QueuedMessageContext.tsx',
    targetSurface: 'runtime-context',
    landingPath: 'src/runtime',
    rationale: 'Queued message state belongs to runtime dispatch flow rather than operator UI state.',
  },
  {
    sourceModule: 'restored-src/src/context/fpsMetrics.tsx',
    targetSurface: 'diagnostics-context',
    landingPath: 'src/runtime-app/diagnostics',
    rationale: 'Frame or performance metrics are operator diagnostics concerns.',
  },
  {
    sourceModule: 'restored-src/src/context/mailbox.tsx',
    targetSurface: 'runtime-context',
    landingPath: 'src/runtime',
    rationale: 'Mailbox coordination maps to runtime delivery and queue orchestration.',
  },
  {
    sourceModule: 'restored-src/src/context/modalContext.tsx',
    targetSurface: 'operator-surface',
    landingPath: 'src/runtime-app/ui',
    rationale: 'Modal orchestration is UI-only and should not enter the domain runtime.',
  },
  {
    sourceModule: 'restored-src/src/context/notifications.tsx',
    targetSurface: 'operator-surface',
    landingPath: 'src/runtime-app/ui',
    rationale: 'Notification presentation remains an operator surface concern.',
  },
  {
    sourceModule: 'restored-src/src/context/overlayContext.tsx',
    targetSurface: 'operator-surface',
    landingPath: 'src/runtime-app/ui',
    rationale: 'Overlay rendering is UI-shell behavior.',
  },
  {
    sourceModule: 'restored-src/src/context/promptOverlayContext.tsx',
    targetSurface: 'runtime-context',
    landingPath: 'src/runtime-app/prompt',
    rationale: 'Prompt overlays influence prompt entry and assistive hint composition.',
  },
  {
    sourceModule: 'restored-src/src/context/stats.tsx',
    targetSurface: 'diagnostics-context',
    landingPath: 'src/runtime-app/diagnostics',
    rationale: 'Stats aggregation is consumed as diagnostics, not runtime state truth.',
  },
  {
    sourceModule: 'restored-src/src/context/voice.tsx',
    targetSurface: 'speech-context',
    landingPath: 'src/runtime-app/speech',
    rationale: 'Voice toggles and state belong to the speech pipeline boundary.',
  },
] as const

export function routeRestoredContextModule(sourceModule: string): RestoredContextRoute | undefined {
  return RESTORED_CONTEXT_ROUTES.find(entry => entry.sourceModule === sourceModule)
}

export function listRuntimeRelevantContextRoutes(): RestoredContextRoute[] {
  return RESTORED_CONTEXT_ROUTES.filter(entry => entry.targetSurface !== 'operator-surface')
}
