import { mkdir, open, readdir, readFile, stat, unlink } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import { MCP_TOOL_IDS, type McpToolId } from '../../domain/hierarchy.js'
import { SubAgentRegistry } from '../../registry/subAgentRegistry.js'
import { registerAllSubAgentDepartments } from '../../agents/subagents/index.js'
import type { RuntimeAppConfig } from '../config/index.js'
import {
  createOpenAICompatibleProvider,
  type OpenAICompatibleProvider,
  type ProviderTextGenerationRequest,
  type ProviderResponse,
} from '../providers/openaiCompatibleProvider.js'
import type {
  AgentCreationDraft,
  AgentCreationGeneratedFields,
  AgentCreationLocation,
  AgentCreationManifest,
  AgentCreationMethod,
  AgentCreationPreview,
  AgentCreationStepDefinition,
  AgentCreationValidationResult,
  AgentCreationColor,
  AgentMemoryScope,
  SavedAgentDraftArtifact,
} from './types.js'

const DEFAULT_MODEL_OPTIONS = ['gpt-4.1-mini', 'gpt-4.1', 'gemini-3-flash'] as const

const LOCATION_DIRECTORY_NAMES: Record<AgentCreationLocation, string> = {
  project: path.join('workspaces', 'generated-agents', 'project'),
  runtime: path.join('workspaces', 'generated-agents', 'runtime'),
  user: '.agentai01/agents',
}

const STEP_TITLES: Record<string, string> = {
  location: 'Location',
  method: 'Method',
  generate: 'Generate',
  type: 'Type',
  prompt: 'Prompt',
  description: 'Description',
  tools: 'Tools',
  model: 'Model',
  color: 'Color',
  memory: 'Memory',
  confirm: 'Confirm',
}

export type AgentCreationServiceOptions = {
  cwd?: string
  now?: () => string
  provider?: {
    generateText(request: ProviderTextGenerationRequest): Promise<ProviderResponse | { content: string }>
  }
  config?: RuntimeAppConfig
  memoryEnabled?: boolean
}

export class AgentCreationService {
  private readonly cwd: string
  private readonly now: () => string
  private readonly provider?: AgentCreationServiceOptions['provider']
  private readonly memoryEnabled: boolean

  constructor(options: AgentCreationServiceOptions = {}) {
    this.cwd = options.cwd ?? process.cwd()
    this.now = options.now ?? (() => new Date().toISOString())
    this.provider =
      options.provider ??
      (options.config?.ai.apiKey
        ? createOpenAICompatibleProvider({
            baseURL: options.config.ai.baseUrl,
            apiKey: options.config.ai.apiKey,
            model: options.config.ai.model,
            timeoutMs: options.config.ai.timeoutMs,
            retryLimit: options.config.ai.retryLimit,
          })
        : undefined)
    this.memoryEnabled = options.memoryEnabled ?? true
  }

