import {
  cancel,
  confirm,
  intro,
  isCancel,
  multiselect,
  note,
  outro,
  select,
  spinner,
  text,
} from '@clack/prompts'
import chalk from 'chalk'
import { loadRuntimeAppConfig } from './config/index.js'
import { RuntimeAppState } from './state.js'
import {
  AgentCreationService,
  type AgentCreationManifest,
  type AgentCreationDraft,
  type AgentCreationLocation,
  type AgentCreationMethod,
  type AgentCreationStepDefinition,
} from './agent-creation/index.js'
import { SubAgentRegistry } from '../registry/subAgentRegistry.js'
import { registerAllSubAgentDepartments } from '../agents/subagents/index.js'
import {
  renderApprovalsList,
  renderDepartmentSummary,
  renderDraftList,
  renderLiveOperationsPaneTab,
  renderOperatorHistory,
  renderRuntimeAgentDetail,
  renderRuntimeAgentsList,
  renderSnapshotSummary,
  renderSubAgentDetail,
  summarizeDepartments,
  historyEntryFromResult,
  type LivePaneTab,
  type OperatorConsoleHistoryEntry,
} from './tui-helpers.js'

type MainMenuAction =
  | 'dashboard'
  | 'operator-console'
  | 'live-pane'
  | 'agent-management'
  | 'readiness'
  | 'exit'

const MAIN_MENU_OPTIONS: Array<{
  value: MainMenuAction
  label: string
  hint: string
}> = [
  { value: 'dashboard', label: 'Runtime Dashboard', hint: 'Ringkasan runtime, approvals, jobs, dan projects.' },
  { value: 'operator-console', label: 'Chat / Operator Console', hint: 'Kirim directive owner dan lihat response runtime.' },
  { value: 'live-pane', label: 'Live Log / Messages Pane', hint: 'Auto-refresh pane untuk messages, jobs, dan audit.' },
  { value: 'agent-management', label: 'Agent Management', hint: 'Kelola runtime agents, sub-agents, dan draft agents.' },
  { value: 'readiness', label: 'Readiness Checklist', hint: 'Cek alasan ready/not-ready runtime saat ini.' },
  { value: 'exit', label: 'Exit', hint: 'Keluar dari terminal UI.' },
]

export async function runRuntimeTerminalUi(): Promise<number> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    process.stderr.write('Terminal UI membutuhkan sesi TTY interaktif.\n')
    return 1
  }

  const config = loadRuntimeAppConfig()
  const state = new RuntimeAppState(config)
  const agentCreation = new AgentCreationService({ config })
  const registry = new SubAgentRegistry()
  registerAllSubAgentDepartments(registry)
  const operatorHistory: OperatorConsoleHistoryEntry[] = []

  intro(chalk.bold('AgentAI01 Terminal UI'))
  await note(
    [
      'UI terminal ini terinspirasi dari restored-src, tapi diadaptasi ke boundary runtime-app aktif.',
      `Runtime: ${config.runtimeId}`,
      `AI model: ${config.ai.model}`,
    ].join('\n'),
    'Session',
  )

  while (true) {
    const action = await select<MainMenuAction>({
      message: 'Pilih workspace yang mau dibuka',
      options: MAIN_MENU_OPTIONS.map(item => ({
        value: item.value,
        label: item.label,
        hint: item.hint,
      })),
    })

    if (isCancel(action)) {
      cancel('Terminal UI dibatalkan.')
      return 1
    }

    if (action === 'exit') {
      outro('Sampai ketemu lagi di terminal UI AgentAI01.')
      return 0
    }

    if (action === 'dashboard') {
      await note(renderSnapshotSummary(state.getSnapshot()), 'Runtime Dashboard')
      continue
    }

    if (action === 'operator-console') {
      await runOperatorConsole(state, operatorHistory)
      continue
    }

    if (action === 'live-pane') {
      await runLiveOperationsPane(state)
      continue
    }

    if (action === 'readiness') {
      const snapshot = state.getSnapshot()
      await note(
        [
          `Ready: ${snapshot.readiness.ready ? 'yes' : 'no'}`,
          `Reasons: ${snapshot.readiness.reasons.join(', ') || 'none'}`,
          'Checklist:',
          ...snapshot.readiness.checklist.map(item => `- ${item}`),
        ].join('\n'),
        'Readiness',
      )
      continue
    }

    if (action === 'agent-management') {
      await runAgentManagementMenu(state, registry, agentCreation)
    }
  }
}

