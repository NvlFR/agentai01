import { LitElement, css, html, nothing } from 'lit'
import type { RuntimeAppSnapshot } from '../../types/snapshot.js'

export type OperatorChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  meta?: string
  tone?: 'danger'
}

export type ChatSendDetail = {
  message: string
}

export class AgentViewChat extends LitElement {
  static properties = {
    snapshot: { attribute: false },
    messages: { attribute: false },
    loading: { type: Boolean },
  }

  static styles = css`
    :host {
      display: block;
      min-height: min(720px, calc(100vh - 112px));
    }

    .chat {
      display: grid;
      grid-template-rows: auto minmax(320px, 1fr) auto;
      min-height: min(720px, calc(100vh - 112px));
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      background: color-mix(in srgb, var(--card) 92%, transparent);
      overflow: hidden;
      box-shadow: var(--shadow);
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 16px 18px;
      border-bottom: 1px solid var(--border);
      background: color-mix(in srgb, var(--bg-elevated) 72%, transparent);
    }

    h2,
    p {
      margin: 0;
    }

    h2 {
      color: var(--text-strong);
      font-size: 18px;
      letter-spacing: -0.02em;
    }

    .muted {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.45;
    }

    .pill {
      border: 1px solid var(--border);
      border-radius: var(--radius-full);
      padding: 5px 10px;
      color: var(--muted);
      background: var(--secondary, var(--bg-elevated));
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }

    .messages {
      display: flex;
      flex-direction: column;
      gap: 14px;
      overflow: auto;
      padding: 18px;
    }

    .welcome {
      display: grid;
      gap: 10px;
      max-width: 720px;
      margin: auto;
      text-align: center;
    }

    .welcome h3 {
      margin: 0;
      color: var(--text-strong);
      font-size: 24px;
      letter-spacing: -0.03em;
    }

    article {
      display: grid;
      gap: 6px;
      max-width: min(820px, 86%);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 13px 14px;
      background: var(--bg-elevated);
      white-space: pre-wrap;
      line-height: 1.55;
    }

    article.user {
      align-self: flex-end;
      border-color: color-mix(in srgb, var(--accent) 28%, var(--border));
      background: var(--accent-subtle);
      color: var(--text-strong);
    }

    article.assistant {
      align-self: flex-start;
    }

    article.danger {
      border-color: color-mix(in srgb, var(--danger) 38%, var(--border));
      background: var(--danger-subtle);
    }

    .message-meta {
      color: var(--muted);
      font-size: 11px;
      font-weight: 650;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    form {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      padding: 14px;
      border-top: 1px solid var(--border);
      background: color-mix(in srgb, var(--bg) 84%, transparent);
    }

    textarea {
      min-height: 52px;
      max-height: 180px;
      resize: vertical;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 12px 13px;
      background: var(--bg-elevated);
      color: var(--text);
      line-height: 1.45;
    }

    button {
      align-self: end;
      min-height: 52px;
      border: 1px solid color-mix(in srgb, var(--accent) 42%, transparent);
      border-radius: var(--radius-lg);
      padding: 0 18px;
      background: var(--accent);
      color: var(--accent-contrast);
      font-weight: 800;
      cursor: pointer;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    @media (max-width: 720px) {
      form {
        grid-template-columns: 1fr;
      }

      article {
        max-width: 100%;
      }
    }
  `

  declare snapshot: RuntimeAppSnapshot | null
  declare messages: OperatorChatMessage[]
  declare loading: boolean

  private draft = ''

  constructor() {
    super()
    this.snapshot = null
    this.messages = []
    this.loading = false
  }

  render() {
    return html`
      <section class="chat" aria-labelledby="chat-title">
        <header>
          <span>
            <h2 id="chat-title">Chat</h2>
            <p class="muted">Talk to the configured AI provider. Use Directive for real runtime actions.</p>
          </span>
          <span class="pill">${this.snapshot?.environment.ai_model ?? 'provider unknown'}</span>
        </header>

        <section class="messages" aria-live="polite">
          ${this.messages.length === 0 ? this.renderWelcome() : this.messages.map(message => this.renderMessage(message))}
          ${this.loading ? html`<article class="assistant"><span class="message-meta">assistant</span>Thinking...</article>` : nothing}
        </section>

        <form @submit=${this.send}>
          <textarea
            .value=${this.draft}
            placeholder="Chat with AgentAI 01..."
            @input=${this.updateDraft}
            @keydown=${this.handleKeydown}
          ></textarea>
          <button type="submit" ?disabled=${this.loading || this.draft.trim().length === 0}>Send</button>
        </form>
      </section>
    `
  }

  private renderWelcome() {
    return html`
      <section class="welcome">
        <h3>Ask about the runtime, projects, approvals, or next steps.</h3>
        <p class="muted">
          This chat uses the active provider. It can explain and advise; mutations still go through Directive.
        </p>
      </section>
    `
  }

  private renderMessage(message: OperatorChatMessage) {
    return html`
      <article class=${`${message.role} ${message.tone ?? ''}`}>
        <span class="message-meta">${message.role}${message.meta ? ` · ${message.meta}` : ''}</span>
        <span>${message.content}</span>
      </article>
    `
  }

  private updateDraft(event: InputEvent): void {
    const target = event.target
    if (!(target instanceof HTMLTextAreaElement)) return
    this.draft = target.value
    this.requestUpdate()
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      this.dispatchCurrentDraft()
    }
  }

  private send(event: SubmitEvent): void {
    event.preventDefault()
    this.dispatchCurrentDraft()
  }

  private dispatchCurrentDraft(): void {
    const message = this.draft.trim()
    if (!message || this.loading) return
    this.draft = ''
    this.requestUpdate()
    this.dispatchEvent(
      new CustomEvent<ChatSendDetail>('chat-send', {
        bubbles: true,
        composed: true,
        detail: { message },
      }),
    )
  }
}

customElements.define('agent-view-chat', AgentViewChat)