  buildStepDefinitions(modelHint?: string): AgentCreationStepDefinition[] {
    const toolOptions = MCP_TOOL_IDS.map(toolId => ({
      value: toolId,
      label: toolId,
      description: describeTool(toolId),
    }))
    const modelOptions = this.listModelOptions(modelHint).map(model => ({
      value: model,
      label: model,
      description: model === modelHint ? 'Model aktif runtime saat ini.' : 'Preset model yang tersedia.',
    }))

    const definitions: AgentCreationStepDefinition[] = [
      {
        id: 'location',
        title: STEP_TITLES['location'],
        description: 'Tentukan artefak agent draft akan disimpan di scope project, runtime, atau user.',
        kind: 'choice',
        required: true,
        options: [
          {
            value: 'project',
            label: 'Project',
            description: 'Disimpan di repo ini agar bisa direview bersama tim.',
          },
          {
            value: 'runtime',
            label: 'Runtime',
            description: 'Disimpan ke workspace runtime/artifacts untuk eksperimen operasional.',
          },
          {
            value: 'user',
            label: 'User',
            description: 'Disimpan di home directory operator untuk draft personal.',
          },
        ],
      },
      {
        id: 'method',
        title: STEP_TITLES['method'],
        description: 'Pilih apakah agent diisi manual atau digenerate AI dulu.',
        kind: 'choice',
        required: true,
        options: [
          {
            value: 'generate',
            label: 'Generate',
            description: 'Provider AI mengisi identifier, whenToUse, dan system prompt awal.',
          },
          {
            value: 'manual',
            label: 'Manual',
            description: 'Semua field diisi sendiri.',
          },
        ],
      },
      {
        id: 'generate',
        title: STEP_TITLES['generate'],
        description: 'Masukkan brief agent agar provider membangun draft awal.',
        kind: 'multiline',
        required: true,
        visibleWhen: { method: 'generate' },
      },
      {
        id: 'type',
        title: STEP_TITLES['type'],
        description: 'Identifier unik agent. Gunakan lowercase, angka, dan hyphen.',
        kind: 'text',
        required: true,
      },
      {
        id: 'prompt',
        title: STEP_TITLES['prompt'],
        description: 'System prompt final agent.',
        kind: 'multiline',
        required: true,
      },
      {
        id: 'description',
        title: STEP_TITLES['description'],
        description: 'Jelaskan kapan agent dipakai dan contoh trigger-nya.',
        kind: 'multiline',
        required: true,
      },
      {
        id: 'tools',
        title: STEP_TITLES['tools'],
        description: 'Pilih MCP tools yang boleh dipakai agent. Kosong berarti all tools.',
        kind: 'multiselect',
        required: false,
        options: toolOptions,
      },
      {
        id: 'model',
        title: STEP_TITLES['model'],
        description: 'Model override opsional untuk agent ini.',
        kind: 'choice',
        required: false,
        options: modelOptions,
      },
      {
        id: 'color',
        title: STEP_TITLES['color'],
        description: 'Warna presentasi untuk identitas visual draft agent.',
        kind: 'choice',
        required: false,
        options: [
          'automatic',
          'red',
          'orange',
          'yellow',
          'green',
          'blue',
          'indigo',
          'pink',
          'gray',
        ].map(color => ({
          value: color,
          label: color,
          description: color === 'automatic' ? 'Biarkan sistem memilih warna default.' : `Gunakan warna ${color}.`,
        })),
      },
    ]

    if (this.memoryEnabled) {
      definitions.push({
        id: 'memory',
        title: STEP_TITLES['memory'],
        description: 'Pilih scope memori untuk agent bila ia perlu belajar lintas sesi.',
        kind: 'choice',
        required: false,
        visibleWhen: { memoryEnabled: true },
        options: [
          {
            value: 'project',
            label: 'Project',
            description: 'Memori fokus ke repo dan konteks kerja project ini.',
          },
          {
            value: 'runtime',
            label: 'Runtime',
            description: 'Memori fokus ke operasi runtime aktif.',
          },
          {
            value: 'user',
            label: 'User',
            description: 'Memori mengikuti preferensi operator.',
          },
        ],
      })
    }

    definitions.push({
      id: 'confirm',
      title: STEP_TITLES['confirm'],
      description: 'Konfirmasi preview sebelum artefak disimpan.',
      kind: 'confirm',
      required: true,
    })

    return definitions
  }

  async generateFields(
    prompt: string,
    existingAgentIds?: readonly string[],
  ): Promise<AgentCreationGeneratedFields> {
    if (!this.provider) {
      throw new Error('AI provider belum terkonfigurasi untuk agent generation.')
    }

    const trimmed = prompt.trim()
    if (trimmed.length < 10) {
      throw new Error('Prompt generation harus minimal 10 karakter.')
    }

    const response = await this.provider.generateText({
      messages: [
        { role: 'system', content: buildGenerationSystemPrompt() },
        {
          role: 'user',
          content: [
            `Buat draft agent baru untuk project AI company runtime ini.`,
            `Kebutuhan user: ${trimmed}`,
            existingAgentIds && existingAgentIds.length > 0
              ? `Identifier yang sudah ada dan tidak boleh dipakai: ${existingAgentIds.join(', ')}`
              : 'Belum ada identifier tambahan yang perlu dihindari.',
            `Kembalikan JSON valid dengan field identifier, whenToUse, systemPrompt.`,
          ].join('\n\n'),
        },
      ],
      temperature: 0.2,
      maxTokens: 1400,
      metadata: {
        source: 'agent-creation',
      },
    })

    return parseGeneratedFields(response.content)
  }