async function runOperatorConsole(
  state: RuntimeAppState,
  history: OperatorConsoleHistoryEntry[],
): Promise<void> {
  while (true) {
    const action = await select<'send' | 'history' | 'back'>({
      message: 'Operator console',
      options: [
        { value: 'send', label: 'Send Directive', hint: 'Kirim directive baru ke runtime.' },
        { value: 'history', label: 'Session History', hint: `Lihat ${history.length} entri percakapan sesi ini.` },
        { value: 'back', label: 'Back', hint: 'Kembali ke menu utama.' },
      ],
    })
    if (isCancel(action) || action === 'back') {
      return
    }
    if (action === 'history') {
      await note(renderOperatorHistory(history), 'Operator Session History')
      continue
    }

    const message = await text({
      message: 'Masukkan directive owner. Ketik /back untuk kembali.',
      placeholder: 'contoh: status, run tests, stop runtime',
      validate: input => {
        const value = typeof input === 'string' ? input.trim() : ''
        if (value.length === 0) {
          return 'Directive tidak boleh kosong.'
        }
      },
    })
    if (isCancel(message)) {
      return
    }
    const trimmed = message.trim()
    if (trimmed === '/back') {
      continue
    }

    if (isGreeting(trimmed)) {
      await note(
        [
          'Operator console siap dipakai.',
          '',
          'Contoh directive yang langsung berguna:',
          '- status',
          '- current activity',
          '- run tests',
          '- run smoke',
          '- workspace status git',
          '- workspace baca file src/runtime-app/tui.ts',
          '- project create proj-demo for client acme',
        ].join('\n'),
        'Quick Help',
      )
      continue
    }

    const mode = await select<'natural' | 'structured'>({
      message: 'Mode directive',
      options: [
        { value: 'natural', label: 'Natural', hint: 'Bahasa natural seperti operator biasa.' },
        { value: 'structured', label: 'Structured', hint: 'Command yang lebih eksplisit.' },
      ],
      initialValue: 'natural',
    })
    if (isCancel(mode)) {
      return
    }

    let result = state.submitDirective({ input: trimmed, mode, confirm: false })
    if (result.requires_confirmation) {
      const approved = await confirm({
        message: `${result.message}\n\nLanjutkan dengan konfirmasi?`,
        initialValue: false,
      })
      if (isCancel(approved) || !approved) {
        await note('Directive dibatalkan.', 'Operator Console')
        continue
      }
      result = state.submitDirective({ input: trimmed, mode, confirm: true })
    }

    history.push(
      historyEntryFromResult({
        at: new Date().toISOString(),
        input: trimmed,
        mode,
        result,
      }),
    )
    if (history.length > 30) {
      history.splice(0, history.length - 30)
    }

    await note(
      [
        `${result.ok ? 'OK' : 'FAILED'}: ${result.message}`,
        '',
        renderSnapshotSummary(result.snapshot),
      ].join('\n'),
      'Operator Console Result',
    )
  }
}

async function runLiveOperationsPane(state: RuntimeAppState): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    await note('Live pane membutuhkan TTY interaktif.', 'Live Pane')
    return
  }

  let activeTab: LivePaneTab = 'messages'

  const render = () => {
    process.stdout.write('\x1Bc')
    process.stdout.write(`${renderLiveOperationsPaneTab(state.getSnapshot(), activeTab)}\n`)
  }

  render()
  const onData = (chunk: Buffer) => {
    const key = chunk.toString('utf8')
    if (key === '1') {
      activeTab = 'messages'
      render()
      return
    }
    if (key === '2') {
      activeTab = 'jobs'
      render()
      return
    }
    if (key === '3') {
      activeTab = 'audit'
      render()
      return
    }
    if (key === 'r') {
      render()
    }
  }

  const interval = setInterval(render, 2_000)
  const endPromise = new Promise<void>(resolve => {
    const handler = (chunk: Buffer) => {
      const key = chunk.toString('utf8')
      if (key === 'q' || key === '\u0003') {
        process.stdin.off('data', handler)
        process.stdin.off('data', onData)
        resolve()
      }
    }
    process.stdin.on('data', handler)
  })

  process.stdin.setRawMode?.(true)
  process.stdin.resume()
  process.stdin.on('data', onData)
  await endPromise
  clearInterval(interval)
  process.stdin.setRawMode?.(false)
  process.stdout.write('\x1Bc')
  await note('Live pane ditutup.', 'Live Pane')
}

