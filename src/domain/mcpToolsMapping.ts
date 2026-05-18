/**
 * MCP Tools & Repositories Mapping — Sub-Agent Hierarchy Infrastructure
 *
 * Mengimplementasikan `.kiro/specs/subagent-hierarchy-infrastructure/mcp-tools-mapping.md`:
 * - Katalog server MCP resmi (Model Context Protocol)
 * - Pemetaan logical tool ID (`McpToolId`) → server MCP
 * - Profil per agen: fokus, tools (design.md), server, repositori eksternal
 *
 * Lihat juga: design.md (alokasi tools per specialist), requirements.md §4 (master list)
 */

import type { AgentHierarchyConfig, McpToolId } from './hierarchy.js'
import { MCP_TOOL_IDS } from './hierarchy.js'

// ---------------------------------------------------------------------------
// Official MCP server catalog (mcp-tools-mapping.md)
// ---------------------------------------------------------------------------

export const MCP_SERVER_IDS = [
  'brave-search',
  'notion',
  'slack',
  'postgres',
  'memory',
  'github',
  'git',
  'fetch',
  'filesystem',
  'puppeteer',
  'sqlite',
  'google-analytics-mcp',
] as const

export type McpServerId = (typeof MCP_SERVER_IDS)[number]

export interface McpServerDescriptor {
  id: McpServerId
  /** Path relatif di repo modelcontextprotocol/servers (jika resmi). */
  upstreamPath?: string
  description: string
}

export const MCP_SERVER_CATALOG: Record<McpServerId, McpServerDescriptor> = {
  'brave-search': {
    id: 'brave-search',
    upstreamPath: 'src/brave-search',
    description: 'Pencarian web berkinerja tinggi (market intel, riset kompetitor).',
  },
  notion: {
    id: 'notion',
    upstreamPath: 'src/notion',
    description: 'Dokumen strategi, OKR, basis pengetahuan, PRD.',
  },
  slack: {
    id: 'slack',
    upstreamPath: 'src/slack',
    description: 'Broadcast eksekutif, eskalasi, koordinasi tim.',
  },
  postgres: {
    id: 'postgres',
    upstreamPath: 'src/postgres',
    description: 'Analitik finansial, burn rate, konsumsi token, migrasi skema.',
  },
  memory: {
    id: 'memory',
    upstreamPath: 'src/memory',
    description: 'Memori jangka panjang: visi, keputusan, sprint, negosiasi.',
  },
  github: {
    id: 'github',
    upstreamPath: 'src/github',
    description: 'Issues, PR, CI/CD, Dependabot, GitHub Projects.',
  },
  git: {
    id: 'git',
    upstreamPath: 'src/git',
    description: 'Operasi Git otonom untuk diff, branch, commit, dan inspeksi repo.',
  },
  fetch: {
    id: 'fetch',
    upstreamPath: 'src/fetch',
    description: 'Ekstraksi halaman web untuk verifikasi entitas bisnis.',
  },
  filesystem: {
    id: 'filesystem',
    upstreamPath: 'src/filesystem',
    description: 'Navigasi codebase, templat proposal, basis pengetahuan markdown.',
  },
  puppeteer: {
    id: 'puppeteer',
    upstreamPath: 'src/puppeteer',
    description: 'Inspeksi visual UI, E2E, tangkapan layar.',
  },
  sqlite: {
    id: 'sqlite',
    upstreamPath: 'src/sqlite',
    description: 'Tiket lokal, log transaksi, status insiden.',
  },
  'google-analytics-mcp': {
    id: 'google-analytics-mcp',
    description: 'Metrik lalu lintas, drop-off, anomali error/traffic.',
  },
}

// ---------------------------------------------------------------------------
// Logical tool → MCP server resolution
// ---------------------------------------------------------------------------

export const LOGICAL_TOOL_TO_MCP_SERVERS: Record<McpToolId, readonly McpServerId[]> = {
  anthropic_api: ['memory'],
  notion: ['notion', 'memory'],
  google_sheets: ['postgres', 'google-analytics-mcp'],
  google_drive: ['filesystem', 'notion'],
  gmail: ['fetch'],
  slack: ['slack'],
  google_calendar: ['notion'],
  github: ['github'],
  web_search: ['brave-search', 'fetch'],
  bash_tool: ['filesystem', 'git', 'github'],
  figma_mcp: ['puppeteer'],
  canva_mcp: ['filesystem'],
  whatsapp_api: ['slack'],
}

