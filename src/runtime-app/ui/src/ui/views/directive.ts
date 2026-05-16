import { LitElement, css, html, nothing } from 'lit'
import type { RuntimeAppSnapshot } from '../../types/snapshot.js'

type DirectiveMode = 'natural' | 'structured'

export type DirectiveExecuteDetail = {
  input: string
  mode: DirectiveMode
}

export type DirectiveViewResult = {
  ok: boolean
  message: string
  requires_confirmation?: boolean
  artifactPath?: string
  generated_at?: string
}

export class AgentViewDirective extends LitElement {
  static properties = {
    snapshot: { attribute: false },
    lastResult: { attribute: false },
  }

  static styles = css`
    :host {
      display: block;
    }

    section,
    form {
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

    .panel {
      display: grid;
      gap: 14px;
      padding: 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--card);
    }

    label {
      display: grid;
      gap: 6px;
      color: var(--text);
      font-size: 13px;
      font-weight: 700;
    }

    textarea,
    select {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px 12px;
      background: var(--bg-accent);
      color: var(--text);
      font: inherit;
      line-height: 1.5;
    }

    textarea {
      min-height: 132px;
      resize: vertical;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: end;
      justify-content: space-between;
    }

    button {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px 14px;
      color: var(--ink);
      background: var(--accent);
      font: inherit;
      font-weight: 800;
      cursor: pointer;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      width: fit-content;
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

    .empty {
      padding: 20px;
      border: 1px dashed var(--line);
      border-radius: 8px;
      color: var(--muted);
      background: var(--bg-accent);
    }
  `

  declare snapshot: RuntimeAppSnapshot | null
  declare lastResult: DirectiveViewResult | null

  constructor() {
    super()
    this.snapshot = null
    this.lastResult = null
  }

  private input = ''
  private mode: DirectiveMode = 'natural'

  render() {
    const canExecute = this.input.trim().length > 0

    return html`
      <section aria-labelledby="directive-title">
        <header>
          <h2 id="directive-title">Directive</h2>
          <p class="muted">Submit an owner directive for the app shell to execute.</p>
        </header>

        <form class="panel" @submit=${this.execute}>
          <label>
            Directive input
            <textarea
              .value=${this.input}
              placeholder="Example: jalankan check"
              @input=${this.updateInput}
            ></textarea>
          </label>

          <footer class="actions">
            <label>
              Mode
              <select .value=${this.mode} @change=${this.updateMode}>
                <option value="natural">Natural</option>
                <option value="structured">Structured</option>
              </select>
            </label>
            <button type="submit" ?disabled=${!canExecute}>Execute</button>
          </footer>
        </form>

        <section aria-labelledby="directive-result-title">
          <h3 id="directive-result-title">Response History</h3>
          ${this.lastResult ? this.renderResult(this.lastResult) : html`<p class="empty">No directive response yet.</p>`}
        </section>
      </section>
    `
  }

  private renderResult(result: DirectiveViewResult) {
    const tone = result.ok ? 'ok' : result.requires_confirmation ? 'warn' : 'danger'

    return html`
      <article class="panel">
        <span class=${`badge ${tone}`}>${result.requires_confirmation ? 'confirmation required' : result.ok ? 'ok' : 'failed'}</span>
        <p>${result.message}</p>
        ${result.artifactPath ? html`<p class="muted">Artifact: ${result.artifactPath}</p>` : nothing}
        ${result.generated_at ? html`<p class="muted">Generated: ${result.generated_at}</p>` : nothing}
      </article>
    `
  }

  private updateInput(event: InputEvent): void {
    const target = event.target
    if (!(target instanceof HTMLTextAreaElement)) return
    this.input = target.value
    this.requestUpdate()
  }

  private updateMode(event: Event): void {
    const target = event.target
    if (!(target instanceof HTMLSelectElement)) return
    this.mode = target.value === 'structured' ? 'structured' : 'natural'
    this.requestUpdate()
  }

  private execute(event: SubmitEvent): void {
    event.preventDefault()
    const input = this.input.trim()
    if (input.length === 0) return

    this.dispatchEvent(
      new CustomEvent<DirectiveExecuteDetail>('directive-execute', {
        bubbles: true,
        composed: true,
        detail: {
          input,
          mode: this.mode,
        },
      }),
    )
  }
}

customElements.define('agent-view-directive', AgentViewDirective)
