/**
 * SubAgentRegistry — Task 1.2
 *
 * Registry terpisah untuk mengelola hierarki sub-agen (4-tier tree).
 * Mendukung pendaftaran, pencarian berdasarkan parent, dan validasi
 * duplikasi ID.
 *
 * Lihat: .kiro/specs/subagent-hierarchy-infrastructure/design.md
 */

import type { AgentHierarchyConfig, HierarchyRoleType, McpToolId } from '../domain/hierarchy.js'
import { validateHierarchyConfig } from '../domain/hierarchy.js'
import { validateRegistryMcpToolBindings } from '../domain/mcpToolsMapping.js'

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class SubAgentRegistryError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'DUPLICATE_ID'
      | 'NOT_FOUND'
      | 'INVALID_CONFIG'
      | 'PARENT_NOT_FOUND'
      | 'CIRCULAR_DEPENDENCY',
  ) {
    super(message)
    this.name = 'SubAgentRegistryError'
  }
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type RegistrationResult =
  | { success: true }
  | { success: false; reason: string }

export type LookupResult =
  | { found: true; config: AgentHierarchyConfig }
  | { found: false }

// ---------------------------------------------------------------------------
// SubAgentRegistry class — Task 1.2
// ---------------------------------------------------------------------------

/**
 * SubAgentRegistry mengelola pohon hierarki agen AI perusahaan.
 *
 * Fitur:
 * - Pendaftaran agen dengan validasi Zod
 * - Pencarian sub-agen berdasarkan parent ID
 * - Pencarian sub-agen berdasarkan departemen
 * - Validasi duplikasi ID
 * - Validasi referential integrity (parent harus terdaftar lebih dulu
 *   atau didaftarkan dalam batch)
 *
 * @example
 * const registry = new SubAgentRegistry()
 * registry.register({
 *   agentId: 'ceo-agent',
 *   roleType: 'ceo',
 *   departmentName: 'executive',
 *   subAgentIds: ['strategy-analyst'],
 *   allowedMcpTools: ['notion', 'slack'],
 * })
 */
export class SubAgentRegistry {
  private readonly _configs: Map<string, AgentHierarchyConfig> = new Map()

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  /**
   * Daftarkan satu agen ke registry.
   * Melempar `SubAgentRegistryError` jika ID duplikat atau config invalid.
   *
   * @param raw - Objek konfigurasi hierarki (divalidasi Zod sebelum disimpan).
   */
  register(raw: unknown): void {
    const result = validateHierarchyConfig(raw)
    if (!result.valid) {
      throw new SubAgentRegistryError(
        `Invalid config: ${result.errors.join('; ')}`,
        'INVALID_CONFIG',
      )
    }

    const config = result.config

    if (this._configs.has(config.agentId)) {
      throw new SubAgentRegistryError(
        `Duplicate agent ID: ${config.agentId}`,
        'DUPLICATE_ID',
      )
    }

    this._configs.set(config.agentId, { ...config, subAgentIds: [...config.subAgentIds] })
  }

  /**
   * Daftarkan beberapa agen sekaligus (batch).
   * Jika salah satu gagal, seluruh batch dibatalkan (all-or-nothing).
   */
  registerBatch(configs: unknown[]): void {
    // Validasi semua dulu sebelum menyimpan
    const validated: AgentHierarchyConfig[] = []
    for (const raw of configs) {
      const result = validateHierarchyConfig(raw)
      if (!result.valid) {
        throw new SubAgentRegistryError(
          `Invalid config in batch: ${result.errors.join('; ')}`,
          'INVALID_CONFIG',
        )
      }
      validated.push(result.config)
    }

    // Cek duplikasi antar item batch
    const batchIds = new Set<string>()
    for (const config of validated) {
      if (batchIds.has(config.agentId)) {
        throw new SubAgentRegistryError(
          `Duplicate agent ID within batch: ${config.agentId}`,
          'DUPLICATE_ID',
        )
      }
      batchIds.add(config.agentId)

      // Cek duplikasi dengan registry yang sudah ada
      if (this._configs.has(config.agentId)) {
        throw new SubAgentRegistryError(
          `Duplicate agent ID: ${config.agentId}`,
          'DUPLICATE_ID',
        )
      }
    }

    // Commit semua
    for (const config of validated) {
      this._configs.set(config.agentId, { ...config, subAgentIds: [...config.subAgentIds] })
    }
  }

  // ---------------------------------------------------------------------------
  // Lookup
  // ---------------------------------------------------------------------------

  /**
   * Ambil konfigurasi agen berdasarkan ID.
   * Returns `{ found: false }` jika tidak terdaftar.
   */
  get(agentId: string): LookupResult {
    const config = this._configs.get(agentId)
    if (!config) return { found: false }
    return { found: true, config: this._clone(config) }
  }

