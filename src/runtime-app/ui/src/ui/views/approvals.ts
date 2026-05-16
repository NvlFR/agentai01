import { LitElement, css, html, nothing } from 'lit'
import type { RuntimeAppSnapshot } from '../../types/snapshot.js'

type ApprovalItem = RuntimeAppSnapshot['approvals'][number]
type ApprovalDecision = 'approve' | 'reject' | 'revise'

export type ApprovalRespondDetail = {
  requestId: string
  decision: ApprovalDecision
  notes: string
}

export class AgentViewApprovals extends LitElement {
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
      gap: 14px;
      padding: 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--card);
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

    .badge.warn {
      color: var(--warn);
      background: color-mix(in srgb, var(--warn) 14%, transparent);
    }

    .badge.neutral {
      color: var(--muted);
      background: var(--bg-elevated);
    }

    label {
      display: grid;
      gap: 6px;
      color: var(--text);
      font-size: 13px;
      font-weight: 700;
    }

    textarea {
      min-height: 72px;
      resize: vertical;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px 12px;
      background: var(--bg-accent);
      color: var(--text);
      font: inherit;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    button {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 9px 12px;
      color: var(--ink);
      background: var(--bg-elevated);
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }

    button:hover {
      border-color: var(--accent);
    }

    button.approve {
      color: var(--ok);
    }

    button.reject,
    button.revise {
      color: var(--danger);
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

  private notesByRequestId: Record<string, string> = {}

  render() {
    const approvals = this.snapshot?.approvals ?? []

    return html`
      <section aria-labelledby="approvals-title">
        <header>
          <h2 id="approvals-title">Approvals</h2>
          <p class="muted">${approvals.length} pending owner decision${approvals.length === 1 ? '' : 's'}.</p>
        </header>

        ${approvals.length === 0
          ? html`<p class="empty">No pending approvals.</p>`
          : html`<section class="list" aria-label="Pending approvals">
              ${approvals.map(approval => this.renderApproval(approval))}
            </section>`}
      </section>
    `
  }

  private renderApproval(approval: ApprovalItem) {
    const requestId = approval.request_id
    const notes = this.notesByRequestId[requestId] ?? ''
    const requester = this.getRequester(approval)

    return html`
      <article>
        <header>
          <div class="meta">
            <span class="badge warn">${approval.gate}</span>
            ${approval.project_id ? html`<span class="badge neutral">${approval.project_id}</span>` : nothing}
            <span class="badge neutral">${requester}</span>
          </div>
          <h3>${approval.summary}</h3>
        </header>

        <label>
          Notes
          <textarea
            .value=${notes}
            placeholder="Optional context for the decision"
            @input=${(event: InputEvent) => this.updateNotes(requestId, event)}
          ></textarea>
        </label>

        <footer class="actions">
          <button class="approve" type="button" @click=${() => this.respond(requestId, 'approve')}>Approve</button>
          <button class="reject" type="button" @click=${() => this.respond(requestId, 'reject')}>Reject</button>
          <button class="revise" type="button" @click=${() => this.respond(requestId, 'revise')}>Revise</button>
        </footer>
      </article>
    `
  }

  private updateNotes(requestId: string, event: InputEvent): void {
    const target = event.target
    if (!(target instanceof HTMLTextAreaElement)) return
    this.notesByRequestId = {
      ...this.notesByRequestId,
      [requestId]: target.value,
    }
  }

  private respond(requestId: string, decision: ApprovalDecision): void {
    this.dispatchEvent(
      new CustomEvent<ApprovalRespondDetail>('approval-respond', {
        bubbles: true,
        composed: true,
        detail: {
          requestId,
          decision,
          notes: (this.notesByRequestId[requestId] ?? '').trim(),
        },
      }),
    )
  }

  private getRequester(approval: ApprovalItem): string {
    const record = approval as unknown as Record<string, unknown>
    const requestedBy = record['requested_by']
    if (typeof requestedBy === 'string' && requestedBy.length > 0) return requestedBy
    return approval.from_agent
  }
}

customElements.define('agent-view-approvals', AgentViewApprovals)