  async listExistingAgentIds(): Promise<string[]> {
    const registry = new SubAgentRegistry()
    registerAllSubAgentDepartments(registry)

    const ids = new Set<string>(registry.listAll().map(config => config.agentId))
    for (const location of ['project', 'runtime', 'user'] as const) {
      for (const artifact of await this.listSavedDrafts(location)) {
        ids.add(artifact.agentType)
      }
    }
    return [...ids].sort()
  }

  async validateDraft(draft: AgentCreationDraft): Promise<AgentCreationValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    const location = draft.location
    if (!location) {
      errors.push('Location is required.')
    }

    const method = draft.method
    if (!method) {
      errors.push('Method is required.')
    }

    const agentType = draft.agentType?.trim() ?? ''
    if (!agentType) {
      errors.push('Agent type is required.')
    } else {
      const typeError = validateAgentType(agentType)
      if (typeError) {
        errors.push(typeError)
      }
    }

    const whenToUse = draft.whenToUse?.trim() ?? ''
    if (!whenToUse) {
      errors.push('Description is required.')
    } else if (whenToUse.length < 10) {
      warnings.push('Description sebaiknya lebih deskriptif, minimal 10 karakter.')
    }

    const systemPrompt = draft.systemPrompt?.trim() ?? ''
    if (!systemPrompt) {
      errors.push('System prompt is required.')
    } else if (systemPrompt.length < 20) {
      errors.push('System prompt minimal 20 karakter.')
    } else if (systemPrompt.length > 12_000) {
      warnings.push('System prompt sangat panjang; pertimbangkan diringkas.')
    }

    if (draft.selectedTools) {
      const invalidTools = draft.selectedTools.filter(tool => !MCP_TOOL_IDS.includes(tool))
      if (invalidTools.length > 0) {
        errors.push(`Invalid MCP tools: ${invalidTools.join(', ')}`)
      }
      if (draft.selectedTools.length === 0) {
        warnings.push('Daftar tools kosong akan diperlakukan sebagai all tools.')
      }
    }

    if (draft.method === 'generate' && (draft.generationPrompt?.trim().length ?? 0) < 10) {
      errors.push('Generation prompt is required when method is generate.')
    }

    const duplicateLocations = agentType ? await this.findDuplicateLocations(agentType) : []
    if (duplicateLocations.length > 0) {
      errors.push(`Agent type "${agentType}" sudah ada di ${duplicateLocations.join(', ')}`)
    }

    const preview =
      errors.length === 0 && location && method
        ? this.buildPreview({
            draft: {
              ...draft,
              agentType,
              whenToUse,
              systemPrompt,
            },
            location,
            method,
          })
        : null