async function runAgentManagementMenu(
  state: RuntimeAppState,
  registry: SubAgentRegistry,
  agentCreation: AgentCreationService,
): Promise<void> {
  while (true) {
    const action = await select<
      'runtime-agents' | 'subagent-registry' | 'draft-agents' | 'create-agent' | 'approvals' | 'back'
    >({
      message: 'Agent management',
      options: [
        { value: 'runtime-agents', label: 'Runtime Agents', hint: 'Inspect worker agents yang aktif di registry.' },
        { value: 'subagent-registry', label: 'Sub-Agent Registry', hint: 'Inspect head dan specialist hierarchy.' },
        { value: 'draft-agents', label: 'Draft Agents', hint: 'Lihat, inspect, dan hapus draft artifacts.' },
        { value: 'create-agent', label: 'Create Agent Wizard', hint: 'Buka restored-style draft wizard.' },
        { value: 'approvals', label: 'Pending Approvals', hint: 'Lihat pending approval dari runtime.' },
        { value: 'back', label: 'Back', hint: 'Kembali ke menu utama.' },
      ],
    })
    if (isCancel(action) || action === 'back') {
      return
    }
    if (action === 'runtime-agents') {
      await runRuntimeAgentsMenu(state)
      continue
    }
    if (action === 'subagent-registry') {
      await runSubAgentRegistryMenu(registry)
      continue
    }
    if (action === 'draft-agents') {
      await runDraftAgentsMenu(agentCreation)
      continue
    }
    if (action === 'create-agent') {
      await runCreateAgentWizard(agentCreation)
      continue
    }
    if (action === 'approvals') {
      await note(renderApprovalsList(state.getSnapshot()), 'Pending Approvals')
    }
  }
}

async function runRuntimeAgentsMenu(state: RuntimeAppState): Promise<void> {
  while (true) {
    const agents = state.shell.app.getRegistry().listAgents()
    const choice = await select<string>({
      message: 'Pilih runtime agent',
      options: [
        {
          value: '__summary__',
          label: 'Show all agents summary',
          hint: `${agents.length} agents`,
        },
        ...agents.map(agent => ({
          value: agent.agent_id,
          label: agent.agent_id,
          hint: `${agent.agent_type} | ${agent.status}`,
        })),
        {
          value: '__back__',
          label: 'Back',
          hint: 'Kembali ke agent management.',
        },
      ],
    })
    if (isCancel(choice) || choice === '__back__') {
      return
    }
    if (choice === '__summary__') {
      await note(renderRuntimeAgentsList(agents), 'Runtime Agents')
      continue
    }
    const agent = agents.find(item => item.agent_id === choice)
    if (agent) {
      await note(renderRuntimeAgentDetail(agent), `Runtime Agent: ${agent.agent_id}`)
    }
  }
}