export function resolveMcpServersForTools(toolIds: readonly McpToolId[]): McpServerId[] {
  const set = new Set<McpServerId>()
  for (const toolId of toolIds) {
    const mapped = LOGICAL_TOOL_TO_MCP_SERVERS[toolId]
    for (const serverId of mapped) {
      set.add(serverId)
    }
  }
  return [...set].sort()
}

// ---------------------------------------------------------------------------
// External repositories (mcp-tools-mapping.md)
// ---------------------------------------------------------------------------

export interface ExternalRepositoryRef {
  id: string
  url: string
  purpose: string
}

export const REPOSITORY_CATALOG: Record<string, ExternalRepositoryRef> = {
  'antigravity-awesome-skills': {
    id: 'antigravity-awesome-skills',
    url: 'https://github.com/sickn33/antigravity-awesome-skills',
    purpose: 'Skills eksekutif, konten, PRD, TDD, proposal bisnis.',
  },
  'open-outreach': {
    id: 'open-outreach',
    url: 'https://github.com/eracle/OpenOutreach',
    purpose: 'Prospek, cold outreach, kualifikasi, objection handling.',
  },
  'agentic-seo-skill': {
    id: 'agentic-seo-skill',
    url: 'https://github.com/Bhanunamikaze/Agentic-SEO-Skill',
    purpose: 'Audit SEO, riset kata kunci, analisis pasar organik.',
  },
  'youtube-content-creation-agent': {
    id: 'youtube-content-creation-agent',
    url: 'https://github.com/Salimzaks/Youtube-content-creation-agent',
    purpose: 'Riset ide dan naskah konten YouTube.',
  },
  'smart-marketing-assistant-crew-ai': {
    id: 'smart-marketing-assistant-crew-ai',
    url: 'https://github.com/praj2408/Smart-Marketing-Assistant-Crew-AI',
    purpose: 'Strategi konten dan copywriting multi-agen.',
  },
  'facebook-python-business-sdk': {
    id: 'facebook-python-business-sdk',
    url: 'https://github.com/facebook/facebook-python-business-sdk',
    purpose: 'Kampanye iklan Meta (Facebook & Instagram).',
  },
  instapy: {
    id: 'instapy',
    url: 'https://github.com/InstaPy/InstaPy',
    purpose: 'Otomatisasi interaksi Instagram.',
  },
  'facebook-posts-automation': {
    id: 'facebook-posts-automation',
    url: 'https://github.com/adar2/Facebook-Posts-Automation',
    purpose: 'Publikasi otomatis ke grup/halaman Facebook.',
  },
  'tiktok-automation': {
    id: 'tiktok-automation',
    url: 'https://github.com/DreamingWater/TiktokAutomation',
    purpose: 'Scraping tren TikTok.',
  },
  'tiktok-uploader': {
    id: 'tiktok-uploader',
    url: 'https://github.com/wkaisertexas/tiktok-uploader',
    purpose: 'Upload video TikTok via Playwright.',
  },
}

// ---------------------------------------------------------------------------
// Design.md canonical tool assignments (requirements §3 + design table)
// ---------------------------------------------------------------------------

/**
 * Tools yang diizinkan per specialist/head/ceo — sumber: design.md.
 * Dipakai untuk validasi `allowedMcpTools` pada konfigurasi runtime.
 */
