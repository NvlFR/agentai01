import { LitElement, css, html } from 'lit'
import type { RuntimeAppSnapshot, ExtensionSnapshot } from '../../types/snapshot.js'

export class AgentViewExtensions extends LitElement {
  static properties = {
    snapshot: { type: Object },
    broadcastMessage: { type: String },
    actionStatus: { type: String },
  }

  declare snapshot?: RuntimeAppSnapshot
  declare broadcastMessage: string
  declare actionStatus: string

  constructor() {
    super()
    this.broadcastMessage = ''
    this.actionStatus = ''
  }

  static styles = css`
    :host {
      display: block;
    }

    section {
      display: grid;
      gap: 20px;
    }

    h2, h3, h4, p {
      margin: 0;
    }

    h2 {
      color: var(--ink);
      font-size: 24px;
    }

    .grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    }

    .card {
      display: grid;
      gap: 14px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: var(--card);
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    h3 {
      color: var(--ink);
      font-size: 18px;
      font-weight: 600;
    }

    .badge {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge.enabled { background: #dcfce7; color: #166534; }
    .badge.disabled { background: #f1f5f9; color: #64748b; }
    .badge.misconfigured { background: #fee2e2; color: #991b1b; }

    .kind {
      color: var(--primary);
      font-size: 13px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .desc {
      color: var(--text);
      font-size: 14px;
      line-height: 1.5;
    }

    .issues {
      background: #fff5f5;
      border-left: 3px solid #e53e3e;
      padding: 10px 14px;
      border-radius: 4px;
      font-size: 13px;
      color: #c53030;
      display: grid;
      gap: 6px;
    }

    .actions {
      display: grid;
      gap: 10px;
      border-top: 1px solid var(--line);
      padding-top: 14px;
      margin-top: 4px;
    }

    .form-group {
      display: flex;
      gap: 8px;
    }

    input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--bg);
      color: var(--ink);
      font-size: 13px;
    }

    button {
      padding: 8px 14px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    button.primary {
      background: var(--primary);
      color: white;
    }
    button.primary:hover {
      opacity: 0.9;
    }

    button.secondary {
      background: var(--line);
      color: var(--ink);
    }
    button.secondary:hover {
      background: #cbd5e1;
    }

    .status-toast {
      padding: 12px 16px;
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      color: #1e3a8a;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 16px;
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
    const extensions = this.snapshot?.extensions ?? []

    return html`
      <section aria-labelledby="ext-heading">
        <h2 id="ext-heading">Platform Extensions & Channels</h2>

        ${this.actionStatus ? html`<div class="status-toast">${this.actionStatus}</div>` : ''}

        ${extensions.length > 0
          ? html`
              <div class="grid">
                ${extensions.map(ext => this.renderCard(ext))}
              </div>
            `
          : html`<p class="empty">No extensions registered.</p>`}
      </section>
    `
  }

  private renderCard(ext: ExtensionSnapshot) {
    const isChannel = ext.id === 'telegram' || ext.id === 'whatsapp'

    return html`
      <div class="card">
        <header>
          <div>
            <h3>${ext.id}</h3>
            <span class="kind">${ext.kind.replace('_', ' ')}</span>
          </div>
          <span class="badge ${ext.status}">${ext.status}</span>
        </header>

        <p class="desc">${ext.description}</p>

        ${ext.issues.length > 0
          ? html`
              <div class="issues">
                <strong>Configuration Issues:</strong>
                ${ext.issues.map(issue => html`<div>• ${issue.message}</div>`)}
              </div>
            `
          : ''}

        ${isChannel && ext.status === 'enabled'
          ? html`
              <div class="actions">
                <h4>Channel Actions</h4>
                <div class="form-group">
                  <input
                    type="text"
                    placeholder="Broadcast alert message..."
                    @input=${(e: Event) => { this.broadcastMessage = (e.target as HTMLInputElement).value }}
                  />
                  <button class="primary" @click=${() => this.sendBroadcast(ext.id)}>Broadcast</button>
                </div>
                <button class="secondary" @click=${() => this.simulateWebhook(ext.id)}>
                  Simulate Incoming Webhook (Lead Inquiry)
                </button>
              </div>
            `
          : ''}
      </div>
    `
  }

  private async sendBroadcast(channelId: string) {
    if (!this.broadcastMessage.trim()) {
      this.actionStatus = `Please enter a message to broadcast via ${channelId}.`
      return
    }

    try {
      const res = await fetch(`/api/${channelId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'broadcast', message: this.broadcastMessage }),
      })
      const data = await res.json()
      this.actionStatus = data.message || `Successfully sent broadcast via ${channelId}.`
      if (data.snapshot) {
        this.dispatchEvent(new CustomEvent('snapshot-update', { detail: data.snapshot, bubbles: true, composed: true }))
      }
    } catch (err: any) {
      this.actionStatus = `Error broadcasting via ${channelId}: ${err.message}`
    }
  }

  private async simulateWebhook(channelId: string) {
    const sampleMsg = `[Simulated ${channelId.toUpperCase()} Webhook] Tolong cek status integrasi perbankan BRI saat ini dan berikan laporan ke tim.`
    try {
      const res = await fetch(`/api/${channelId}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sampleMsg }),
      })
      const data = await res.json()
      this.actionStatus = `Successfully simulated incoming webhook from ${channelId}. Directive submitted.`
      if (data.snapshot) {
        this.dispatchEvent(new CustomEvent('snapshot-update', { detail: data.snapshot, bubbles: true, composed: true }))
      }
    } catch (err: any) {
      this.actionStatus = `Error simulating webhook for ${channelId}: ${err.message}`
    }
  }
}

customElements.define('agent-view-extensions', AgentViewExtensions)