async function runSubAgentRegistryMenu(registry: SubAgentRegistry): Promise<void> {
  while (true) {
    const summaries = summarizeDepartments(registry)
    const department = await select<string>({
      message: 'Pilih departemen untuk diinspect',
      options: [
        ...summaries.map(item => ({
          value: item.departmentName,
          label: item.departmentName,
          hint: `${item.totalCount} agents`,
        })),
        { value: '__back__', label: 'Back', hint: 'Kembali ke agent management.' },
      ],
    })
    if (isCancel(department) || department === '__back__') {
      return
    }
    const selectedSummary = summaries.find(item => item.departmentName === department)
    if (selectedSummary) {
      await note(renderDepartmentSummary(selectedSummary), `Department: ${department}`)
    }
    const agents = registry.getByDepartment(department)
    const agentId = await select<string>({
      message: 'Pilih agent di departemen ini',
      options: [
        ...agents.map(agent => ({
          value: agent.agentId,
          label: agent.agentId,
          hint: `${agent.roleType} | parent=${agent.parentAgentId ?? '-'}`,
        })),
        { value: '__back__', label: 'Back', hint: 'Pilih departemen lain.' },
      ],
    })
    if (isCancel(agentId) || agentId === '__back__') {
      continue
    }
    const agent = agents.find(item => item.agentId === agentId)
    if (agent) {
      await note(renderSubAgentDetail(agent), `Sub-Agent: ${agent.agentId}`)
    }
  }
}

async function runDraftAgentsMenu(agentCreation: AgentCreationService): Promise<void> {
  while (true) {
    const location = await promptLocation('Pilih lokasi draft agent')
    if (!location) {
      return
    }
    const drafts = await agentCreation.listSavedDrafts(location)
    if (drafts.length === 0) {
      await note(renderDraftList(drafts), `Drafts: ${location}`)
      continue
    }
    const action = await select<string>({
      message: `Draft agents di ${location}`,
      options: [
        { value: '__summary__', label: 'Show list summary', hint: `${drafts.length} draft(s)` },
        ...drafts.map(draft => ({
          value: draft.agentType,
          label: draft.agentType,
          hint: `${draft.method} | ${draft.model ?? 'default model'}`,
        })),
        { value: '__back__', label: 'Back', hint: 'Pilih lokasi lain / kembali.' },
      ],
    })
    if (isCancel(action) || action === '__back__') {
      return
    }
    if (action === '__summary__') {
      await note(renderDraftList(drafts), `Drafts: ${location}`)
      continue
    }
    const draft = drafts.find(item => item.agentType === action)
    if (!draft) {
      continue
    }
    await inspectDraftAgent(agentCreation, location, draft)
  }
}

async function inspectDraftAgent(
  agentCreation: AgentCreationService,
  location: AgentCreationLocation,
  draft: AgentCreationManifest,
): Promise<void> {
  await note(
    [
      `Type: ${draft.agentType}`,
      `Method: ${draft.method}`,
      `Model: ${draft.model ?? 'default'}`,
      `Tools: ${draft.tools?.join(', ') ?? 'all canonical tools'}`,
      `Memory: ${draft.memoryScope ?? 'none'}`,
      `SavedAt: ${draft.savedAt}`,
      `Path: ${draft.markdownPath}`,
      '',
      draft.whenToUse,
    ].join('\n'),
    `Draft Agent: ${draft.agentType}`,
  )

  const action = await select<'view-prompt' | 'delete' | 'back'>({
    message: 'Aksi draft agent',
    options: [
      { value: 'view-prompt', label: 'View full prompt', hint: 'Lihat system prompt lengkap draft ini.' },
      { value: 'delete', label: 'Delete draft', hint: 'Hapus markdown dan manifest draft ini.' },
      { value: 'back', label: 'Back', hint: 'Kembali tanpa perubahan.' },
    ],
  })
  if (isCancel(action) || action === 'back') {
    return
  }
  if (action === 'view-prompt') {
    await note(draft.systemPrompt, `Full Prompt: ${draft.agentType}`)
    return
  }
  const approved = await confirm({
    message: `Hapus draft ${draft.agentType} dari ${location}?`,
    initialValue: false,
  })
  if (isCancel(approved) || !approved) {
    return
  }
  await agentCreation.deleteDraft(location, draft.agentType)
  await note(`Draft ${draft.agentType} dihapus dari ${location}.`, 'Draft Deleted')
}

