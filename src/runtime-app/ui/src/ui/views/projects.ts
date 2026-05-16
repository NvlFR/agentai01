import { LitElement, css, html } from 'lit'
import type { RuntimeAppSnapshot } from '../../types/snapshot.js'

export class AgentViewProjects extends LitElement {
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

    ul {
      display: grid;
      gap: 12px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: grid;
      gap: 12px;
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
      font-size: 17px;
    }

    .meta {
      color: var(--muted);
      font-size: 13px;
    }

    .status {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 4px 10px;
      color: var(--warn);
      background: color-mix(in srgb, var(--warn) 16%, transparent);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .status.completed {
      color: var(--ok);
      background: color-mix(in srgb, var(--ok) 14%, transparent);
    }

    .agents {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .agent {
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--bg-accent);
      color: var(--text);
      padding: 4px 10px;
      font-size: 12px;
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
    const projects = this.snapshot?.projects ?? []

    return html`
      <section aria-labelledby="projects-heading">
        <h2 id="projects-heading">Projects</h2>
        ${projects.length > 0
          ? html`
              <ul>
                ${projects.map(
                  project => html`
                    <li>
                      <header>
                        <h3>${project.project_id}</h3>
                        <span class="status ${project.lifecycle_state === 'closed' ? 'completed' : ''}">
                          ${project.lifecycle_state}
                        </span>
                      </header>
                      <p class="meta">Client ${project.client_id}</p>
                      <p class="meta">Milestone ${project.current_milestone}</p>
                      <section aria-label="Assigned agents" class="agents">
                        ${project.active_agent_ids.length > 0
                          ? project.active_agent_ids.map(
                              agentId => html`<span class="agent">${agentId}</span>`,
                            )
                          : html`<span class="meta">No assigned agents</span>`}
                      </section>
                    </li>
                  `,
                )}
              </ul>
            `
          : html`<p class="empty">No projects available.</p>`}
      </section>
    `
  }
}

customElements.define('agent-view-projects', AgentViewProjects)