export const DESIGN_CANONICAL_TOOLS: Record<string, readonly McpToolId[]> = {
  'ceo-agent': ['notion', 'slack', 'google_sheets', 'gmail', 'google_calendar', 'anthropic_api'],
  'ceo-strategy-analyst': ['web_search', 'notion', 'google_sheets'],
  'ceo-report-summarizer': ['notion', 'slack', 'anthropic_api'],
  'ceo-decision-logger': ['notion', 'google_drive'],
  'ceo-okr-tracker': ['notion', 'google_sheets', 'slack'],
  'marketing-head': ['notion', 'slack', 'google_sheets'],
  'marketing-content-creator': ['canva_mcp', 'notion', 'google_drive'],
  'marketing-seo-specialist': ['web_search', 'google_sheets'],
  'marketing-campaign-manager': ['whatsapp_api', 'google_sheets', 'gmail'],
  'marketing-analytics-reader': ['google_sheets', 'web_search'],
  'marketing-social-scheduler': ['notion', 'google_calendar', 'slack'],
  'marketing-trend-watcher': ['web_search', 'slack'],
  'sales-head': ['notion', 'slack', 'google_sheets', 'gmail'],
  'sales-lead-qualifier': ['web_search', 'google_sheets', 'gmail'],
  'sales-proposal-generator': ['google_sheets', 'google_drive', 'notion'],
  'sales-followup-drafter': ['gmail', 'slack', 'anthropic_api'],
  'sales-pipeline-tracker': ['notion', 'google_sheets'],
  'sales-competitor-watcher': ['web_search', 'notion'],
  'product-head': ['notion', 'slack', 'google_sheets', 'figma_mcp'],
  'product-user-researcher': ['web_search', 'google_sheets', 'notion'],
  'product-feature-prioritizer': ['notion', 'google_sheets'],
  'product-prd-writer': ['notion', 'google_drive', 'figma_mcp'],
  'product-roadmap-builder': ['notion', 'google_sheets', 'slack'],
  'product-feedback-analyzer': ['anthropic_api', 'google_sheets'],
  'engineering-head': ['github', 'slack', 'notion', 'bash_tool'],
  'eng-code-reviewer': ['github', 'bash_tool'],
  'eng-bug-hunter': ['github', 'bash_tool', 'web_search'],
  'eng-docs-writer': ['notion', 'github', 'google_drive'],
  'eng-infra-monitor': ['slack', 'github', 'bash_tool'],
  'eng-test-generator': ['github', 'bash_tool', 'anthropic_api'],
  'eng-pr-summarizer': ['github', 'notion', 'slack'],
  'pm-head': ['notion', 'slack', 'google_calendar', 'github', 'google_sheets'],
  'pm-task-coordinator': ['notion', 'slack', 'github'],
  'pm-risk-analyzer': ['github', 'notion', 'slack'],
  'pm-sprint-planner': ['notion', 'google_calendar', 'google_sheets'],
  'pm-progress-reporter': ['notion', 'slack', 'gmail'],
  'pm-deadline-watcher': ['slack', 'google_calendar', 'notion'],
  'support-head': ['notion', 'slack', 'gmail', 'whatsapp_api', 'google_sheets'],
  'support-ticket-classifier': ['notion', 'google_sheets', 'gmail'],
  'support-faq-responder': ['notion', 'whatsapp_api', 'gmail'],
  'support-escalation-router': ['slack', 'github', 'gmail'],
  'support-csat-analyzer': ['google_sheets', 'notion', 'anthropic_api'],
  'support-knowledge-builder': ['notion', 'google_drive'],
  'support-wa-bot-handler': ['whatsapp_api', 'notion'],
}

// ---------------------------------------------------------------------------
// Per-agent profiles (mcp-tools-mapping.md → agentId implementasi)
// ---------------------------------------------------------------------------

export interface AgentMcpToolProfile {
  agentId: string
  /** Nama peran di mcp-tools-mapping.md (jika ada padanan konseptual). */
  specRoleName: string
  focus: string
  /** Harus sama dengan DESIGN_CANONICAL_TOOLS[agentId] bila terdefinisi. */
  canonicalTools: readonly McpToolId[]
  mcpServers: readonly McpServerId[]
  repositories: readonly ExternalRepositoryRef[]
}

type ProfileSeed = Omit<AgentMcpToolProfile, 'mcpServers' | 'canonicalTools'> & {
  canonicalTools?: readonly McpToolId[]
}

function buildProfile(seed: ProfileSeed): AgentMcpToolProfile {
  const canonicalTools =
    seed.canonicalTools ?? DESIGN_CANONICAL_TOOLS[seed.agentId] ?? []
  return {
    ...seed,
    canonicalTools,
    mcpServers: resolveMcpServersForTools(canonicalTools),
  }
}