    if (preview && draft.selectedTools === undefined) {
      warnings.push('Agent akan menggunakan seluruh MCP tools canonical.')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      preview,
    }
  }

  async saveDraft(draft: AgentCreationDraft): Promise<SavedAgentDraftArtifact> {
    const validation = await this.validateDraft(draft)
    if (!validation.isValid || !validation.preview) {
      throw new Error(validation.errors[0] ?? 'Draft agent tidak valid.')
    }

    const directory = await this.ensureLocationDirectory(validation.preview.location)
    const markdownPath = path.join(directory, `${validation.preview.agentType}.md`)
    const manifestPath = path.join(directory, `${validation.preview.agentType}.json`)
    const savedAt = this.now()
    const markdown = this.formatMarkdown(validation.preview)
    const manifest: AgentCreationManifest = {
      agentType: validation.preview.agentType,
      whenToUse: validation.preview.whenToUse,
      systemPrompt: validation.preview.systemPrompt,
      location: validation.preview.location,
      method: validation.preview.method,
      tools: validation.preview.tools,
      model: validation.preview.model,
      color: validation.preview.color,
      memoryScope: validation.preview.memoryScope,
      savedAt,
      markdownPath,
    }

    await this.writeFile(markdownPath, markdown, true)
    await this.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, true)

    return {
      agentType: validation.preview.agentType,
      location: validation.preview.location,
      method: validation.preview.method,
      markdownPath,
      manifestPath,
    }
  }

  async listSavedDrafts(location: AgentCreationLocation): Promise<AgentCreationManifest[]> {
    const directory = this.resolveLocationDirectory(location)
    try {
      const entries = await readdir(directory, { withFileTypes: true })
      const manifests = await Promise.all(
        entries
          .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
          .map(async entry => {
            const raw = await readFile(path.join(directory, entry.name), 'utf8')
            return JSON.parse(raw) as AgentCreationManifest
          }),
      )
      return manifests.sort((a, b) => a.agentType.localeCompare(b.agentType))
    } catch (error) {
      if (isNotFound(error)) {
        return []
      }
      throw error
    }
  }

  async deleteDraft(location: AgentCreationLocation, agentType: string): Promise<void> {
    const trimmed = agentType.trim()
    if (!trimmed) {
      throw new Error('Agent type is required for delete.')
    }
    const directory = this.resolveLocationDirectory(location)
    await Promise.all([
      unlink(path.join(directory, `${trimmed}.md`)).catch(error => {
        if (!isNotFound(error)) throw error
      }),
      unlink(path.join(directory, `${trimmed}.json`)).catch(error => {
        if (!isNotFound(error)) throw error
      }),
    ])
  }

  private buildPreview(args: {
    draft: AgentCreationDraft & {
      agentType: string
      whenToUse: string
      systemPrompt: string
    }
    location: AgentCreationLocation
    method: AgentCreationMethod
  }): AgentCreationPreview {
    const { draft, location, method } = args
    const relativeArtifactPath = path.join(
      this.relativeLocationDirectory(location),
      `${draft.agentType}.md`,
    )

    return {
      agentType: draft.agentType,
      whenToUse: draft.whenToUse,
      systemPrompt: draft.systemPrompt,
      tools:
        draft.selectedTools && draft.selectedTools.length > 0
          ? [...draft.selectedTools]
          : undefined,
      model: draft.selectedModel?.trim() || undefined,
      color: normalizeColor(draft.selectedColor),
      memoryScope: this.memoryEnabled ? draft.memoryScope : undefined,
      location,
      method,
      relativeArtifactPath,
    }
  }

  private listModelOptions(modelHint?: string): string[] {
    const models = new Set<string>(DEFAULT_MODEL_OPTIONS)
    if (modelHint && modelHint.trim().length > 0) {
      models.add(modelHint.trim())
    }
    return [...models]
  }

  private async findDuplicateLocations(agentType: string): Promise<AgentCreationLocation[]> {
    const locations: AgentCreationLocation[] = []
    for (const location of ['project', 'runtime', 'user'] as const) {
      const filePath = path.join(this.resolveLocationDirectory(location), `${agentType}.md`)
      if (await pathExists(filePath)) {
        locations.push(location)
      }
    }
    return locations
  }

  private resolveLocationDirectory(location: AgentCreationLocation): string {
    if (location === 'user') {
      return path.join(homedir(), LOCATION_DIRECTORY_NAMES[location])
    }
    return path.join(this.cwd, LOCATION_DIRECTORY_NAMES[location])
  }

  private relativeLocationDirectory(location: AgentCreationLocation): string {
    if (location === 'user') {
      return LOCATION_DIRECTORY_NAMES[location]
    }
    return LOCATION_DIRECTORY_NAMES[location]
  }

  private async ensureLocationDirectory(location: AgentCreationLocation): Promise<string> {
    const directory = this.resolveLocationDirectory(location)
    await mkdir(directory, { recursive: true })
    return directory
  }

  private formatMarkdown(preview: AgentCreationPreview): string {
    const lines = [
      '---',
      `name: ${preview.agentType}`,
      `description: "${escapeYaml(preview.whenToUse)}"`,
      preview.tools ? `allowed_mcp_tools: ${preview.tools.join(', ')}` : '',
      preview.model ? `model: ${preview.model}` : '',
      preview.color ? `color: ${preview.color}` : '',
      preview.memoryScope ? `memory: ${preview.memoryScope}` : '',
      `location: ${preview.location}`,
      `method: ${preview.method}`,
      '---',
      '',
      preview.systemPrompt,
      '',
    ]
    return lines.filter(Boolean).join('\n')
  }

  private async writeFile(filePath: string, content: string, failIfExists: boolean): Promise<void> {
    const handle = await open(filePath, failIfExists ? 'wx' : 'w')
    try {
      await handle.writeFile(content, 'utf8')
      await handle.datasync()
    } finally {
      await handle.close()
    }
  }
}

