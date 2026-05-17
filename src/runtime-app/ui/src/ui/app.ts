import { LitElement, css, html, nothing } from 'lit'
import './views/dashboard.js'
import './views/projects.js'
import './views/approvals.js'
import './views/jobs.js'
import './views/messages.js'
import './views/audit.js'
import './views/directive.js'
import './views/chat.js'
import './views/extensions.js'
import './views/skills.js'
import type { ApprovalRespondDetail } from './views/approvals.js'
import type { JobRetryDetail } from './views/jobs.js'
import type { MessageRetryDetail } from './views/messages.js'
import type { DirectiveExecuteDetail, DirectiveViewResult } from './views/directive.js'
import type { ChatSendDetail, OperatorChatMessage } from './views/chat.js'
import type { ActionResult, RuntimeAppSnapshot } from '../types/snapshot.js'

type ThemeMode = 'system' | 'light' | 'dark'
type ActiveTab = 'chat' | 'dashboard' | 'projects' | 'approvals' | 'jobs' | 'messages' | 'audit' | 'directive' | 'extensions' | 'skills'

type OperatorSettings = {
  theme: 'dark' | 'light'
  themeMode: ThemeMode
  activeTab: ActiveTab
  pollIntervalMs: number
}

type SnapshotEnvelope = {
  data?: RuntimeAppSnapshot
}

const SETTINGS_KEY = 'agentai01.operator.settings.v1'
const DEFAULT_SETTINGS: OperatorSettings = {
  theme: 'dark',
  themeMode: 'system',
  activeTab: 'dashboard',
  pollIntervalMs: 5000,
}

const TABS: Array<{ id: ActiveTab; label: string; group: 'control' | 'operations' }> = [
  { id: 'chat', label: 'Chat', group: 'control' },
  { id: 'dashboard', label: 'Dashboard', group: 'control' },
  { id: 'projects', label: 'Projects', group: 'control' },
  { id: 'approvals', label: 'Approvals', group: 'control' },
  { id: 'jobs', label: 'Jobs', group: 'operations' },
  { id: 'messages', label: 'Messages', group: 'operations' },
  { id: 'audit', label: 'Audit', group: 'operations' },
  { id: 'directive', label: 'Directive', group: 'operations' },
  { id: 'extensions', label: 'Extensions', group: 'operations' },
  { id: 'skills', label: 'Skills', group: 'operations' },
]

