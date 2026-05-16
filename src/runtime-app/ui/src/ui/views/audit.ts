import { LitElement, css, html } from 'lit'
import type { RuntimeAppSnapshot } from '../../types/snapshot.js'

export class AgentViewAudit extends LitElement {
  static properties = {
    snapshot: { type: Object },
  }

  declare snapshot?: RuntimeAppSnapshot

  static styles = css`
    :host {
      display: block;
    }

    section {
      display: grid;
      gap: 16px;
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

    ol {
      display: grid;
      gap: 12px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: grid;
      gap: 10px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--card);
      padding: 18px;
    }

    header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    h3 {
      color: var(--ink);
      font-size: 16px;
    }

    time,
    .meta {
      color: var(--muted);
      font-size: 13px;
    }

    .target {
      color: var(--text);
      font-size: 13px;
    }

    .empty {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--card);
      color: var(--muted);
      padding: 18px;
    }
  `

  render() {
    const audit = [...(this.snapshot?.audit ?? [])].sort((left, right) =>
      right.timestamp.localeCompare(left.timestamp),
    )

    return html`
      <section aria-labelledby="audit-heading">
        <h2 id="audit-heading">Audit Log</h2>
        ${audit.length > 0
          ? html`
              <ol>
                ${audit.map(
                  entry => html`
                    <li>
                      <header>
                        <h3>${entry.action}</h3>
                        <time datetime=${entry.timestamp}>${this.formatDate(entry.timestamp)}</time>
                      </header>
                      <p class="target">Target ${entry.target}</p>
                      <p class="meta">Actor ${entry.actor}</p>
                      <p>${entry.detail}</p>
                    </li>
                  `,
                )}
              </ol>
            `
          : html`<p class="empty">No audit entries available.</p>`}
      </section>
    `
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  }
}

customElements.define('agent-view-audit', AgentViewAudit)
