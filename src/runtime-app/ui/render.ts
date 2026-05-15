import type { RuntimeAppSnapshot } from '../state.js'

export function renderOperatorShell(snapshot: RuntimeAppSnapshot): string {
  const payload = escapeForScript(JSON.stringify(snapshot))

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Agent Runtime Operator</title>
    <style>${renderStyles()}</style>
  </head>
  <body>
    <div class="app-shell">
      <aside class="sidebar">
        <div>
          <p class="eyebrow">Operator Console</p>
          <h1>AI Company Runtime</h1>
          <p class="lede">Minimal shell untuk dashboard, approvals, jobs, logs, dan owner directive.</p>
        </div>
        <nav class="nav">
          <a href="#dashboard">Dashboard</a>
          <a href="#project-detail">Project Detail</a>
          <a href="#approvals">Approval Queue</a>
          <a href="#jobs">Runtime Jobs</a>
          <a href="#messages">Message Log</a>
          <a href="#audit">Audit Log</a>
          <a href="#directive">Submit Directive</a>
        </nav>
        <div class="card compact">
          <h2>Environment</h2>
          <dl id="env-summary" class="data-list"></dl>
        </div>
      </aside>
      <main class="content">
        <section id="banner-root"></section>
        <section id="dashboard" class="card">
          <div class="section-header">
            <div>
              <p class="eyebrow">Overview</p>
              <h2>Company Dashboard</h2>
            </div>
            <button id="refresh-button" class="ghost">Refresh</button>
          </div>
          <div id="kpi-grid" class="kpi-grid"></div>
          <div class="split">
            <div>
              <h3>Operational Issues</h3>
              <div id="issues-list" class="stack"></div>
            </div>
            <div>
              <h3>Runtime Workers</h3>
              <div id="workers-list" class="stack"></div>
            </div>
          </div>
        </section>

        <section id="project-detail" class="card">
          <div class="section-header">
            <div>
              <p class="eyebrow">Projects</p>
              <h2>Project Detail</h2>
            </div>
            <select id="project-select"></select>
          </div>
          <div id="project-summary" class="project-summary"></div>
          <div class="split">
            <div>
              <h3>Lifecycle History</h3>
              <div id="project-history" class="stack"></div>
            </div>
            <div>
              <h3>Related Activity</h3>
              <div id="project-related" class="stack"></div>
            </div>
          </div>
        </section>

        <section id="approvals" class="card">
          <div class="section-header">
            <div>
              <p class="eyebrow">Owner Queue</p>
              <h2>Approval Queue</h2>
            </div>
            <span id="approval-count" class="pill"></span>
          </div>
          <div id="approvals-list" class="stack"></div>
        </section>

        <section id="jobs" class="card">
          <div class="section-header">
            <div>
              <p class="eyebrow">Execution</p>
              <h2>Runtime Jobs</h2>
            </div>
            <span id="job-count" class="pill"></span>
          </div>
          <div id="jobs-list" class="stack"></div>
        </section>

        <section id="messages" class="card">
          <div class="section-header">
            <div>
              <p class="eyebrow">Bus</p>
              <h2>Message Log</h2>
            </div>
          </div>
          <div id="messages-list" class="stack"></div>
        </section>

        <section id="audit" class="card">
          <div class="section-header">
            <div>
              <p class="eyebrow">Traceability</p>
              <h2>Audit Log</h2>
            </div>
          </div>
          <div id="audit-list" class="stack"></div>
        </section>

        <section id="directive" class="card">
          <div class="section-header">
            <div>
              <p class="eyebrow">Owner Action</p>
              <h2>Submit Directive</h2>
            </div>
          </div>
          <form id="directive-form" class="stack">
            <label>
              Directive
              <textarea id="directive-input" rows="4" placeholder="status perusahaan"></textarea>
            </label>
            <label>
              Parse mode
              <select id="directive-mode">
                <option value="natural">Natural</option>
                <option value="structured">Structured</option>
              </select>
            </label>
            <button type="submit">Submit Directive</button>
          </form>
          <pre id="directive-response" class="console"></pre>
        </section>
      </main>
    </div>
    <script>window.__RUNTIME_APP__ = ${payload};</script>
    <script>${renderClientScript()}</script>
  </body>
</html>`
}

function renderStyles(): string {
  return `
    :root {
      color-scheme: light;
      --bg: #f5efe4;
      --panel: rgba(255, 252, 244, 0.88);
      --panel-strong: #fff9ef;
      --ink: #1f2a2a;
      --muted: #5e6b66;
      --line: rgba(31, 42, 42, 0.12);
      --accent: #0d7c66;
      --accent-soft: rgba(13, 124, 102, 0.14);
      --warn: #c57600;
      --danger: #a12d1f;
      --ok: #1f7a45;
      --shadow: 0 18px 45px rgba(59, 52, 36, 0.12);
      --radius: 20px;
      font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(215, 154, 72, 0.16), transparent 26%),
        radial-gradient(circle at top right, rgba(13, 124, 102, 0.12), transparent 24%),
        linear-gradient(180deg, #f8f2e8 0%, var(--bg) 100%);
    }
    .app-shell {
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      min-height: 100vh;
    }
    .sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 28px 22px;
      border-right: 1px solid var(--line);
      background: rgba(251, 247, 238, 0.84);
      backdrop-filter: blur(14px);
    }
    .content {
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding: 26px;
    }
    .nav {
      display: grid;
      gap: 10px;
    }
    .nav a {
      padding: 10px 12px;
      border-radius: 12px;
      color: var(--ink);
      text-decoration: none;
      background: rgba(255, 255, 255, 0.45);
    }
    .nav a:hover { background: var(--accent-soft); }
    .card {
      background: var(--panel);
      border: 1px solid rgba(255, 255, 255, 0.55);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 22px;
    }
    .compact { padding: 16px; }
    .section-header, .split {
      display: flex;
      gap: 16px;
      justify-content: space-between;
      align-items: flex-start;
    }
    .split > * { flex: 1; min-width: 0; }
    .eyebrow {
      margin: 0 0 6px;
      font-size: 12px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .lede, .meta, .data-list, label, p { color: var(--muted); }
    h1, h2, h3 { margin: 0 0 10px; font-family: "Space Grotesk", "IBM Plex Sans", sans-serif; }
    h1 { font-size: 28px; }
    h2 { font-size: 24px; }
    h3 { font-size: 16px; }
    button, select, textarea, input {
      font: inherit;
      border-radius: 12px;
      border: 1px solid var(--line);
      padding: 10px 12px;
      background: var(--panel-strong);
      color: var(--ink);
    }
    button {
      cursor: pointer;
      background: var(--accent);
      color: white;
      border: 0;
    }
    .ghost {
      color: var(--ink);
      background: rgba(255, 255, 255, 0.6);
      border: 1px solid var(--line);
    }
    .stack { display: grid; gap: 12px; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .kpi {
      padding: 16px;
      border-radius: 16px;
      background: linear-gradient(180deg, rgba(255,255,255,0.78), rgba(247, 240, 225, 0.94));
      border: 1px solid var(--line);
    }
    .kpi strong {
      display: block;
      font-size: 24px;
      color: var(--ink);
      margin-bottom: 6px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 13px;
      font-weight: 600;
    }
    .banner {
      padding: 16px 18px;
      border-radius: 18px;
      font-weight: 600;
      box-shadow: var(--shadow);
    }
    .banner.degraded { background: rgba(197, 118, 0, 0.14); color: var(--warn); }
    .banner.not-ready { background: rgba(161, 45, 31, 0.14); color: var(--danger); }
    .item {
      padding: 14px 16px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.54);
      border: 1px solid var(--line);
    }
    .item header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: baseline;
      margin-bottom: 8px;
    }
    .item-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .item-actions button.reject,
    .item-actions button.retry-danger {
      background: var(--danger);
    }
    .item-actions button.revise {
      background: var(--warn);
    }
    .status {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .status.ok { color: var(--ok); }
    .status.warn { color: var(--warn); }
    .status.danger { color: var(--danger); }
    .console {
      padding: 14px;
      border-radius: 14px;
      background: #14211f;
      color: #dcf7ef;
      overflow: auto;
      min-height: 120px;
      white-space: pre-wrap;
    }
    .project-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    .metric {
      background: rgba(255,255,255,0.58);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 14px;
    }
    .data-list {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 6px 10px;
      margin: 0;
      font-size: 14px;
    }
    .muted { color: var(--muted); }
    @media (max-width: 980px) {
      .app-shell { grid-template-columns: 1fr; }
      .sidebar {
        position: static;
        height: auto;
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }
      .section-header, .split { flex-direction: column; }
    }
  `
}

function renderClientScript(): string {
  return `
    const state = { snapshot: window.__RUNTIME_APP__ };

    const bannerRoot = document.getElementById('banner-root');
    const kpiGrid = document.getElementById('kpi-grid');
    const issuesList = document.getElementById('issues-list');
    const workersList = document.getElementById('workers-list');
    const projectSelect = document.getElementById('project-select');
    const projectSummary = document.getElementById('project-summary');
    const projectHistory = document.getElementById('project-history');
    const projectRelated = document.getElementById('project-related');
    const approvalsList = document.getElementById('approvals-list');
    const approvalCount = document.getElementById('approval-count');
    const jobsList = document.getElementById('jobs-list');
    const jobCount = document.getElementById('job-count');
    const messagesList = document.getElementById('messages-list');
    const auditList = document.getElementById('audit-list');
    const envSummary = document.getElementById('env-summary');
    const refreshButton = document.getElementById('refresh-button');
    const directiveForm = document.getElementById('directive-form');
    const directiveInput = document.getElementById('directive-input');
    const directiveMode = document.getElementById('directive-mode');
    const directiveResponse = document.getElementById('directive-response');

    refreshButton.addEventListener('click', () => refresh());
    projectSelect.addEventListener('change', () => renderProject(projectSelect.value));
    directiveForm.addEventListener('submit', async event => {
      event.preventDefault();
      const payload = {
        input: directiveInput.value,
        mode: directiveMode.value,
      };
      const result = await postJson('/api/directives', payload, false);
      directiveResponse.textContent = JSON.stringify(result, null, 2);
      await refresh();
    });

    async function refresh() {
      state.snapshot = await fetchJson('/api/snapshot');
      renderAll();
    }

    async function respondApproval(requestId, decision) {
      const notes = decision === 'revise'
        ? window.prompt('Catatan revisi untuk agent terkait:', 'Tambahkan mitigasi risiko dan update artefak.') ?? ''
        : decision === 'reject'
          ? window.prompt('Alasan reject:', 'Tolak sementara sampai data pendukung lengkap.') ?? ''
          : '';
      const risky = decision !== 'approve';
      const result = await postJson('/api/approvals/' + encodeURIComponent(requestId) + '/respond', {
        decision,
        notes,
      }, risky);
      window.alert(result.message);
      await refresh();
    }

    async function retryJob(jobId) {
      const result = await postJson('/api/jobs/' + encodeURIComponent(jobId) + '/retry', {}, true);
      window.alert(result.message);
      await refresh();
    }

    async function retryMessage(logId) {
      const result = await postJson('/api/messages/' + encodeURIComponent(logId) + '/retry', {}, true);
      window.alert(result.message);
      await refresh();
    }

    async function postJson(path, payload, risky) {
      const firstPass = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await firstPass.json();

      if (firstPass.status === 409 && data.requires_confirmation) {
        const approved = window.confirm(data.message || 'Aksi ini berisiko. Lanjutkan?');
        if (!approved) return data;
        const confirmed = await fetch(path, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ...payload, confirm: true }),
        });
        return confirmed.json();
      }

      if (!firstPass.ok && !risky) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    }

    async function fetchJson(path) {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error('Failed to fetch ' + path);
      }
      return response.json();
    }

    function renderAll() {
      renderBanner();
      renderEnvironment();
      renderKpis();
      renderIssues();
      renderWorkers();
      renderProjects();
      renderApprovals();
      renderJobs();
      renderMessages();
      renderAudit();
      if (!projectSelect.value && state.snapshot.projects.length > 0) {
        projectSelect.value = state.snapshot.projects[0].project_id;
      }
      renderProject(projectSelect.value);
    }

    function renderBanner() {
      const readiness = state.snapshot.readiness;
      const health = state.snapshot.health;
      if (!readiness.ready) {
        bannerRoot.innerHTML = '<div class="banner not-ready">Not ready: ' + readiness.reasons.join(' ') + '</div>';
        return;
      }
      if (health.status === 'degraded' || state.snapshot.runtime.shell_status === 'degraded') {
        bannerRoot.innerHTML = '<div class="banner degraded">Degraded runtime: ada worker offline atau isu operasional yang perlu ditindak.</div>';
        return;
      }
      bannerRoot.innerHTML = '';
    }

    function renderEnvironment() {
      const entries = [
        ['app_env', state.snapshot.environment.env],
        ['app_port', String(state.snapshot.environment.port)],
        ['ai_base_url', state.snapshot.environment.ai_base_url],
        ['ai_model', state.snapshot.environment.ai_model],
        ['ai_api_key', state.snapshot.environment.ai_api_key_masked],
      ];
      envSummary.innerHTML = entries.map(([key, value]) => '<dt>' + key + '</dt><dd>' + value + '</dd>').join('');
    }

    function renderKpis() {
      const dashboard = state.snapshot.dashboard;
      const cards = [
        ['Active Projects', dashboard.kpis.active_project_count],
        ['Pending Approvals', dashboard.kpis.pending_approval_count],
        ['Support Tickets', dashboard.kpis.support_ticket_count],
        ['Utilization', dashboard.kpis.agent_utilization_rate],
        ['Audit Events', dashboard.refresh.audit_event_count],
        ['Messages', dashboard.refresh.communication_event_count],
      ];
      kpiGrid.innerHTML = cards.map(([label, value]) => '<div class="kpi"><strong>' + value + '</strong><span>' + label + '</span></div>').join('');
    }

    function renderIssues() {
      issuesList.innerHTML = state.snapshot.dashboard.operational_issues.map(issue =>
        '<article class="item"><header><strong>' + issue.summary + '</strong><span class="status ' + severityClass(issue.severity) + '">' + issue.severity + '</span></header><div class="meta">kind: ' + issue.kind + (issue.project_id ? ' · project: ' + issue.project_id : '') + '</div></article>'
      ).join('') || '<p class="muted">No active issues.</p>';
    }

    function renderWorkers() {
      workersList.innerHTML = state.snapshot.runtime.workers.map(worker =>
        '<article class="item"><header><strong>' + worker.worker_id + '</strong><span class="status ' + severityClass(worker.status === 'offline' ? 'high' : worker.status === 'busy' ? 'medium' : 'low') + '">' + worker.status + '</span></header><div class="meta">' + worker.agent_type + (worker.project_id ? ' · ' + worker.project_id : '') + '</div></article>'
      ).join('');
    }

    function renderProjects() {
      projectSelect.innerHTML = state.snapshot.projects.map(project =>
        '<option value="' + project.project_id + '">' + project.project_id + ' · ' + project.client_id + '</option>'
      ).join('');
    }

    function renderProject(projectId) {
      const project = state.snapshot.project_details.find(item => item.project.project_id === projectId);
      if (!project) {
        projectSummary.innerHTML = '<p class="muted">Select a project to inspect details.</p>';
        projectHistory.innerHTML = '';
        projectRelated.innerHTML = '';
        return;
      }
      projectSummary.innerHTML = [
        metric('Lifecycle', project.project.lifecycle_state),
        metric('Milestone', project.project.current_milestone),
        metric('Agents', project.project.active_agent_ids.join(', ') || 'Unassigned'),
        metric('Updated', project.project.updated_at),
      ].join('');
      projectHistory.innerHTML = project.history.map(entry =>
        '<article class="item"><header><strong>' + entry.lifecycle_state + '</strong><span class="meta">' + entry.recorded_at + '</span></header><div class="meta">milestone: ' + entry.current_milestone + '</div></article>'
      ).join('') || '<p class="muted">No history yet.</p>';
      projectRelated.innerHTML = [
        ...project.approvals.map(approval => '<article class="item"><strong>Approval</strong><div class="meta">' + approval.request_id + ' · ' + approval.summary + '</div></article>'),
        ...project.jobs.map(job => '<article class="item"><strong>Job</strong><div class="meta">' + job.job_id + ' · ' + job.status + ' · ' + job.kind + '</div></article>'),
        ...project.messages.map(message => '<article class="item"><strong>Message</strong><div class="meta">' + message.log_id + ' · ' + message.status + ' · ' + message.message.message_type + '</div></article>')
      ].join('') || '<p class="muted">No related activity.</p>';
    }

    function renderApprovals() {
      approvalCount.textContent = state.snapshot.approvals.length + ' pending';
      approvalsList.innerHTML = state.snapshot.approvals.map(approval =>
        '<article class="item"><header><strong>' + approval.summary + '</strong><span class="status warn">' + approval.gate + '</span></header><div class="meta">' + approval.from_agent + ' · ' + (approval.project_id || 'global') + ' · ' + approval.timestamp + '</div><div class="meta">artifact: ' + approval.artifact_ref + '</div><div class="item-actions"><button data-approve="' + approval.request_id + '">Approve</button><button class="reject" data-reject="' + approval.request_id + '">Reject</button><button class="revise" data-revise="' + approval.request_id + '">Revise</button></div></article>'
      ).join('') || '<p class="muted">Approval queue is empty.</p>';

      approvalsList.querySelectorAll('[data-approve]').forEach(button => button.addEventListener('click', () => respondApproval(button.dataset.approve, 'approve')));
      approvalsList.querySelectorAll('[data-reject]').forEach(button => button.addEventListener('click', () => respondApproval(button.dataset.reject, 'reject')));
      approvalsList.querySelectorAll('[data-revise]').forEach(button => button.addEventListener('click', () => respondApproval(button.dataset.revise, 'revise')));
    }

    function renderJobs() {
      jobCount.textContent = state.snapshot.jobs.length + ' jobs';
      jobsList.innerHTML = state.snapshot.jobs.map(job =>
        '<article class="item"><header><strong>' + job.job_id + '</strong><span class="status ' + severityClass(job.status === 'failed' ? 'high' : job.status === 'retrying' ? 'medium' : 'low') + '">' + job.status + '</span></header><div class="meta">' + job.kind + ' · attempts ' + job.attempts + '/' + job.max_attempts + (job.project_id ? ' · ' + job.project_id : '') + '</div><div class="meta">' + job.detail + '</div>' + (job.error ? '<div class="meta">error: ' + job.error + '</div>' : '') + (job.status === 'failed' ? '<div class="item-actions"><button class="retry-danger" data-retry-job="' + job.job_id + '">Retry Action</button></div>' : '') + '</article>'
      ).join('');
      jobsList.querySelectorAll('[data-retry-job]').forEach(button => button.addEventListener('click', () => retryJob(button.dataset.retryJob)));
    }

    function renderMessages() {
      messagesList.innerHTML = state.snapshot.messages.map(message =>
        '<article class="item"><header><strong>' + message.log_id + '</strong><span class="status ' + severityClass(message.status === 'rejected' ? 'high' : message.requires_acknowledgment && !message.acknowledged_at ? 'medium' : 'low') + '">' + message.status + '</span></header><div class="meta">' + message.message.from + ' → ' + message.message.to + ' · ' + message.message.message_type + ' · ' + message.message.project_id + '</div><div class="meta">' + message.recorded_at + (message.rejection_reason ? ' · ' + message.rejection_reason : '') + '</div>' + (message.status === 'rejected' ? '<div class="item-actions"><button class="retry-danger" data-retry-message="' + message.log_id + '">Retry Action</button></div>' : '') + '</article>'
      ).join('');
      messagesList.querySelectorAll('[data-retry-message]').forEach(button => button.addEventListener('click', () => retryMessage(button.dataset.retryMessage)));
    }

    function renderAudit() {
      auditList.innerHTML = state.snapshot.audit.slice(0, 30).map(entry =>
        '<article class="item"><header><strong>' + entry.action + '</strong><span class="meta">' + entry.timestamp + '</span></header><div class="meta">' + entry.actor + ' · ' + entry.target + '</div><div class="meta">' + entry.detail + '</div></article>'
      ).join('');
    }

    function metric(label, value) {
      return '<div class="metric"><div class="eyebrow">' + label + '</div><strong>' + value + '</strong></div>';
    }

    function severityClass(severity) {
      if (severity === 'critical' || severity === 'high' || severity === 'failed' || severity === 'rejected' || severity === 'offline') return 'danger';
      if (severity === 'medium' || severity === 'busy' || severity === 'retrying') return 'warn';
      return 'ok';
    }

    renderAll();
  `
}

function escapeForScript(value: string): string {
  return value.replace(/</g, '\\u003c')
}