export function validateAgentType(agentType: string): string | null {
  if (!agentType) {
    return 'Agent type is required.'
  }
  if (agentType.length < 3) {
    return 'Agent type minimal 3 karakter.'
  }
  if (agentType.length > 64) {
    return 'Agent type maksimal 64 karakter.'
  }
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(agentType)) {
    return 'Agent type harus lowercase alphanumeric dan boleh memakai hyphen di tengah.'
  }
  return null
}

function buildGenerationSystemPrompt(): string {
  return [
    'You design production-grade agent drafts for an AI company runtime platform.',
    'Return only valid JSON with fields: identifier, whenToUse, systemPrompt.',
    'identifier must be lowercase letters, numbers, and hyphens.',
    'whenToUse must start with "Use this agent when" and include practical trigger examples.',
    'systemPrompt must be specific, operational, and suitable for a specialist AI agent.',
    `Available MCP tools in this platform: ${MCP_TOOL_IDS.join(', ')}.`,
    'Do not wrap the JSON in markdown fences.',
  ].join('\n')
}

function parseGeneratedFields(content: string): AgentCreationGeneratedFields {
  const trimmed = content.trim()
  const candidate = trimmed.startsWith('{') ? trimmed : trimmed.match(/\{[\s\S]*\}/)?.[0]
  if (!candidate) {
    throw new Error('Provider tidak mengembalikan JSON agent draft.')
  }
  const parsed = JSON.parse(candidate) as Partial<AgentCreationGeneratedFields>
  if (
    typeof parsed.identifier !== 'string' ||
    typeof parsed.whenToUse !== 'string' ||
    typeof parsed.systemPrompt !== 'string'
  ) {
    throw new Error('Provider mengembalikan draft agent yang tidak lengkap.')
  }
  return {
    identifier: parsed.identifier.trim(),
    whenToUse: parsed.whenToUse.trim(),
    systemPrompt: parsed.systemPrompt.trim(),
  }
}

function normalizeColor(color?: AgentCreationColor): Exclude<AgentCreationColor, 'automatic'> | undefined {
  if (!color || color === 'automatic') {
    return undefined
  }
  return color
}

function describeTool(toolId: McpToolId): string {
  const descriptions: Record<McpToolId, string> = {
    anthropic_api: 'Provider/API LLM eksternal.',
    notion: 'Knowledge base dan docs.',
    google_sheets: 'Spreadsheet dan reporting.',
    google_drive: 'Dokumen dan file sharing.',
    gmail: 'Email outreach atau follow-up.',
    slack: 'Komunikasi tim dan alert.',
    google_calendar: 'Scheduling dan deadline.',
    github: 'Repository, issue, dan PR.',
    web_search: 'Research berbasis web.',
    bash_tool: 'Akses shell/workspace lokal.',
    figma_mcp: 'Design system dan mockup.',
    canva_mcp: 'Asset marketing visual.',
    whatsapp_api: 'Outbound/inbound WhatsApp.',
  }
  return descriptions[toolId]
}

function escapeYaml(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath)
    return true
  } catch (error) {
    if (isNotFound(error)) {
      return false
    }
    throw error
  }
}

function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'
}