const PROFILE_SEEDS: ProfileSeed[] = [
  {
    agentId: 'ceo-agent',
    specRoleName: 'CEO Orchestrator & Strategist',
    focus: 'Strategi perusahaan, OKR, alokasi anggaran, komando ke Department Heads.',
    repositories: [REPOSITORY_CATALOG['antigravity-awesome-skills']],
  },
  {
    agentId: 'ceo-strategy-analyst',
    specRoleName: 'Strategy Analyst',
    focus: 'Analisis strategi makro dan pergerakan kompetitor.',
    repositories: [REPOSITORY_CATALOG['antigravity-awesome-skills']],
  },
  {
    agentId: 'ceo-report-summarizer',
    specRoleName: 'Report Summarizer',
    focus: 'Ringkasan eksekutif laporan departemen.',
    repositories: [REPOSITORY_CATALOG['antigravity-awesome-skills']],
  },
  {
    agentId: 'ceo-decision-logger',
    specRoleName: 'Decision Logger',
    focus: 'Rekam jejak keputusan strategis.',
    repositories: [],
  },
  {
    agentId: 'ceo-okr-tracker',
    specRoleName: 'OKR Tracker',
    focus: 'Pemantauan OKR lintas departemen.',
    repositories: [],
  },
  {
    agentId: 'marketing-head',
    specRoleName: 'Marketing Department Head',
    focus: 'Orkestrasi kampanye dan sintesis laporan marketing.',
    repositories: [],
  },
  {
    agentId: 'marketing-trend-watcher',
    specRoleName: 'Lead Hunter Agent',
    focus: 'Pencarian prospek, ekstraksi kontak, pemindaian direktori bisnis.',
    repositories: [
      REPOSITORY_CATALOG['open-outreach'],
      REPOSITORY_CATALOG['agentic-seo-skill'],
    ],
  },
  {
    agentId: 'marketing-analytics-reader',
    specRoleName: 'Content Analyst Agent',
    focus: 'Analisis lalu lintas, tren SEO, metrik konversi.',
    repositories: [REPOSITORY_CATALOG['agentic-seo-skill']],
  },
  {
    agentId: 'marketing-content-creator',
    specRoleName: 'Content Creator Agent',
    focus: 'Copywriting kampanye dan aset visual/video.',
    repositories: [
      REPOSITORY_CATALOG['youtube-content-creation-agent'],
      REPOSITORY_CATALOG['smart-marketing-assistant-crew-ai'],
      REPOSITORY_CATALOG['antigravity-awesome-skills'],
    ],
  },
  {
    agentId: 'marketing-campaign-manager',
    specRoleName: 'Promotion & Outreach Agent',
    focus: 'Distribusi pesan, publikasi sosial, manajemen iklan.',
    repositories: [
      REPOSITORY_CATALOG['facebook-python-business-sdk'],
      REPOSITORY_CATALOG.instapy,
      REPOSITORY_CATALOG['facebook-posts-automation'],
      REPOSITORY_CATALOG['tiktok-automation'],
      REPOSITORY_CATALOG['tiktok-uploader'],
      REPOSITORY_CATALOG['open-outreach'],
    ],
  },
  {
    agentId: 'marketing-seo-specialist',
    specRoleName: 'SEO Specialist',
    focus: 'Riset kata kunci dan audit organik.',
    repositories: [REPOSITORY_CATALOG['agentic-seo-skill']],
  },
  {
    agentId: 'marketing-social-scheduler',
    specRoleName: 'Social Scheduler',
    focus: 'Penjadwalan konten ke kalender publikasi.',
    repositories: [
      REPOSITORY_CATALOG.instapy,
      REPOSITORY_CATALOG['facebook-posts-automation'],
    ],
  },
  {
    agentId: 'sales-head',
    specRoleName: 'Sales Department Head',
    focus: 'Orkestrasi pipeline dan sintesis laporan sales.',
    repositories: [],
  },
  {
    agentId: 'sales-lead-qualifier',
    specRoleName: 'Lead Qualification Agent',
    focus: 'Verifikasi BANT dan validasi entitas bisnis.',
    repositories: [REPOSITORY_CATALOG['open-outreach']],
  },
  {
    agentId: 'sales-proposal-generator',
    specRoleName: 'Proposal Architect Agent',
    focus: 'Penawaran komersial, kalkulasi harga, ROI.',
    repositories: [REPOSITORY_CATALOG['antigravity-awesome-skills']],
  },
  {
    agentId: 'sales-followup-drafter',
    specRoleName: 'Objection Handler Agent',
    focus: 'Negosiasi, keberatan klien, tindak lanjut.',
    repositories: [REPOSITORY_CATALOG['open-outreach']],
  },
  {
    agentId: 'sales-pipeline-tracker',
    specRoleName: 'Pipeline Tracker',
    focus: 'Pelacakan tahapan sales pipeline.',
    repositories: [],
  },
  {
    agentId: 'sales-competitor-watcher',
    specRoleName: 'Competitor Watcher',
    focus: 'Analisis penawaran dan harga kompetitor.',
    repositories: [],
  },
  {
    agentId: 'product-head',
    specRoleName: 'Product Department Head',
    focus: 'Orkestrasi riset produk dan roadmap.',
    repositories: [],
  },
  {
    agentId: 'product-user-researcher',
    specRoleName: 'User Research Agent',
    focus: 'Pain points, persona, riset kompetitor.',
    repositories: [REPOSITORY_CATALOG['agentic-seo-skill']],
  },
  {
    agentId: 'product-feature-prioritizer',
    specRoleName: 'Feature Prioritizer',
    focus: 'Prioritisasi backlog RICE/ICE.',
    repositories: [REPOSITORY_CATALOG['antigravity-awesome-skills']],
  },
  {
    agentId: 'product-prd-writer',
    specRoleName: 'PRD Scaffolder Agent',
    focus: 'Penulisan PRD dan arsitektur fitur.',
    repositories: [REPOSITORY_CATALOG['antigravity-awesome-skills']],
  },
  {
    agentId: 'product-roadmap-builder',
    specRoleName: 'Roadmap Builder',
    focus: 'Peta jalan jangka pendek-panjang.',
    repositories: [],
  },
  {
    agentId: 'product-feedback-analyzer',
    specRoleName: 'Feedback Analyzer',
    focus: 'Pengelompokan masukan dan tiket komplain.',
    repositories: [],
  },
  {
    agentId: 'engineering-head',
    specRoleName: 'Engineering Department Head',
    focus: 'Orkestrasi delivery teknis departemen.',
    repositories: [],
  },
  {
    agentId: 'eng-code-reviewer',
    specRoleName: 'Implementation / Coder Agent',
    focus: 'Penulisan kode, refaktoring, review PR.',
    repositories: [],
  },
  {
    agentId: 'eng-bug-hunter',
    specRoleName: 'Implementation / Coder Agent',
    focus: 'Analisis bug, stack trace, log.',
    repositories: [],
  },
  {
    agentId: 'eng-docs-writer',
    specRoleName: 'Implementation / Coder Agent',
    focus: 'Dokumentasi teknis dan API.',
    repositories: [],
  },
  {
    agentId: 'eng-test-generator',
    specRoleName: 'QA & Fuzzing Agent',
    focus: 'Unit test, E2E, skenario pengujian.',
    repositories: [REPOSITORY_CATALOG['antigravity-awesome-skills']],
  },
  {
    agentId: 'eng-infra-monitor',
    specRoleName: 'Deployment Cloud Agent',
    focus: 'CI/CD, metrik server, migrasi basis data.',
    repositories: [],
  },
  {
    agentId: 'eng-pr-summarizer',
    specRoleName: 'DevSecOps Agent',
    focus: 'Ringkasan PR, Dependabot, release notes.',
    repositories: [],
  },
  {
    agentId: 'pm-head',
    specRoleName: 'Project Manager Department Head',
    focus: 'Orkestrasi sprint dan laporan lintas tim.',
    repositories: [],
  },
  {
    agentId: 'pm-sprint-planner',
    specRoleName: 'Sprint Tracker Agent',
    focus: 'Burndown, tenggat, status tiket.',
    repositories: [],
  },
  {
    agentId: 'pm-risk-analyzer',
    specRoleName: 'Risk & Blocker Analyst Agent',
    focus: 'Keterlambatan, PR stale, hambatan teknis.',
    repositories: [],
  },
  {
    agentId: 'pm-task-coordinator',
    specRoleName: 'Resource Allocator Agent',
    focus: 'Alokasi beban kerja sub-agen teknis.',
    repositories: [],
  },
  {
    agentId: 'pm-progress-reporter',
    specRoleName: 'Progress Reporter',
    focus: 'Laporan kemajuan mingguan untuk CEO.',
    repositories: [],
  },
  {
    agentId: 'pm-deadline-watcher',
    specRoleName: 'Deadline Watcher',
    focus: 'Pengingat tenggat otomatis.',
    repositories: [],
  },
  {
    agentId: 'support-head',
    specRoleName: 'Support Department Head',
    focus: 'Orkestrasi tiket dan CSAT.',
    repositories: [],
  },
  {
    agentId: 'support-ticket-classifier',
    specRoleName: 'Ticket Triage Agent',
    focus: 'Klasifikasi tiket dan prioritas.',
    repositories: [],
  },
  {
    agentId: 'support-faq-responder',
    specRoleName: 'Knowledge Base Navigator Agent',
    focus: 'Jawaban FAQ dari basis pengetahuan.',
    repositories: [],
  },
  {
    agentId: 'support-knowledge-builder',
    specRoleName: 'Knowledge Base Navigator Agent',
    focus: 'Pembaruan artikel basis pengetahuan.',
    repositories: [],
  },
  {
    agentId: 'support-csat-analyzer',
    specRoleName: 'Troubleshooting Agent',
    focus: 'Analisis log, metrik, anomali traffic.',
    repositories: [REPOSITORY_CATALOG['agentic-seo-skill']],
  },
  {
    agentId: 'support-escalation-router',
    specRoleName: 'Escalation Agent',
    focus: 'Eskalasi ke Engineering/PM, broadcast insiden.',
    repositories: [REPOSITORY_CATALOG['open-outreach']],
  },
  {
    agentId: 'support-wa-bot-handler',
    specRoleName: 'WA Bot Handler',
    focus: 'Otomasi chatbot WhatsApp pelanggan.',
    repositories: [],
  },
]

