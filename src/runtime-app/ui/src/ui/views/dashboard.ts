import { LitElement, css, html } from 'lit'
import type { RuntimeAppSnapshot } from '../../types/snapshot.js'

const ACTIVE_JOB_STATUSES = new Set(['queued', 'running', 'retrying'])

export class AgentViewDashboard extends LitElement {
  static properties = {
    snapshot: { type: Object },
  }

  declare snapshot?: RuntimeAppSnapshot

  static styles = css`
    :host {
      display: block;
    }

    .view {
      display: grid;
      gap: 24px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }

    article,
    section {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--card);
      padding: 20px;
    }

    .kpi-value {
      display: block;
      color: var(--ink);
      font-size: 30px;
      font-weight: 800;
      line-height: 1;
    }

    .kpi-label,
    .meta {
      color: var(--muted);
      font-size: 13px;
    }

    h2,
    h3,
    p {
      margin: 0;
    }

    h2 {
      color: var(--ink);
      font-size: 24px;
    }

    h3 {
      color: var(--ink);
      font-size: 16px;
    }

    header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .status {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .status.ok {
      color: var(--ok);
      background: color-mix(in srgb, var(--ok) 14%, transparent);
    }

    .status.warn {
      color: var(--warn);
      background: color-mix(in srgb, var(--warn) 16%, transparent);
    }

    .status.danger {
      color: var(--danger);
      background: color-mix(in srgb, var(--danger) 14%, transparent);
    }

    ul {
      display: grid;
      gap: 12px;
      margin: 16px 0 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: grid;
      gap: 6px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--bg-accent);
      padding: 14px;
    }

    .empty {
      color: var(--muted);
      margin-top: 12px;
    }
  `

  render() {
    if (!this.snapshot) {
      return html`<section class="view" aria-label="Dashboard"></section>`
    }

    const { dashboard, health } = this.snapshot
    const activeJobCount = this.snapshot.jobs.filter(job =>
      ACTIVE_JOB_STATUSES.has(job.status),
    ).length
    const healthStatus = this.healthTone(health.status)

    return html`
      <section class="view" aria-label="Dashboard">
        <header>
          <h2>Dashboard</h2>
          <span class="status ${healthStatus}">${healthStatus}</span>
        </header>

        <section aria-label="Runtime KPIs" class="kpi-grid">
          ${this.renderKpi('Active Projects', dashboard.kpis.active_project_count)}
          ${this.renderKpi('Pending Approvals', dashboard.kpis.pending_approval_count)}
          ${this.renderKpi('Active Jobs', activeJobCount)}
          ${this.renderKpi('Support Tickets', dashboard.kpis.support_ticket_count)}
        </section>

        <section aria-labelledby="health-heading">
          <header>
            <h3 id="health-heading">Runtime Health</h3>
            <p class="meta">Last activity ${this.formatDate(health.last_activity_timestamp)}</p>
          </header>
          <p class="meta">${health.status}</p>
          ${this.snapshot.readiness.reasons.length > 0
            ? html`<ul>
                ${this.snapshot.readiness.reasons.map(issue => html`<li>${issue}</li>`)}
              </ul>`
            : html`<p class="empty">No health issues reported.</p>`}
        </section>

        <section aria-labelledby="issues-heading">
          <h3 id="issues-heading">Operational Issues</h3>
          ${dashboard.operational_issues.length > 0
            ? html`<ul>
                ${dashboard.operational_issues.map(
                  issue => html`
                    <li>
                      <header>
                        <strong>${issue.summary}</strong>
                        <span class="status ${this.issueStatus(issue.severity)}">
                          ${issue.severity}
                        </span>
                      </header>
                      ${issue.project_id
                        ? html`<p class="meta">Project ${issue.project_id}</p>`
                        : ''}
                    </li>
                  `,
                )}
              </ul>`
            : html`<p class="empty">No operational issues.</p>`}
        </section>
      </section>
    `
  }

  private renderKpi(label: string, value: number) {
    return html`
      <article>
        <span class="kpi-value">${value}</span>
        <span class="kpi-label">${label}</span>
      </article>
    `
  }

  private issueStatus(
    severity: RuntimeAppSnapshot['dashboard']['operational_issues'][number]['severity'],
  ): 'ok' | 'warn' | 'danger' {
    if (severity === 'critical' || severity === 'high') {
      return 'danger'
    }
    if (severity === 'medium') {
      return 'warn'
    }
    return 'ok'
  }

  private healthTone(status: RuntimeAppSnapshot['health']['status']): 'ok' | 'warn' | 'danger' {
    if (status === 'ready') return 'ok'
    if (status === 'degraded' || status === 'recovering' || status === 'starting') return 'warn'
    return 'danger'
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  }
}

customElements.define('agent-view-dashboard', AgentViewDashboard)
