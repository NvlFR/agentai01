/**
 * Hierarchy Domain Types — Sub-Agent Hierarchy Infrastructure
 *
 * Mendefinisikan antarmuka `AgentHierarchyConfig` dan skema Zod
 * `AgentHierarchyConfigSchema` untuk validasi struktur hierarki 4 tingkat:
 *   Owner (Human) → CEO Agent → Department Head → Sub-Agent Specialist
 *
 * Lihat: .kiro/specs/subagent-hierarchy-infrastructure/design.md
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// MCP Tools Master List (dari requirements.md § 4)
// ---------------------------------------------------------------------------

export const MCP_TOOL_IDS = [
  'anthropic_api',
  'notion',
  'google_sheets',
  'google_drive',
  'gmail',
  'slack',
  'google_calendar',
  'github',
  'web_search',
  'bash_tool',
  'figma_mcp',
  'canva_mcp',
  'whatsapp_api',
] as const

export type McpToolId = (typeof MCP_TOOL_IDS)[number]

// ---------------------------------------------------------------------------
// Role Types
// ---------------------------------------------------------------------------

/**
 * Peran agen di dalam hierarki perusahaan.
 * - `ceo`        : Agen CEO — menerima arahan Owner, orkestrasi lintas departemen
 * - `head`       : Department Head — orkestrasi internal departemen
 * - `specialist` : Sub-agent spesialis — eksekutor teknis dengan tools terfokus
 */
export type HierarchyRoleType = 'ceo' | 'head' | 'specialist'

// ---------------------------------------------------------------------------
// AgentHierarchyConfig — antarmuka utama (Task 1.1)
// ---------------------------------------------------------------------------

/**
 * Konfigurasi hierarki untuk satu entitas agen.
 *
 * Setiap agen yang terdaftar di `SubAgentRegistry` harus memiliki
 * konfigurasi hierarki ini agar relasi pohon (tree) dapat divalidasi
 * secara deterministik.
 *
 * @example
 * const ceoConfig: AgentHierarchyConfig = {
 *   agentId: 'ceo-agent',
 *   roleType: 'ceo',
 *   departmentName: 'executive',
 *   subAgentIds: ['strategy-analyst', 'report-summarizer'],
 *   allowedMcpTools: ['notion', 'slack', 'google_sheets'],
 * }
 */
export interface AgentHierarchyConfig {
  /** ID unik agen ini — harus cocok dengan AgentRegistryEntry.agent_id. */
  agentId: string
  /** Peran dalam hierarki: CEO, Department Head, atau Specialist. */
  roleType: HierarchyRoleType
  /** ID agen induk. Null hanya untuk CEO Agent. */
  parentAgentId?: string
  /** Daftar ID sub-agen langsung di bawah agen ini. */
  subAgentIds: string[]
  /** Nama departemen tempat agen ini bernaung. */
  departmentName: string
  /** MCP tools yang diizinkan untuk agen ini. */
  allowedMcpTools: McpToolId[]
  /**
   * Deskripsi singkat peran dan tanggung jawab agen.
   * Digunakan sebagai system-prompt seed saat agen diinisialisasi.
   */
  roleDescription?: string
}

// ---------------------------------------------------------------------------
// Zod Schema (Task 1.1 — validasi ketat di external boundary)
// ---------------------------------------------------------------------------

export const McpToolIdSchema = z.enum(MCP_TOOL_IDS)

export const HierarchyRoleTypeSchema = z.enum(['ceo', 'head', 'specialist'])

/**
 * Zod schema untuk memvalidasi `AgentHierarchyConfig`.
 * Digunakan di boundary eksternal (config loading, API input).
 */
export const AgentHierarchyConfigSchema: z.ZodType<AgentHierarchyConfig> = z.object({
  agentId: z.string().min(1, 'agentId must not be empty'),
  roleType: HierarchyRoleTypeSchema,
  parentAgentId: z.string().min(1).optional(),
  subAgentIds: z.array(z.string().min(1)),
  departmentName: z.string().min(1, 'departmentName must not be empty'),
  allowedMcpTools: z.array(McpToolIdSchema),
  roleDescription: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export type HierarchyConfigValidationResult =
  | { valid: true; config: AgentHierarchyConfig }
  | { valid: false; errors: string[] }

/**
 * Validasi sebuah objek sebagai `AgentHierarchyConfig` menggunakan Zod.
 * Mengembalikan config yang tervalidasi atau daftar error.
 */
export function validateHierarchyConfig(raw: unknown): HierarchyConfigValidationResult {
  const result = AgentHierarchyConfigSchema.safeParse(raw)
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map(
        issue => `${issue.path.map(String).join('.')}: ${issue.message}`,
      ),
    }
  }
  return { valid: true, config: result.data }
}

/**
 * Buat `AgentHierarchyConfig` untuk sub-agent spesialis dengan defaults
 * yang sudah diisi (subAgentIds kosong, parentAgentId wajib).
 */
export function makeSpecialistConfig(args: {
  agentId: string
  parentAgentId: string
  departmentName: string
  allowedMcpTools: McpToolId[]
  roleDescription?: string
}): AgentHierarchyConfig {
  return {
    agentId: args.agentId,
    roleType: 'specialist',
    parentAgentId: args.parentAgentId,
    subAgentIds: [],
    departmentName: args.departmentName,
    allowedMcpTools: args.allowedMcpTools,
    roleDescription: args.roleDescription,
  }
}