async function runCreateAgentWizard(agentCreation: AgentCreationService): Promise<void> {
  const steps = agentCreation.buildStepDefinitions(loadRuntimeAppConfig().ai.model)
  const draft: AgentCreationDraft = {}

  const methodStep = steps.find(step => step.id === 'method')
  const locationStep = steps.find(step => step.id === 'location')
  if (!locationStep || !methodStep) {
    await note('Wizard step schema tidak lengkap.', 'Error')
    return
  }

  const location = await promptLocation(locationStep.description)
  if (!location) {
    return
  }
  draft.location = location

  const method = await promptMethod(methodStep)
  if (!method) {
    return
  }
  draft.method = method

  if (method === 'generate') {
    const generationPrompt = await promptTextStep(
      'Generate Brief',
      'Jelaskan agent yang ingin dibuat',
      true,
    )
    if (!generationPrompt) {
      return
    }
    draft.generationPrompt = generationPrompt
    const spin = spinner()
    spin.start('Generating draft agent via provider...')
    try {
      const generated = await agentCreation.generateFields(
        generationPrompt,
        await agentCreation.listExistingAgentIds(),
      )
      spin.stop('Draft awal berhasil digenerate.')
      draft.agentType = generated.identifier
      draft.whenToUse = generated.whenToUse
      draft.systemPrompt = generated.systemPrompt
      await note(
        [
          `Identifier: ${generated.identifier}`,
          `WhenToUse: ${generated.whenToUse}`,
          `Prompt preview: ${generated.systemPrompt.slice(0, 280)}${generated.systemPrompt.length > 280 ? '...' : ''}`,
        ].join('\n\n'),
        'Generated Draft',
      )
    } catch (error) {
      spin.stop('Generation gagal.')
      await note(error instanceof Error ? error.message : 'Unknown generation failure.', 'Generation Error')
      return
    }
  }

  for (const step of steps) {
    if (!shouldHandleStep(step, draft)) {
      continue
    }

    if (step.id === 'type') {
      const result = await promptTextStep(step.title, step.description, true, draft.agentType)
      if (!result) return
      draft.agentType = result
      continue
    }

    if (step.id === 'prompt') {
      const result = await promptTextStep(step.title, step.description, true, draft.systemPrompt)
      if (!result) return
      draft.systemPrompt = result
      continue
    }

    if (step.id === 'description') {
      const result = await promptTextStep(step.title, step.description, true, draft.whenToUse)
      if (!result) return
      draft.whenToUse = result
      continue
    }

    if (step.id === 'tools' && step.options) {
      const result = await multiselect<string>({
        message: step.description,
        options: [
          {
            value: '__ALL_CANONICAL__',
            label: 'Use all canonical tools',
            hint: 'Tidak membatasi tool; agent boleh memakai seluruh MCP tools canonical.',
          },
          ...step.options.map(option => ({
            value: option.value,
            label: option.label,
            hint: option.description,
          })),
        ],
        initialValues:
          draft.selectedTools && draft.selectedTools.length > 0
            ? [...draft.selectedTools]
            : ['__ALL_CANONICAL__'],
        required: false,
      })
      if (isCancel(result)) return
      if (result.includes('__ALL_CANONICAL__') || result.length === 0) {
        draft.selectedTools = undefined
      } else {
        draft.selectedTools = result as AgentCreationDraft['selectedTools']
      }
      continue
    }

    if (step.id === 'model' && step.options) {
      const result = await select<string>({
        message: step.description,
        options: [
          { value: '', label: 'Default runtime model', hint: 'Tidak set override model.' },
          ...step.options.map(option => ({
            value: option.value,
            label: option.label,
            hint: option.description,
          })),
        ],
        initialValue: draft.selectedModel ?? '',
      })
      if (isCancel(result)) return
      draft.selectedModel = result || undefined
      continue
    }

    if (step.id === 'color' && step.options) {
      const result = await select<string>({
        message: step.description,
        options: step.options.map(option => ({
          value: option.value,
          label: option.label,
          hint: option.description,
        })),
        initialValue: draft.selectedColor ?? 'automatic',
      })
      if (isCancel(result)) return
      draft.selectedColor = result as AgentCreationDraft['selectedColor']
      continue
    }

    if (step.id === 'memory' && step.options) {
      const enabled = await confirm({
        message: 'Apakah agent ini perlu memory lintas sesi?',
        initialValue: Boolean(draft.memoryScope),
      })
      if (isCancel(enabled) || !enabled) {
        draft.memoryScope = undefined
        continue
      }
      const result = await select<string>({
        message: step.description,
        options: step.options.map(option => ({
          value: option.value,
          label: option.label,
          hint: option.description,
        })),
        initialValue: draft.memoryScope ?? 'project',
      })
      if (isCancel(result)) return
      draft.memoryScope = result as AgentCreationDraft['memoryScope']
    }
  }

  const validation = await agentCreation.validateDraft(draft)
  if (!validation.isValid || !validation.preview) {
    await note(validation.errors.join('\n') || 'Draft tidak valid.', 'Validation Error')
    return
  }

  await note(
    [
      `Type: ${validation.preview.agentType}`,
      `Location: ${validation.preview.location}`,
      `Method: ${validation.preview.method}`,
      `Tools: ${validation.preview.tools?.join(', ') ?? 'all canonical tools'}`,
      `Model: ${validation.preview.model ?? 'default runtime model'}`,
      `Color: ${validation.preview.color ?? 'automatic'}`,
      `Memory: ${validation.preview.memoryScope ?? 'none'}`,
      `Path: ${validation.preview.relativeArtifactPath}`,
      '',
      `WhenToUse: ${validation.preview.whenToUse}`,
      '',
      `Warnings: ${validation.warnings.join(' | ') || 'none'}`,
    ].join('\n'),
    'Confirm Draft',
  )

  const approved = await confirm({
    message: 'Simpan draft agent ini?',
    initialValue: true,
  })
  if (isCancel(approved) || !approved) {
    await note('Draft tidak disimpan.', 'Cancelled')
    return
  }

  const saved = await agentCreation.saveDraft(draft)
  await note(
    [
      `Agent: ${saved.agentType}`,
      `Location: ${saved.location}`,
      `Method: ${saved.method}`,
      `Markdown: ${saved.markdownPath}`,
      `Manifest: ${saved.manifestPath}`,
    ].join('\n'),
    'Draft Saved',
  )
}

