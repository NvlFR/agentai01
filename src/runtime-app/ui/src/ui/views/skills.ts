import { LitElement, css, html } from 'lit'
import type { RuntimeAppSnapshot } from '../../types/snapshot.js'

type SkillDescriptor = {
  id: string
  name: string
  version: string
  description: string
  deterministic: boolean
  manifestPath: string
}

export class AgentViewSkills extends LitElement {
  static properties = {
    snapshot: { type: Object },
    skills: { type: Array },
    loading: { type: Boolean },
    error: { type: String },
  }

  declare snapshot?: RuntimeAppSnapshot
  declare skills: SkillDescriptor[]
  declare loading: boolean
  declare error: string

  constructor() {
    super()
    this.skills = []
    this.loading = false
    this.error = ''
  }

  connectedCallback() {
    super.connectedCallback()
    this.fetchSkills()
  }

  static styles = css`
    :host {
      display: block;
    }

    section {
      display: grid;
      gap: 20px;
    }

    h2, h3, p {
      margin: 0;
    }

    h2 {
      color: var(--ink);
      font-size: 24px;
    }

    .grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    }

    .card {
      display: grid;
      gap: 12px;
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
      background: #e2e8f0;
      color: #475569;
    }

    .badge.deterministic {
      background: #ede9fe;
      color: #6d28d9;
    }

    .desc {
      color: var(--text);
      font-size: 14px;
      line-height: 1.5;
    }

    .path {
      font-family: monospace;
      color: var(--muted);
      font-size: 12px;
      background: var(--bg);
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid var(--line);
    }

    .empty {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--card);
      color: var(--muted);
      padding: 18px;
    }

    .loading {
      color: var(--primary);
      font-size: 14px;
      font-weight: 500;
    }

    .error {
      background: #fff5f5;
      border-left: 3px solid #e53e3e;
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 14px;
      color: #c53030;
    }
  `

  render() {
    return html`
      <section aria-labelledby="skills-heading">
        <h2 id="skills-heading">AI Agent Skills Repository</h2>

        ${this.error ? html`<div class="error">${this.error}</div>` : ''}

        ${this.loading
          ? html`<div class="loading">Loading skills from registry...</div>`
          : this.skills.length > 0
          ? html`
              <div class="grid">
                ${this.skills.map(skill => this.renderCard(skill))}
              </div>
            `
          : html`<p class="empty">No skills found in the registry.</p>`}
      </section>
    `
  }

  private renderCard(skill: SkillDescriptor) {
    return html`
      <div class="card">
        <header>
          <h3>${skill.name}</h3>
          <span class="badge ${skill.deterministic ? 'deterministic' : ''}">
            v${skill.version}
          </span>
        </header>

        <p class="desc">${skill.description}</p>
        <div class="path">${skill.manifestPath}</div>
      </div>
    `
  }

  private async fetchSkills() {
    this.loading = true
    this.error = ''
    try {
      const res = await fetch('/api/skills')
      const data = await res.json()
      this.skills = Array.isArray(data) ? data : data?.data ?? []
    } catch (err: any) {
      this.error = `Failed to load skills: ${err.message}`
    } finally {
      this.loading = false
    }
  }
}

customElements.define('agent-view-skills', AgentViewSkills)