export const AGENT_MCP_TOOL_PROFILES: Record<string, AgentMcpToolProfile> = Object.fromEntries(
  PROFILE_SEEDS.map(seed => [seed.agentId, buildProfile(seed)]),
)

export const ALL_MAPPED_AGENT_IDS = Object.keys(AGENT_MCP_TOOL_PROFILES).sort()

// ---------------------------------------------------------------------------
// Lookup & validation
// ---------------------------------------------------------------------------

export function getAgentMcpToolProfile(agentId: string): AgentMcpToolProfile | undefined {
  return AGENT_MCP_TOOL_PROFILES[agentId]
}

export function sortedToolIds(tools: readonly McpToolId[]): McpToolId[] {
  return [...tools].sort()
}

export function toolsEqual(a: readonly McpToolId[], b: readonly McpToolId[]): boolean {
  const sa = sortedToolIds(a)
  const sb = sortedToolIds(b)
  return sa.length === sb.length && sa.every((t, i) => t === sb[i])
}

/**
 * Validasi satu konfigurasi agen terhadap design.md + keberadaan profil mapping.
 */
export function validateAgentMcpToolBinding(config: AgentHierarchyConfig): string[] {
  const errors: string[] = []
  const profile = getAgentMcpToolProfile(config.agentId)

  if (!profile) {
    errors.push(`No MCP tool profile for agent "${config.agentId}"`)
    return errors
  }

  const canonical = DESIGN_CANONICAL_TOOLS[config.agentId]
  if (canonical && !toolsEqual(config.allowedMcpTools, canonical)) {
    errors.push(
      `Agent "${config.agentId}" allowedMcpTools mismatch: ` +
        `expected [${sortedToolIds(canonical).join(', ')}], ` +
        `got [${sortedToolIds(config.allowedMcpTools).join(', ')}]`,
    )
  }

  for (const toolId of config.allowedMcpTools) {
    if (!(MCP_TOOL_IDS as readonly string[]).includes(toolId)) {
      errors.push(`Agent "${config.agentId}" uses unknown tool "${toolId}"`)
    }
    if (!LOGICAL_TOOL_TO_MCP_SERVERS[toolId as McpToolId]) {
      errors.push(`Agent "${config.agentId}" tool "${toolId}" has no MCP server mapping`)
    }
  }

  return errors
}

export type McpRegistryValidationOptions = {
  /**
   * Jika true, setiap agentId di AGENT_MCP_TOOL_PROFILES harus ada di configs.
   * Gunakan saat bootstrap penuh (registerAllSubAgentDepartments).
   */
  requireFullCoverage?: boolean
}

/**
 * Validasi binding MCP untuk agen yang terdaftar.
 * Dipanggil dari SubAgentRegistry.validateIntegrity (coverage parsial diperbolehkan).
 */
export function validateRegistryMcpToolBindings(
  configs: readonly AgentHierarchyConfig[],
  options: McpRegistryValidationOptions = {},
): string[] {
  const errors: string[] = []
  const registered = new Set(configs.map(c => c.agentId))

  for (const config of configs) {
    errors.push(...validateAgentMcpToolBinding(config))
  }

  if (options.requireFullCoverage) {
    for (const agentId of ALL_MAPPED_AGENT_IDS) {
      if (!registered.has(agentId)) {
        errors.push(`MCP profile exists for "${agentId}" but agent is not registered`)
      }
    }
  }

  return errors
}