export class AgentRuntimeShell extends LitElement {
  static properties = {
    snapshot: { attribute: false },
    activeTab: { type: String },
    settings: { attribute: false },
    loading: { type: Boolean },
    error: { type: String },
    directiveResult: { attribute: false },
    chatMessages: { attribute: false },
    chatLoading: { type: Boolean },
  }

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
    }

    .shell {
      --shell-nav-width: 258px;
      --shell-topbar-height: 58px;
      display: grid;
      grid-template-columns: var(--shell-nav-width) minmax(0, 1fr);
      grid-template-rows: var(--shell-topbar-height) minmax(0, 1fr);
      grid-template-areas:
        "nav topbar"
        "nav content";
      height: 100vh;
      overflow: hidden;
      animation: dashboard-enter 0.3s var(--ease-out);
    }

    aside {
      grid-area: nav;
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding: 14px 10px 12px;
      border-right: 1px solid color-mix(in srgb, var(--border) 74%, transparent);
      background: color-mix(in srgb, var(--bg) 96%, var(--bg-elevated) 4%);
    }

    main {
      grid-area: content;
      min-width: 0;
      overflow: auto;
      display: grid;
      align-content: start;
      gap: 16px;
      padding: 18px 24px 28px;
      background:
        linear-gradient(color-mix(in srgb, var(--bg) 98%, transparent), color-mix(in srgb, var(--bg) 98%, transparent)),
        repeating-linear-gradient(90deg, transparent 0 39px, color-mix(in srgb, white 4%, transparent) 39px 40px),
        repeating-linear-gradient(0deg, transparent 0 39px, color-mix(in srgb, white 4%, transparent) 39px 40px);
    }

    h1,
    h2,
    p {
      margin: 0;
    }

    h1 {
      color: var(--ink);
      font-size: 15px;
      line-height: 1.1;
      letter-spacing: -0.03em;
    }

    .eyebrow {
      color: var(--muted);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .lede,
    .meta {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
    }

    nav {
      display: grid;
      gap: 16px;
      min-height: 0;
      overflow-y: auto;
      scrollbar-width: none;
    }

    nav::-webkit-scrollbar {
      display: none;
    }

    button {
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      background: var(--bg-elevated);
      color: var(--text);
      cursor: pointer;
      font: inherit;
      transition:
        border-color var(--duration-fast) ease,
        background var(--duration-fast) ease,
        color var(--duration-fast) ease,
        transform var(--duration-fast) ease;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 58px;
      padding: 0 8px 18px;
      flex-shrink: 0;
    }

    .brand-mark {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      flex: 0 0 32px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 45%, var(--accent-2, #14b8a6)));
      color: white;
      font-weight: 900;
      box-shadow: 0 8px 18px color-mix(in srgb, black 18%, transparent);
    }

    .brand-copy {
      display: grid;
      gap: 2px;
      min-width: 0;
    }

    .nav-section {
      display: grid;
      gap: 6px;
    }

    .nav-section-label {
      padding: 0 10px;
      color: color-mix(in srgb, var(--muted) 72%, var(--text) 28%);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .nav-section-items {
      display: grid;
      gap: 4px;
    }

    .nav-button {
      display: grid;
      grid-template-columns: 26px minmax(0, 1fr);
      align-items: center;
      gap: 9px;
      width: 100%;
      min-height: 38px;
      padding: 7px 9px;
      border-color: transparent;
      border-radius: var(--radius-md);
      background: transparent;
      text-align: left;
      font-size: 13px;
      font-weight: 650;
    }

    .nav-button:hover,
    .theme-button:hover {
      border-color: color-mix(in srgb, var(--border-strong) 78%, transparent);
      background: color-mix(in srgb, var(--bg-hover) 82%, transparent);
      color: var(--ink);
    }

    .nav-button[aria-current="page"] {
      border-color: color-mix(in srgb, var(--accent) 24%, transparent);
      background: var(--accent-subtle);
      color: var(--accent);
    }

    .nav-icon {
      display: grid;
      place-items: center;
      width: 24px;
      height: 24px;
      border-radius: var(--radius-sm);
      border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
      background: color-mix(in srgb, var(--bg-elevated) 78%, transparent);
      font-size: 11px;
      font-weight: 800;
      color: inherit;
    }

    .panel {
      display: grid;
      gap: 10px;
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      background: var(--card);
      padding: 14px;
      box-shadow: var(--shadow);
    }

    .panel dl {
      display: grid;
      gap: 8px;
      margin: 0;
    }

    .panel div {
      display: grid;
      gap: 2px;
    }

    dt {
      color: var(--muted);
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }

    dd {
      margin: 0;
      overflow-wrap: anywhere;
      color: var(--ink);
      font-size: 13px;
    }

    .theme-button {
      width: 100%;
      padding: 10px 12px;
      font-weight: 800;
      border-radius: var(--radius-full);
      background: color-mix(in srgb, var(--bg-elevated) 88%, transparent);
    }

    .topbar {
      grid-area: topbar;
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: var(--shell-topbar-height);
      padding: 0 24px;
      border-bottom: 1px solid color-mix(in srgb, var(--border) 74%, transparent);
      background: color-mix(in srgb, var(--bg) 82%, transparent);
      backdrop-filter: blur(12px) saturate(1.6);
    }

    .status-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 999px;
      border: 1px solid var(--border);
      padding: 5px 11px;
      color: var(--muted);
      background: var(--card);
      font-size: 12px;
      font-weight: 600;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: var(--radius-full);
      background: var(--accent);
      box-shadow: 0 0 14px currentColor;
    }

    .status-dot.ok {
      background: var(--ok);
    }

    .status-dot.warn {
      background: var(--warn);
    }

    .status-dot.danger {
      background: var(--danger);
    }

    .loading {
      position: relative;
      overflow: hidden;
      min-height: 42px;
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      background: var(--card);
    }

    .loading::after {
      position: absolute;
      inset: 0;
      content: "";
      background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 18%, transparent), transparent);
      animation: sweep 1.2s linear infinite;
    }

    .error {
      border: 1px solid color-mix(in srgb, var(--danger) 60%, var(--line));
      border-radius: var(--radius-md);
      padding: 12px 14px;
      color: var(--danger);
      background: color-mix(in srgb, var(--danger) 12%, var(--card));
      font-weight: 700;
    }

    @keyframes sweep {
      from { transform: translateX(-100%); }
      to { transform: translateX(100%); }
    }

    @media (max-width: 860px) {
      .shell {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto 1fr;
        grid-template-areas:
          "nav"
          "topbar"
          "content";
        height: auto;
        min-height: 100vh;
        overflow: visible;
      }

      aside {
        height: auto;
        min-height: auto;
      }

      main {
        padding: 20px;
      }
    }

    @keyframes dashboard-enter {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `

  declare snapshot: RuntimeAppSnapshot | null
  declare settings: OperatorSettings
  declare activeTab: ActiveTab
  declare loading: boolean
  declare error: string | null
  declare directiveResult: DirectiveViewResult | null
  declare chatMessages: OperatorChatMessage[]
  declare chatLoading: boolean

  private fetching = false
  private pollerId: ReturnType<typeof setInterval> | undefined
  private readonly colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
  private readonly handleColorSchemeChange = () => {
    if (this.settings.themeMode === 'system') {
      this.applyTheme(this.settings.themeMode)
    }
  }

  constructor() {
    super()
    this.snapshot = null
    this.settings = this.loadSettings()
    this.activeTab = this.settings.activeTab
    this.loading = true
    this.error = null
    this.directiveResult = null
    this.chatMessages = []
    this.chatLoading = false
    this.applyTheme(this.settings.themeMode)
  }

  connectedCallback(): void {
    super.connectedCallback()
    this.colorSchemeQuery.addEventListener('change', this.handleColorSchemeChange)
    void this.fetchSnapshot()
    this.startPoller()
  }

  disconnectedCallback(): void {
    this.stopPoller()
    this.colorSchemeQuery.removeEventListener('change', this.handleColorSchemeChange)
    super.disconnectedCallback()
  }

  render() {
    return html`
      <div
        class="shell"
        @approval-respond=${this.handleApprovalRespond}
        @job-retry=${this.handleJobRetry}
        @message-retry=${this.handleMessageRetry}
        @directive-execute=${this.handleDirectiveExecute}
        @chat-send=${this.handleChatSend}
      >
        <aside class="shell-nav">
          <header class="brand">
            <span class="brand-mark" aria-hidden="true">A1</span>
            <span class="brand-copy">
              <span class="eyebrow">System Operator</span>
              <h1>AgentAI 01</h1>
              <span class="lede">Runtime control</span>
            </span>
          </header>

          <nav aria-label="Operator tabs">
            ${this.renderNavGroup('control', 'Control')}
            ${this.renderNavGroup('operations', 'Operations')}
          </nav>

          ${this.renderEnvironment()}

          <button
            class="theme-button"
            type="button"
            aria-label="Cycle theme mode"
            @click=${this.cycleTheme}
          >
            Theme: ${this.settings.themeMode}
          </button>
        </aside>

        <section class="topbar" aria-label="Runtime status">
          <div class="status-row">
            <span class="badge">
              <span class=${`status-dot ${this.runtimeTone()}`}></span>
              ${this.snapshot?.runtime.shell_status ?? 'loading'}
            </span>
            <span class="badge">${this.snapshot?.readiness.ready ? 'ready' : 'not ready'}</span>
            <span class="badge">poll ${this.settings.pollIntervalMs}ms</span>
          </div>
          <p class="meta">${this.snapshot ? `Snapshot ${this.formatDate(this.snapshot.generated_at)}` : 'Waiting for snapshot'}</p>
        </section>

        <main>
          </section>

          ${this.loading ? html`<div class="loading" aria-label="Loading snapshot"></div>` : nothing}
          ${this.error ? html`<p class="error" role="alert">${this.error}</p>` : nothing}
          ${this.renderActiveView()}
        </main>
      </div>
    `
  }

  private renderEnvironment() {
    const environment = this.snapshot?.environment
    return html`
      <section class="panel" aria-labelledby="environment-title">
        <h2 class="eyebrow" id="environment-title">Environment</h2>
        <dl>
          <div>
            <dt>Env</dt>
            <dd>${environment?.env ?? 'unknown'}</dd>
          </div>
          <div>
            <dt>Model</dt>
            <dd>${environment?.ai_model ?? 'unknown'}</dd>
          </div>
          <div>
            <dt>Port</dt>
            <dd>${environment?.port ?? 'unknown'}</dd>
          </div>
          <div>
            <dt>AI Key</dt>
            <dd>${environment?.ai_api_key_masked ?? '(masked)'}</dd>
          </div>
        </dl>
      </section>
    `
  }

  private renderNavGroup(group: 'control' | 'operations', label: string) {
    return html`
      <section class="nav-section" aria-label=${label}>
        <span class="nav-section-label">${label}</span>
        <div class="nav-section-items">
          ${TABS.filter(tab => tab.group === group).map(tab => html`
            <button
              class="nav-button"
              type="button"
              aria-current=${this.activeTab === tab.id ? 'page' : nothing}
              @click=${() => this.setActiveTab(tab.id)}
            >
              <span class="nav-icon" aria-hidden="true">${tab.label.slice(0, 1)}</span>
              <span>${tab.label}</span>
            </button>
          `)}
        </div>
      </section>
    `
  }

  private renderActiveView() {
    switch (this.activeTab) {
      case 'dashboard':
        return html`<agent-view-dashboard .snapshot=${this.snapshot}></agent-view-dashboard>`
      case 'chat':
        return html`
          <agent-view-chat
            .snapshot=${this.snapshot}
            .messages=${this.chatMessages}
            .loading=${this.chatLoading}
          ></agent-view-chat>
        `
      case 'projects':
        return html`<agent-view-projects .snapshot=${this.snapshot}></agent-view-projects>`
      case 'approvals':
        return html`<agent-view-approvals .snapshot=${this.snapshot}></agent-view-approvals>`
      case 'jobs':
        return html`<agent-view-jobs .snapshot=${this.snapshot}></agent-view-jobs>`
      case 'messages':
        return html`<agent-view-messages .snapshot=${this.snapshot}></agent-view-messages>`
      case 'audit':
        return html`<agent-view-audit .snapshot=${this.snapshot}></agent-view-audit>`
      case 'directive':
        return html`
          <agent-view-directive
            .snapshot=${this.snapshot}
            .lastResult=${this.directiveResult}
          ></agent-view-directive>
        `
      case 'extensions':
        return html`<agent-view-extensions .snapshot=${this.snapshot}></agent-view-extensions>`
      case 'skills':
        return html`<agent-view-skills .snapshot=${this.snapshot}></agent-view-skills>`
    }
  }

  private setActiveTab(tab: ActiveTab): void {
    if (this.activeTab === tab) return
    this.activeTab = tab
    this.settings = { ...this.settings, activeTab: tab }
    this.saveSettings()
    void this.fetchSnapshot()
  }

  private runtimeTone(): 'ok' | 'warn' | 'danger' {
    const status = this.snapshot?.health.status
    if (status === 'ready') return 'ok'
    if (status === 'degraded' || status === 'recovering' || status === 'starting') return 'warn'
    return status ? 'danger' : 'warn'
  }

  private loadSettings(): OperatorSettings {
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY)
      if (!raw) return { ...DEFAULT_SETTINGS }
      const parsed = JSON.parse(raw) as Partial<OperatorSettings>
      return {
        theme: parsed.theme === 'light' ? 'light' : 'dark',
        themeMode: this.isThemeMode(parsed.themeMode) ? parsed.themeMode : DEFAULT_SETTINGS.themeMode,
        activeTab: this.isActiveTab(parsed.activeTab) ? parsed.activeTab : DEFAULT_SETTINGS.activeTab,
        pollIntervalMs: this.isValidInterval(parsed.pollIntervalMs) ? parsed.pollIntervalMs : DEFAULT_SETTINGS.pollIntervalMs,
      }
    } catch {
      return { ...DEFAULT_SETTINGS }
    }
  }

  private saveSettings(): void {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings))
    } catch {
      // localStorage can be unavailable in hardened browser contexts.
    }
  }

  private applyTheme(mode: ThemeMode): void {
    const resolved = mode === 'system'
      ? this.colorSchemeQuery.matches ? 'dark' : 'light'
      : mode
    document.documentElement.dataset.themeMode = resolved
  }

  private cycleTheme(): void {
    const next: ThemeMode =
      this.settings.themeMode === 'system'
        ? 'dark'
        : this.settings.themeMode === 'dark'
          ? 'light'
          : 'system'
    this.settings = {
      ...this.settings,
      themeMode: next,
      theme: next === 'system'
        ? this.colorSchemeQuery.matches ? 'dark' : 'light'
        : next,
    }
    this.applyTheme(next)
    this.saveSettings()
  }

  private async fetchSnapshot(): Promise<void> {
    if (this.fetching) return
    this.fetching = true
    this.loading = this.snapshot === null
    try {
      this.snapshot = await this.getSnapshotFrom('/api/snapshot')
      this.error = null
    } catch (error) {
      if (this.isViteDevHost()) {
        try {
          this.snapshot = await this.getSnapshotFrom('/__agentai/snapshot')
          this.error = null
          return
        } catch {
          this.error = this.errorMessage(error)
          return
        }
      }
      this.error = this.errorMessage(error)
    } finally {
      this.loading = false
      this.fetching = false
    }
  }

  private async getSnapshotFrom(path: string): Promise<RuntimeAppSnapshot> {
    const response = await fetch(path, { headers: { accept: 'application/json' } })
    if (!response.ok) {
      throw new Error(`Snapshot request failed: ${response.status}`)
    }
    const payload = await response.json() as SnapshotEnvelope | RuntimeAppSnapshot
    if (this.isRuntimeSnapshot(payload)) return payload
    const envelopeData = (payload as SnapshotEnvelope).data
    if (this.isRuntimeSnapshot(envelopeData)) {
      return envelopeData
    }
    throw new Error('Snapshot response did not match RuntimeAppSnapshot.')
  }

  private startPoller(): void {
    this.stopPoller()
    this.pollerId = setInterval(() => {
      void this.fetchSnapshot()
    }, this.settings.pollIntervalMs)
  }

  private stopPoller(): void {
    if (this.pollerId !== undefined) {
      clearInterval(this.pollerId)
      this.pollerId = undefined
    }
  }

  private async handleApprovalRespond(event: CustomEvent<ApprovalRespondDetail>): Promise<void> {
    const { requestId, decision, notes } = event.detail
    if ((decision === 'reject' || decision === 'revise') && !window.confirm(`Confirm ${decision} for ${requestId}?`)) {
      return
    }
    await this.postAction(`/api/approvals/${encodeURIComponent(requestId)}/respond`, {
      decision,
      notes,
    })
  }

  private async handleJobRetry(event: CustomEvent<JobRetryDetail>): Promise<void> {
    await this.postAction(`/api/jobs/${encodeURIComponent(event.detail.jobId)}/retry`, {})
  }

  private async handleMessageRetry(event: CustomEvent<MessageRetryDetail>): Promise<void> {
    await this.postAction(`/api/messages/${encodeURIComponent(event.detail.messageId)}/retry`, {})
  }

  private async handleDirectiveExecute(event: CustomEvent<DirectiveExecuteDetail>): Promise<void> {
    const result = await this.postAction('/api/directives', event.detail)
    this.directiveResult = {
      ok: result.ok,
      message: result.message,
      requires_confirmation: result.requires_confirmation,
      artifactPath: result.artifactPath,
      generated_at: result.snapshot?.generated_at,
    }
  }

  private async handleChatSend(event: CustomEvent<ChatSendDetail>): Promise<void> {
    const userMessage: OperatorChatMessage = {
      role: 'user',
      content: event.detail.message,
      timestamp: new Date().toISOString(),
    }
    this.chatMessages = [...this.chatMessages, userMessage]
    this.chatLoading = true
    this.error = null

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          message: event.detail.message,
          messages: this.chatMessages
            .slice(0, -1)
            .map(message => ({ role: message.role, content: message.content })),
        }),
      })
      const payload = await response.json() as {
        ok?: boolean
        message?: string
        model?: string
        latencyMs?: number
        error?: string
      }
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error ?? payload.message ?? `Chat request failed: ${response.status}`)
      }
      this.chatMessages = [
        ...this.chatMessages,
        {
          role: 'assistant',
          content: payload.message ?? '',
          timestamp: new Date().toISOString(),
          meta: [
            payload.model ? `model ${payload.model}` : '',
            typeof payload.latencyMs === 'number' ? `${payload.latencyMs}ms` : '',
          ].filter(Boolean).join(' · '),
        },
      ]
    } catch (error) {
      this.chatMessages = [
        ...this.chatMessages,
        {
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Chat request failed.',
          timestamp: new Date().toISOString(),
          tone: 'danger',
        },
      ]
    } finally {
      this.chatLoading = false
    }
  }

  private async postAction(path: string, body: Record<string, unknown>): Promise<ActionResult> {
    const first = await this.sendAction(path, body)
    if (first.requires_confirmation) {
      const confirmed = window.confirm(first.message)
      if (!confirmed) return first
      const second = await this.sendAction(path, { ...body, confirm: true })
      this.applyActionResult(second)
      return second
    }
    this.applyActionResult(first)
    return first
  }

  private async sendAction(path: string, body: Record<string, unknown>): Promise<ActionResult> {
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const result = await response.json() as ActionResult
    if (!response.ok && !result.requires_confirmation) {
      this.error = result.message || `Action failed: ${response.status}`
    }
    return result
  }

  private applyActionResult(result: ActionResult): void {
    if (result.snapshot) {
      this.snapshot = result.snapshot
    } else {
      void this.fetchSnapshot()
    }
    this.error = result.ok ? null : result.message
  }

  private isRuntimeSnapshot(value: unknown): value is RuntimeAppSnapshot {
    if (typeof value !== 'object' || value === null) return false
    const record = value as Record<string, unknown>
    return typeof record['generated_at'] === 'string' &&
      typeof record['dashboard'] === 'object' &&
      Array.isArray(record['projects'])
  }

  private isActiveTab(value: unknown): value is ActiveTab {
    return typeof value === 'string' && TABS.some(tab => tab.id === value)
  }

  private isThemeMode(value: unknown): value is ThemeMode {
    return value === 'system' || value === 'light' || value === 'dark'
  }

  private isValidInterval(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 1000
  }

  private isViteDevHost(): boolean {
    return window.location.port === '5173'
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unable to refresh runtime snapshot.'
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  }
}

customElements.define('agent-runtime-shell', AgentRuntimeShell)