  /**
   * Ambil konfigurasi agen berdasarkan ID, melempar error jika tidak ada.
   */
  getOrThrow(agentId: string): AgentHierarchyConfig {
    const config = this._configs.get(agentId)
    if (!config) {
      throw new SubAgentRegistryError(`Agent not found: ${agentId}`, 'NOT_FOUND')
    }
    return this._clone(config)
  }

  /**
   * Kembalikan semua sub-agen langsung di bawah `parentAgentId`.
   * Hasil diurutkan berdasarkan agentId untuk determinisme.
   */
  getChildrenOf(parentAgentId: string): AgentHierarchyConfig[] {
    const children: AgentHierarchyConfig[] = []
    for (const config of this._configs.values()) {
      if (config.parentAgentId === parentAgentId) {
        children.push(this._clone(config))
      }
    }
    return children.sort((a, b) => a.agentId.localeCompare(b.agentId))
  }

  /**
   * Kembalikan semua agen dalam satu departemen.
   * Hasil diurutkan berdasarkan roleType (head dulu, lalu specialist).
   */
  getByDepartment(departmentName: string): AgentHierarchyConfig[] {
    const results: AgentHierarchyConfig[] = []
    for (const config of this._configs.values()) {
      if (config.departmentName === departmentName) {
        results.push(this._clone(config))
      }
    }
    const roleOrder: Record<HierarchyRoleType, number> = { ceo: 0, head: 1, specialist: 2 }
    return results.sort(
      (a, b) =>
        (roleOrder[a.roleType] ?? 3) - (roleOrder[b.roleType] ?? 3) ||
        a.agentId.localeCompare(b.agentId),
    )
  }

  /**
   * Kembalikan semua agen dengan roleType tertentu.
   */
  getByRole(roleType: HierarchyRoleType): AgentHierarchyConfig[] {
    const results: AgentHierarchyConfig[] = []
    for (const config of this._configs.values()) {
      if (config.roleType === roleType) {
        results.push(this._clone(config))
      }
    }
    return results.sort((a, b) => a.agentId.localeCompare(b.agentId))
  }

  /**
   * Kembalikan semua agen yang memiliki akses ke MCP tool tertentu.
   */
  getByMcpTool(toolId: McpToolId): AgentHierarchyConfig[] {
    const results: AgentHierarchyConfig[] = []
    for (const config of this._configs.values()) {
      if (config.allowedMcpTools.includes(toolId)) {
        results.push(this._clone(config))
      }
    }
    return results.sort((a, b) => a.agentId.localeCompare(b.agentId))
  }

  /**
   * List semua agen yang terdaftar.
   */
  listAll(): AgentHierarchyConfig[] {
    return Array.from(this._configs.values())
      .map(c => this._clone(c))
      .sort((a, b) => a.agentId.localeCompare(b.agentId))
  }

  /**
   * Jumlah agen yang terdaftar.
   */
  get size(): number {
    return this._configs.size
  }

  /**
   * Hapus semua agen dari registry (berguna untuk testing).
   */
  clear(): void {
    this._configs.clear()
  }

  /**
   * Cek apakah agentId sudah terdaftar.
   */
  has(agentId: string): boolean {
    return this._configs.has(agentId)
  }

  // ---------------------------------------------------------------------------
  // Validation helpers
  // ---------------------------------------------------------------------------

  /**
   * Validasi referential integrity seluruh registry:
   * - Setiap parentAgentId harus menunjuk ke agen yang terdaftar
   * - CEO tidak boleh punya parentAgentId
   * - Specialist dan head harus punya parentAgentId
   *
   * @returns Daftar pesan error (kosong = valid)
   */
  validateIntegrity(): string[] {
    const errors: string[] = []

    for (const config of this._configs.values()) {
      // CEO tidak boleh punya parent
      if (config.roleType === 'ceo' && config.parentAgentId !== undefined) {
        errors.push(`CEO agent "${config.agentId}" must not have a parentAgentId`)
      }

      // Non-CEO harus punya parent
      if (config.roleType !== 'ceo' && config.parentAgentId === undefined) {
        errors.push(`Agent "${config.agentId}" (${config.roleType}) must have a parentAgentId`)
      }

      // Parent harus terdaftar
      if (config.parentAgentId !== undefined && !this._configs.has(config.parentAgentId)) {
        errors.push(
          `Agent "${config.agentId}" references unknown parent "${config.parentAgentId}"`,
        )
      }

      // subAgentIds harus terdaftar
      for (const subId of config.subAgentIds) {
        if (!this._configs.has(subId)) {
          errors.push(`Agent "${config.agentId}" references unknown sub-agent "${subId}"`)
        }
      }
    }

    errors.push(...validateRegistryMcpToolBindings(this.listAll()))

    return errors
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _clone(config: AgentHierarchyConfig): AgentHierarchyConfig {
    return {
      ...config,
      subAgentIds: [...config.subAgentIds],
      allowedMcpTools: [...config.allowedMcpTools],
    }
  }
}
