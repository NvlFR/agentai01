import { LitElement, html, css } from 'lit';

type RuntimeIssue = {
  summary: string
  severity: string
}

type RuntimeSnapshot = {
  environment: {
    ai_model: string
    port: number | string
  }
  dashboard: {
    kpis: {
      active_project_count: number
      pending_approval_count: number
    }
    operational_issues: RuntimeIssue[]
  }
  refresh: {
    audit_event_count: number
  }
}

declare global {
  interface Window {
    __RUNTIME_APP__?: RuntimeSnapshot
  }
}

export class AgentRuntimeShell extends LitElement {
  private snapshot: RuntimeSnapshot = window.__RUNTIME_APP__ ?? {
    environment: {
      ai_model: 'unknown',
      port: 'unknown',
    },
    dashboard: {
      kpis: {
        active_project_count: 0,
        pending_approval_count: 0,
      },
      operational_issues: [],
    },
    refresh: {
      audit_event_count: 0,
    },
  };

  private activeTab = 'dashboard';

  static styles = css`
    :host {
      display: block;
      color-scheme: dark;
      --bg: #0b0c10;
      --bg-accent: #13151b;
      --bg-elevated: #1a1d23;
      --bg-hover: #22262d;
      --card: #161920;
      --ink: #f4f4f5;
      --text: #d4d4d8;
      --muted: #838387;
      --accent: #10b981;
      --accent-hover: #34d399;
      --accent-soft: rgba(16, 185, 129, 0.12);
      --accent-glow: rgba(16, 185, 129, 0.2);
      --ok: #22c55e;
      --warn: #f59e0b;
      --danger: #ef4444;
      --line: rgba(255, 255, 255, 0.08);
      --shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
      --radius: 14px;
      --font-body: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --font-display: "Space Grotesk", var(--font-body);
    }

    .app-shell {
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      min-height: 100vh;
      font-family: var(--font-body);
      background: var(--bg);
      color: var(--text);
    }

    aside {
      position: sticky;
      top: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 32px 24px;
      border-right: 1px solid var(--line);
      background: rgba(14, 16, 21, 0.8);
      backdrop-filter: blur(20px);
    }

    main {
      padding: 32px;
      max-width: 1400px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .eyebrow {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--accent);
    }

    h1 {
      margin: 0;
      font-family: var(--font-display);
      color: var(--ink);
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .lede {
      color: var(--muted);
      font-size: 14px;
      margin-top: 8px;
      line-height: 1.6;
    }

    nav {
      display: grid;
      gap: 8px;
    }

    .nav-item {
      padding: 12px 16px;
      border-radius: 10px;
      color: var(--text);
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s ease;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .nav-item:hover {
      background: var(--bg-hover);
      color: var(--ink);
    }

    .nav-item.active {
      background: var(--accent-soft);
      color: var(--accent);
    }

    .card {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin: 24px 0;
    }

    .kpi {
      padding: 20px;
      border-radius: 12px;
      background: var(--bg-accent);
      border: 1px solid var(--line);
    }

    .kpi strong {
      display: block;
      font-size: 28px;
      color: var(--ink);
      margin-bottom: 4px;
      font-family: var(--font-display);
    }

    .kpi span { font-size: 13px; color: var(--muted); }

    .stack { display: grid; gap: 16px; }

    .item {
      padding: 16px;
      border-radius: 12px;
      background: var(--bg-accent);
      border: 1px solid var(--line);
    }

    .status {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .status.ok { color: var(--ok); background: rgba(34, 197, 94, 0.1); }
    .status.warn { color: var(--warn); background: rgba(245, 158, 11, 0.1); }
    .status.danger { color: var(--danger); background: rgba(239, 68, 68, 0.1); }

    section {
      display: none;
    }

    section.active {
      display: block;
      animation: fade-in 0.3s ease-out;
    }

    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  render() {
    return html`
      <div class="app-shell">
        <aside>
          <div>
            <p class="eyebrow">System Operator</p>
            <h1>AgentAI <span>01</span></h1>
            <p class="lede">Autonomous Company Runtime. Powered by Lit & OpenClaw style.</p>
          </div>
          <nav>
            ${this.renderNavItem('dashboard', '📊 Dashboard')}
            ${this.renderNavItem('projects', '📁 Projects')}
            ${this.renderNavItem('approvals', '🛡️ Approvals')}
            ${this.renderNavItem('jobs', '⚙️ Jobs')}
            ${this.renderNavItem('messages', '💬 Messages')}
            ${this.renderNavItem('audit', '🔍 Audit')}
            ${this.renderNavItem('directive', '⚡ Directive')}
          </nav>
          <div class="card" style="padding: 16px; margin-top: auto;">
             <p class="eyebrow">Environment</p>
             <div style="font-size: 12px; color: var(--muted);">
                Model: ${this.snapshot.environment.ai_model}<br>
                Port: ${this.snapshot.environment.port}
             </div>
          </div>
        </aside>
        <main>
          <section class="${this.activeTab === 'dashboard' ? 'active' : ''}">
            <div class="card">
              <h2>Dashboard</h2>
              <div class="kpi-grid">
                ${this.renderKpi('Active Projects', this.snapshot.dashboard.kpis.active_project_count)}
                ${this.renderKpi('Pending Approvals', this.snapshot.dashboard.kpis.pending_approval_count)}
                ${this.renderKpi('Audit Events', this.snapshot.refresh.audit_event_count)}
              </div>
              <div class="stack">
                <h3>Operational Issues</h3>
                ${this.snapshot.dashboard.operational_issues.map(issue => html`
                  <div class="item">
                    <strong>${issue.summary}</strong>
                    <span class="status danger">${issue.severity}</span>
                  </div>
                `)}
              </div>
            </div>
          </section>

          <section class="${this.activeTab === 'directive' ? 'active' : ''}">
             <div class="card">
                <h2>Submit Directive</h2>
                <div class="stack" style="margin-top: 24px;">
                   <textarea rows="4" placeholder="Enter directive..."></textarea>
                   <button @click=${() => alert('Directive executed!')}>Execute Directive</button>
                </div>
             </div>
          </section>
          
          <div style="color: var(--muted); font-size: 12px; text-align: center; margin-top: auto; padding: 24px;">
            &copy; 2026 AgentAI 01. Built with Lit.
          </div>
        </main>
      </div>
    `;
  }

  private renderNavItem(id: string, label: string) {
    return html`
      <div 
        class="nav-item ${this.activeTab === id ? 'active' : ''}" 
        @click=${() => this.setActiveTab(id)}
      >
        ${label}
      </div>
    `;
  }

  private renderKpi(label: string, value: number | string) {
    return html`
      <div class="kpi">
        <strong>${value}</strong>
        <span>${label}</span>
      </div>
    `;
  }

  private setActiveTab(id: string): void {
    this.activeTab = id;
    this.requestUpdate();
  }
}

customElements.define('agent-runtime-shell', AgentRuntimeShell);