function shouldHandleStep(step: AgentCreationStepDefinition, draft: AgentCreationDraft): boolean {
  if (step.id === 'location' || step.id === 'method' || step.id === 'generate' || step.id === 'confirm') {
    return false
  }
  if (step.visibleWhen?.method && draft.method !== step.visibleWhen.method) {
    return false
  }
  return true
}

async function promptLocation(description: string): Promise<AgentCreationLocation | null> {
  const value = await select<AgentCreationLocation>({
    message: description,
    options: [
      {
        value: 'project',
        label: 'Project',
        hint: 'Simpan di repo ini.',
      },
      {
        value: 'runtime',
        label: 'Runtime',
        hint: 'Simpan di workspace runtime/generated-agents.',
      },
      {
        value: 'user',
        label: 'User',
        hint: 'Simpan di home directory operator.',
      },
    ],
  })

  return isCancel(value) ? null : value
}

async function promptMethod(step: AgentCreationStepDefinition): Promise<AgentCreationMethod | null> {
  const value = await select<AgentCreationMethod>({
    message: step.description,
    options: [
      {
        value: 'generate',
        label: 'Generate with AI',
        hint: 'Provider mengisi draft awal.',
      },
      {
        value: 'manual',
        label: 'Manual',
        hint: 'Isi semua field sendiri.',
      },
    ],
  })

  return isCancel(value) ? null : value
}

async function promptTextStep(
  title: string,
  description: string,
  required: boolean,
  initialValue?: string,
): Promise<string | null> {
  const value = await text({
    message: `${title}: ${description}`,
    initialValue,
    validate: input => {
      const value = typeof input === 'string' ? input : ''
      if (required && value.trim().length === 0) {
        return 'Field ini wajib diisi.'
      }
      return
    },
  })
  if (isCancel(value)) {
    return null
  }
  return value.trim()
}

function isGreeting(input: string): boolean {
  return /^(hi|hai|halo|hello|hey|yo)\b/i.test(input.trim())
}

if (import.meta.main) {
  const exitCode = await runRuntimeTerminalUi()
  process.exit(exitCode)
}
