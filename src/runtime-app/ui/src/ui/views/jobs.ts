import { LitElement, css, html, nothing } from 'lit'
import type { RuntimeAppSnapshot } from '../../types/snapshot.js'

type JobItem = RuntimeAppSnapshot['jobs'][number]

export type JobRetryDetail = {
  jobId: string
}

export class AgentViewJobs extends LitElement {
  static properties = {
    snapshot: { attribute: false },
  }

  static styles = css`
    :host {
      display: block;
    }

    section {
      display: grid;
      gap: 16px;
    }

    header {
      display: grid;
      gap: 6px;
    }

    h2,
    h3,
    p {
      margin: 0;
    }

    h2 {
      color: var(--ink);
      font-size: 24px;
      line-height: 1.2;
    }

    h3 {
      color: var(--ink);
      font-size: 16px;
      line-height: 1.3;
    }

    .muted {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
    }

    .list {
      display: grid;
      gap: 12px;
    }

    article {
      display: grid;
      gap: 12px;
      padding: 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--card);
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
    }

    .badge.ok {
      color: var(--ok);
      background: color-mix(in srgb, var(--ok) 14%, transparent);
    }

    .badge.warn {
      color: var(--warn);
      background: color-mix(in srgb, var(--warn) 14%, transparent);
    }

    .badge.danger {
      color: var(--danger);
      background: color-mix(in srgb, var(--danger) 14%, transparent);
    }

    .badge.neutral {
      color: var(--muted);
      background: var(--bg-elevated);
    }

    button {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 9px 12px;
      color: var(--danger);
      background: var(--bg-elevated);
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }

    button:hover {
      border-color: var(--danger);
    }

    .empty {
      padding: 20px;
      border: 1px dashed var(--line);
      border-radius: 8px;
      color: var(--muted);
      background: var(--bg-accent);
    }
  `

  declare snapshot: RuntimeAppSnapshot | null

  constructor() {
    super()
    this.snapshot = null
  }

  render() {
    const jobs = this.snapshot?.jobs ?? []
    const failedCount = jobs.filter(job => job.status === 'failed').length

    return html`
      <section aria-labelledby="jobs-title">
        <header>
          <h2 id="jobs-title">Jobs</h2>
          <p class="muted">${jobs.length} runtime job${jobs.length === 1 ? '' : 's'}; ${failedCount} failed.</p>
        </header>

        ${jobs.length === 0
          ? html`<p class="empty">No runtime jobs.</p>`
          : html`<section class="list" aria-label="Runtime jobs">
              ${jobs.map(job => this.renderJob(job))}
            </section>`}
      </section>
    `
  }

  private renderJob(job: JobItem) {
    return html`
      <article>
        <header class="row">
          <span class="meta">
            <span class=${`badge ${this.statusTone(job.status)}`}>${job.status}</span>
            <span class="badge neutral">${job.kind}</span>
            ${job.project_id ? html`<span class="badge neutral">${job.project_id}</span>` : nothing}
          </span>
          ${job.status === 'failed'
            ? html`
                <button type="button" @click=${() => this.retry(job.job_id)}>
                  Retry
                </button>
              `
            : nothing}
        </header>
        <h3>${job.job_id}</h3>
        <p class="muted">${job.detail}</p>
      </article>
    `
  }

  private retry(jobId: string): void {
    this.dispatchEvent(
      new CustomEvent<JobRetryDetail>('job-retry', {
        bubbles: true,
        composed: true,
        detail: { jobId },
      }),
    )
  }

  private statusTone(status: JobItem['status']): 'ok' | 'warn' | 'danger' {
    if (status === 'completed') return 'ok'
    if (status === 'failed') return 'danger'
    return 'warn'
  }
}

customElements.define('agent-view-jobs', AgentViewJobs)
