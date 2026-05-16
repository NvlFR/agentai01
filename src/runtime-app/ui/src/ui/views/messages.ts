import { LitElement, css, html, nothing } from 'lit'
import type { RuntimeAppSnapshot } from '../../types/snapshot.js'

type MessageItem = RuntimeAppSnapshot['messages'][number]

export type MessageRetryDetail = {
  messageId: string
}

export class AgentViewMessages extends LitElement {
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
    const messages = this.snapshot?.messages ?? []
    const rejectedCount = messages.filter(message => this.isRejected(message)).length

    return html`
      <section aria-labelledby="messages-title">
        <header>
          <h2 id="messages-title">Messages</h2>
          <p class="muted">${messages.length} communication event${messages.length === 1 ? '' : 's'}; ${rejectedCount} rejected.</p>
        </header>

        ${messages.length === 0
          ? html`<p class="empty">No communication log entries.</p>`
          : html`<section class="list" aria-label="Communication log">
              ${messages.map(message => this.renderMessage(message))}
            </section>`}
      </section>
    `
  }

  private renderMessage(entry: MessageItem) {
    const messageId = this.messageId(entry)
    const rejected = this.isRejected(entry)
    const message = entry.message

    return html`
      <article>
        <header class="row">
          <span class="meta">
            <span class=${`badge ${rejected ? 'danger' : 'ok'}`}>${this.statusLabel(entry)}</span>
            <span class="badge neutral">${message.message_type}</span>
            <span class="badge neutral">${message.from} to ${message.to}</span>
            ${message.project_id ? html`<span class="badge neutral">${message.project_id}</span>` : nothing}
          </span>
          ${rejected
            ? html`
                <button type="button" @click=${() => this.retry(messageId)}>
                  Retry
                </button>
              `
            : nothing}
        </header>
        <h3>${messageId}</h3>
        <p class="muted">${this.reason(entry)}</p>
      </article>
    `
  }

  private retry(messageId: string): void {
    this.dispatchEvent(
      new CustomEvent<MessageRetryDetail>('message-retry', {
        bubbles: true,
        composed: true,
        detail: { messageId },
      }),
    )
  }

  private isRejected(entry: MessageItem): boolean {
    const record = entry as unknown as Record<string, unknown>
    if (typeof record['allowed'] === 'boolean') return !record['allowed']
    return entry.status === 'rejected'
  }

  private statusLabel(entry: MessageItem): string {
    const record = entry as unknown as Record<string, unknown>
    const allowed = record['allowed']
    if (typeof allowed === 'boolean') return allowed ? 'allowed' : 'rejected'
    return entry.status
  }

  private reason(entry: MessageItem): string {
    const record = entry as unknown as Record<string, unknown>
    const reason = record['reason']
    if (typeof reason === 'string' && reason.length > 0) return reason
    return entry.rejection_reason ?? 'Message routed successfully.'
  }

  private messageId(entry: MessageItem): string {
    const record = entry as unknown as Record<string, unknown>
    const id = record['message_id']
    if (typeof id === 'string' && id.length > 0) return id
    return entry.log_id
  }
}

customElements.define('agent-view-messages', AgentViewMessages)
