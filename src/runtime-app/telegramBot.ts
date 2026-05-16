import { createLogger, type Logger } from '../logging/index.js'
import { getSubprocessEnvironment, loadRuntimeAppConfig } from './config.js'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  createOpenAICompatibleProvider,
  type ProviderMessage,
} from './providers/openaiCompatibleProvider.js'
import { buildOperatorRuntimePrompt } from './prompt/promptPlumbing.js'
import { RuntimeAppState } from './state.js'
import { TelegramBotClient, type TelegramUpdate } from './telegram.js'
import {
  loadTelegramChannelConfig,
  resolveTelegramTurnContext,
  type TelegramChannelConfig,
  type TelegramTurnContext,
} from './telegramChannel.js'

type ChatSession = {
  messages: ProviderMessage[]
}

type AutomationMode = 'manual' | 'semi'

type TelegramCommand =
  | { kind: 'start' | 'help' | 'status' | 'approvals' | 'reset' | 'audit' | 'improve' | 'self_heal' | 'directive_help' }
  | { kind: 'mode'; mode: AutomationMode }
  | { kind: 'directive'; input: string }
  | { kind: 'chat'; input: string }

type BotReply = {
  text: string
  parseMode?: 'Markdown' | 'HTML'
  documentPath?: string
  sourceLabel?: string
}

export async function startTelegramBot(): Promise<void> {
  const appConfig = loadRuntimeAppConfig({
    requireProvider: true,
  })
  const logger = createLogger({
    env: appConfig.env,
    bindings: {
      context: {
        component: 'runtime-telegram',
      },
    },
  })
  const state = new RuntimeAppState(appConfig)
  const token = appConfig.telegramToken

  if (!token) {
    throw new Error('TOKEN_TELE is required to run the Telegram bot.')
  }

  const client = new TelegramBotClient(token)
  const provider = createOpenAICompatibleProvider({
    baseURL: appConfig.ai.baseUrl,
    apiKey: appConfig.ai.apiKey ?? '',
    model: appConfig.ai.model,
    timeoutMs: appConfig.ai.timeoutMs,
    retryLimit: appConfig.ai.retryLimit,
  })
  const allowedChatIds = new Set(appConfig.allowedChatIds)
  const channelConfig = loadTelegramChannelConfig()
  const sessions = new Map<string, ChatSession>()
  const automationState: { mode: AutomationMode } = {
    mode: 'semi',
  }

  let offset = 0

  logger.info('Telegram bot polling started.', {
    allowed_chat_ids: allowedChatIds.size,
    automation_mode: automationState.mode,
  })

  while (true) {
    try {
      const updates = await client.getUpdates({
        offset,
        timeoutSeconds: 25,
      })

      for (const update of updates) {
        offset = Math.max(offset, update.update_id + 1)
        await handleUpdate(update, {
          state,
          client,
          provider,
          allowedChatIds,
          channelConfig,
          sessions,
          automationState,
          logger: logger.child({
            correlation_id: `telegram-update-${update.update_id}`,
          }),
        })
      }
    } catch (error) {
      logger.error('Telegram bot polling error.', {
        error,
      })
      await sleep(2_000)
    }
  }
}

async function handleUpdate(
  update: TelegramUpdate,
  context: {
    state: RuntimeAppState
    client: TelegramBotClient
    provider: ReturnType<typeof createOpenAICompatibleProvider>
    allowedChatIds: Set<string>
    channelConfig: TelegramChannelConfig
    sessions: Map<string, ChatSession>
    automationState: { mode: AutomationMode }
    logger: Logger
  },
): Promise<void> {
  const message = update.message
  if (!message?.text || message.from?.is_bot) {
    return
  }

  const chatId = String(message.chat.id)
  if (context.allowedChatIds.size > 0 && !context.allowedChatIds.has(chatId)) {
    return
  }

  const turnContext = resolveTelegramTurnContext({
    update,
    config: context.channelConfig,
  })
  if (!turnContext || !turnContext.allowed) {
    return
  }

  const command = parseTelegramCommand(message.text)
  context.logger.debug('Telegram update accepted.', {
    chat_id: chatId,
    session_key: turnContext.sessionKey,
    agent_id: turnContext.agentId,
    thread_id: turnContext.threadId,
    command_kind: command.kind,
  })
  const progressReply = buildProgressReply(command, context.state)
  if (progressReply) {
    await context.client.sendMessage({
      chatId,
      text: progressReply.text,
      parseMode: progressReply.parseMode,
    })
  }

  const startedAt = Date.now()
  const replies = await executeTelegramCommand(turnContext, command, context)
  const decoratedReplies = decorateProcessReplies(command, replies, startedAt)
  for (const reply of decoratedReplies) {
    const sourcedReply = attachReplySource(reply)
    for (const chunk of splitTelegramMessage(sourcedReply.text)) {
      await context.client.sendMessage({
        chatId,
        text: chunk,
        parseMode: sourcedReply.parseMode,
      })
    }
    if (sourcedReply.documentPath) {
      await context.client.sendDocument({
        chatId,
        filePath: sourcedReply.documentPath,
        caption: 'Detail lengkap ada di lampiran.',
      })
    }
  }
}

export function parseTelegramCommand(input: string): TelegramCommand {
  const trimmed = input.trim()
  if (!trimmed) {
    return { kind: 'help' }
  }
  if (trimmed === '/start') {
    return { kind: 'start' }
  }
  if (trimmed === '/help') {
    return { kind: 'help' }
  }
  if (trimmed === '/status') {
    return { kind: 'status' }
  }
  if (trimmed === '/approvals') {
    return { kind: 'approvals' }
  }
  if (trimmed === '/audit-system') {
    return { kind: 'audit' }
  }
  if (trimmed === '/improve') {
    return { kind: 'improve' }
  }
  if (trimmed === '/self-heal') {
    return { kind: 'self_heal' }
  }
  if (trimmed === '/reset') {
    return { kind: 'reset' }
  }
  if (trimmed === '/mode semi') {
    return { kind: 'mode', mode: 'semi' }
  }
  if (trimmed === '/mode manual') {
    return { kind: 'mode', mode: 'manual' }
  }
  if (trimmed === '/directive') {
    return { kind: 'directive_help' }
  }
  if (trimmed.startsWith('/directive ')) {
    return { kind: 'directive', input: trimmed.slice('/directive '.length).trim() }
  }
  return { kind: 'chat', input: trimmed }
}

async function executeTelegramCommand(
  turnContext: TelegramTurnContext,
  command: TelegramCommand,
  context: {
    state: RuntimeAppState
    provider: ReturnType<typeof createOpenAICompatibleProvider>
    sessions: Map<string, ChatSession>
    automationState: { mode: AutomationMode }
  },
): Promise<BotReply[]> {
  switch (command.kind) {
    case 'start':
    case 'help':
      return [{ text: buildHelpText(), parseMode: 'HTML', sourceLabel: 'Runtime lokal' }]
    case 'status':
      return [{ text: buildStatusText(context.state.getSnapshot()), parseMode: 'HTML', sourceLabel: 'Runtime lokal' }]
    case 'approvals':
      return [{ text: buildApprovalsText(context.state.getSnapshot()), parseMode: 'HTML', sourceLabel: 'Runtime lokal' }]
    case 'mode':
      context.automationState.mode = command.mode
      return [{
        text: `<b>Mode automation diubah</b>\nSekarang aktif: <code>${escapeHtml(command.mode)}</code>`,
        parseMode: 'HTML',
        sourceLabel: 'Runtime lokal',
      }]
    case 'directive_help':
      return [{
        text: buildDirectiveHelpText(),
        parseMode: 'HTML',
        sourceLabel: 'Runtime lokal',
      }]
    case 'reset':
      context.sessions.delete(turnContext.sessionKey)
      return [{
        text: '<b>Riwayat chat direset.</b>\nSilakan lanjut tanya dari nol.',
        parseMode: 'HTML',
        sourceLabel: 'Runtime lokal',
      }]
    case 'audit': {
      const audit = await runSystemAudit(context.state, context.provider)
      return [{
        text: formatAutomationSummary('Audit System', audit),
        parseMode: 'HTML',
        documentPath: audit.artifactPath,
        sourceLabel: 'Shell lokal + AI provider',
      }]
    }
    case 'improve':
    case 'self_heal': {
      const report = await runSemiAutonomousImprovement(
        context.state,
        context.provider,
        context.automationState.mode,
      )
      return [{
        text: formatAutomationSummary(
          command.kind === 'improve' ? 'Improve System' : 'Self Heal',
          report,
        ),
        parseMode: 'HTML',
        documentPath: report.artifactPath,
        sourceLabel: 'Shell lokal + AI provider',
      }]
    }
    case 'directive': {
      const result = context.state.submitDirective({
        input: command.input,
        mode: 'natural',
      })
      const sourceLabel = inferDirectiveSourceLabel(context.state, command.input)
      if (result.requires_confirmation) {
        return [{
          text: `<b>Directive butuh konfirmasi.</b>\n${escapeHtml(result.message)}`,
          parseMode: 'HTML',
          sourceLabel,
        }]
      }
      if (!result.ok) {
        return [{
          text: formatDirectiveFailure(result.message),
          parseMode: 'HTML',
          documentPath: result.artifactPath,
          sourceLabel,
        }]
      }
      return [{
        text: `<b>Directive dijalankan.</b>\n${escapeHtml(result.message)}`,
        parseMode: 'HTML',
        documentPath: result.artifactPath,
        sourceLabel,
      }]
    }
    case 'chat': {
      const directIntentReply = buildDirectIntentReply(command.input)
      if (directIntentReply) {
        return [directIntentReply]
      }

      const session = context.sessions.get(turnContext.sessionKey) ?? { messages: [] }
      const snapshot = context.state.getSnapshot()
      try {
        const response = await context.provider.generateText({
          messages: [
            {
              role: 'system',
              content: buildTelegramSystemPrompt(snapshot, turnContext),
            },
            ...session.messages,
            {
              role: 'user',
              content: command.input,
            },
          ],
          temperature: 0.2,
          maxTokens: 3200,
        })

        const normalizedReply = normalizeTelegramReply(response.content)

        session.messages = trimConversation([
          ...session.messages,
          { role: 'user', content: command.input },
          { role: 'assistant', content: normalizedReply },
        ])
        context.sessions.set(turnContext.sessionKey, session)

        return [{ text: normalizedReply, sourceLabel: 'AI provider' }]
      } catch (error) {
        return [{
          text: buildProviderUnavailableText(error),
          parseMode: 'HTML',
          sourceLabel: 'Runtime lokal',
        }]
      }
    }
  }
}

function buildHelpText(): string {
  return [
    '<b>Telegram AI Runtime siap dipakai.</b>',
    '',
    '<b>Perintah utama</b>',
    '• <code>/help</code>',
    '• <code>/status</code>',
    '• <code>/approvals</code>',
    '• <code>/audit-system</code>',
    '• <code>/improve</code>',
    '• <code>/self-heal</code>',
    '• <code>/mode semi</code>',
    '• <code>/mode manual</code>',
    '• <code>/directive &lt;instruksi&gt;</code>',
    '• <code>/reset</code>',
    '',
    '<b>Chat langsung</b>',
    'Kirim pesan biasa untuk ngobrol dengan AI provider.',
    'Kalau provider mati atau proxy dimatikan, saya akan bilang terus terang bahwa AI tidak tersedia.',
    '',
    '<b>Contoh directive real</b>',
    '• <code>/directive jalankan check</code>',
    '• <code>/directive jalankan test</code>',
    '• <code>/directive jalankan smoke</code>',
    '• <code>/directive baca file src/runtime-app/state.ts</code>',
    '• <code>/directive cari kode submitDirective</code>',
    '• <code>/directive status git</code>',
    '• <code>/directive analisa kebutuhan agent</code>',
    '• <code>/directive buat 2 agent engineering baru untuk proj-001</code>',
    '',
    '<b>Sumber jawaban</b>',
    'Command seperti /status, /approvals, dan banyak /directive berasal dari runtime lokal atau shell lokal.',
    'Chat biasa hanya berasal dari model jika AI provider benar-benar aktif.',
    '',
    '<b>Catatan mode semi</b>',
    'Hanya menjalankan aksi aman: audit, check/test/smoke, dan self-heal operasional terbatas.',
  ].join('\n')
}

function buildDirectiveHelpText(): string {
  return [
    '<b>Directive butuh instruksi lengkap.</b>',
    'Saya belum menjalankan apa pun dari <code>/directive</code> kosong.',
    '',
    '<b>Contoh yang valid</b>',
    '• <code>/directive analisa kebutuhan agent</code>',
    '• <code>/directive buat agent engineering baru untuk proj-001</code>',
    '• <code>/directive jalankan smoke</code>',
    '• <code>/directive baca file src/runtime-app/state.ts</code>',
    '• <code>/directive apa yang sedang anda jalankan sekarang?</code>',
    '',
    'Kalau aksinya destruktif, saya akan minta konfirmasi dulu.',
  ].join('\n')
}

function buildProgressReply(
  command: TelegramCommand,
  state: RuntimeAppState,
): BotReply | undefined {
  switch (command.kind) {
    case 'directive': {
      const parsed = state.ceoRuntime.parseOwnerCommand(command.input, 'natural')
      if (parsed.kind === 'clarification_required') {
        return {
          text: '<b>Memproses directive</b>\nSaya sedang memetakan intent dan menentukan tindakan yang paling tepat.',
          parseMode: 'HTML',
        }
      }

      const commandType = parsed.command.command_type
      if (commandType === 'runbook') {
        return {
          text: `<b>Menjalankan runbook</b>\nAksi: <code>${escapeHtml(String(parsed.command.parameters['action'] ?? 'unknown'))}</code>`,
          parseMode: 'HTML',
        }
      }
      if (commandType === 'activity') {
        return {
          text: '<b>Mengambil current activity</b>\nSaya sedang merangkum proses yang aktif dan aktivitas terbaru runtime.',
          parseMode: 'HTML',
        }
      }
      if (commandType === 'workspace') {
        return {
          text: buildWorkspaceProgressText(parsed.command.parameters),
          parseMode: 'HTML',
        }
      }
      if (commandType === 'staffing') {
        return {
          text: buildStaffingProgressText(parsed.command.parameters),
          parseMode: 'HTML',
        }
      }
      if (commandType === 'project_admin') {
        return {
          text: '<b>Memproses project admin action</b>\nSaya sedang memvalidasi aksi destruktif terhadap semua proyek aktif.',
          parseMode: 'HTML',
        }
      }
      return {
        text: `<b>Menjalankan directive CEO</b>\nJenis: <code>${escapeHtml(commandType)}</code>`,
        parseMode: 'HTML',
      }
    }
    case 'audit':
      return {
        text: '<b>Audit dimulai</b>\nMenjalankan check, test, smoke, lalu menyusun diagnosis sistem.',
        parseMode: 'HTML',
      }
    case 'improve':
      return {
        text: '<b>Improve dimulai</b>\nMenginspeksi runtime, menjalankan validasi, dan menyusun tindakan perbaikan.',
        parseMode: 'HTML',
      }
    case 'self_heal':
      return {
        text: '<b>Self-heal dimulai</b>\nMemeriksa kesehatan runtime dan mencoba pemulihan operasional yang aman.',
        parseMode: 'HTML',
      }
    default:
      return undefined
  }
}

function decorateProcessReplies(
  command: TelegramCommand,
  replies: BotReply[],
  startedAt: number,
): BotReply[] {
  const label = processLabel(command)
  if (!label) {
    return replies
  }

  const duration = formatDurationMs(Date.now() - startedAt)
  return replies.map((reply, index) => {
    if (index > 0) {
      return reply
    }
    if (reply.parseMode === 'HTML') {
      return {
        ...reply,
        text: `<b>${label} selesai</b> <code>${duration}</code>\n${reply.text}`,
      }
    }
    return {
      ...reply,
      text: `${label} selesai (${duration})\n${reply.text}`,
    }
  })
}

function processLabel(command: TelegramCommand): string | undefined {
  switch (command.kind) {
    case 'directive':
      return 'Directive'
    case 'audit':
      return 'Audit'
    case 'improve':
      return 'Improve'
    case 'self_heal':
      return 'Self-heal'
    default:
      return undefined
  }
}

function buildWorkspaceProgressText(parameters: Record<string, unknown>): string {
  const action = String(parameters['action'] ?? 'unknown')
  const path = typeof parameters['path'] === 'string' ? parameters['path'] : undefined
  const query = typeof parameters['query'] === 'string' ? parameters['query'] : undefined
  return [
    '<b>Menjalankan workspace action</b>',
    `Aksi: <code>${escapeHtml(action)}</code>`,
    path ? `Path: <code>${escapeHtml(path)}</code>` : '',
    query ? `Query: <code>${escapeHtml(query)}</code>` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function buildStaffingProgressText(parameters: Record<string, unknown>): string {
  const action = String(parameters['action'] ?? 'assess')
  const agentType = typeof parameters['agent_type'] === 'string' ? parameters['agent_type'] : undefined
  const count = parameters['count']
  const projectId = typeof parameters['project_id'] === 'string' ? parameters['project_id'] : undefined
  return [
    '<b>Menjalankan staffing action</b>',
    `Aksi: <code>${escapeHtml(action)}</code>`,
    agentType ? `Agent: <code>${escapeHtml(agentType)}</code>` : '',
    count !== undefined ? `Jumlah: <code>${escapeHtml(String(count))}</code>` : '',
    projectId ? `Project: <code>${escapeHtml(projectId)}</code>` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function formatDurationMs(durationMs: number): string {
  if (durationMs < 1_000) {
    return `${durationMs}ms`
  }
  return `${(durationMs / 1_000).toFixed(1)}s`
}

function buildStatusText(snapshot: ReturnType<RuntimeAppState['getSnapshot']>): string {
  return [
    '<b>Status Runtime</b>',
    '',
    `<b>Runtime ID:</b> <code>${escapeHtml(snapshot.runtime.runtime_id)}</code>`,
    `<b>Shell:</b> ${escapeHtml(snapshot.runtime.shell_status)}`,
    `<b>Ready:</b> ${snapshot.readiness.ready ? 'yes' : 'no'}`,
    `<b>Projects:</b> ${snapshot.dashboard.pipeline.total_projects}`,
    `<b>Pending approvals:</b> ${snapshot.dashboard.approvals.pending_count}`,
    `<b>Workers:</b> ${snapshot.runtime.workers.length}`,
    `<b>Issues:</b> ${snapshot.dashboard.operational_issues.length}`,
  ].join('\n')
}

function buildApprovalsText(snapshot: ReturnType<RuntimeAppState['getSnapshot']>): string {
  if (snapshot.approvals.length === 0) {
    return '<b>Approval Queue</b>\n\nTidak ada approval pending.'
  }

  return [
    '<b>Approval Queue</b>',
    '',
    ...snapshot.approvals.map(
      approval =>
        [
          `• <code>${escapeHtml(approval.request_id)}</code>`,
          `Gate: ${escapeHtml(approval.gate)}`,
          `Project: <code>${escapeHtml(approval.project_id ?? '-')}</code>`,
          `Ringkasan: ${escapeHtml(approval.summary)}`,
        ].join('\n'),
    ),
  ].join('\n')
}

function buildTelegramSystemPrompt(
  snapshot: ReturnType<RuntimeAppState['getSnapshot']>,
  turnContext: TelegramTurnContext,
): string {
  return buildOperatorRuntimePrompt({
    snapshot,
    channel: 'telegram',
    additions: [
      {
        id: 'Telegram Channel Context',
        content: [
          `Account ID: ${turnContext.accountId}`,
          `Agent ID: ${turnContext.agentId}`,
          `Chat ID: ${turnContext.chatId}`,
          `Chat type: ${turnContext.chatType}`,
          turnContext.threadId ? `Topic/thread ID: ${turnContext.threadId}` : '',
          turnContext.senderName ? `Sender: ${turnContext.senderName}` : '',
          turnContext.senderId ? `Sender ID: ${turnContext.senderId}` : '',
        ].filter(Boolean).join('\n'),
      },
      turnContext.promptSettings.groupSystemPrompt
        ? {
            id: 'Telegram Group System Prompt',
            content: turnContext.promptSettings.groupSystemPrompt,
          }
        : {
            id: '',
            content: '',
          },
    ],
  })
}

function trimConversation(messages: ProviderMessage[]): ProviderMessage[] {
  return messages.slice(-10)
}

function normalizeTelegramReply(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) {
    return 'Saya tidak menerima isi jawaban dari provider. Coba ulangi pertanyaannya.'
  }

  return cleanupTelegramText(trimmed)
}

type AutomationCommandResult = {
  mode: AutomationMode
  summary: string
  checks: Array<{
    name: string
    ok: boolean
    exitCode: number | null
    excerpt: string
  }>
  actions: string[]
  diagnosis: string
  artifactPath?: string
}

async function runSemiAutonomousImprovement(
  state: RuntimeAppState,
  provider: ReturnType<typeof createOpenAICompatibleProvider>,
  mode: AutomationMode,
): Promise<AutomationCommandResult> {
  const audit = await runSystemAudit(state, provider, mode)
  const actions = [...audit.actions]

  if (mode === 'manual') {
    actions.push('Tidak ada perubahan otomatis dijalankan karena mode masih manual.')
    return {
      ...audit,
      actions,
      summary: 'Audit selesai. Mode manual tidak menjalankan self-heal otomatis.',
    }
  }

  const readiness = state.getSnapshot().readiness
  if (!readiness.ready) {
    actions.push(`Readiness belum siap: ${readiness.reasons.join('; ')}`)
  }

  const failedChecks = audit.checks.filter(check => !check.ok)
  if (failedChecks.length === 0) {
    actions.push('Tidak ada kegagalan check/test/smoke. Tidak ada fix aman yang perlu dijalankan.')
  } else {
    actions.push('Tidak ada auto-edit kode dijalankan. Mode semi saat ini hanya self-heal operasional aman dan diagnosis otomatis.')
  }

  return {
    ...audit,
    actions,
    summary:
      failedChecks.length === 0
        ? 'Sistem sehat. Audit selesai dan tidak ada perbaikan aman yang diperlukan.'
        : `Ditemukan ${failedChecks.length} check gagal. Diagnosis dibuat, tetapi tidak ada patch kode otomatis di mode semi yang aman saat ini.`,
  }
}

async function runSystemAudit(
  state: RuntimeAppState,
  provider: ReturnType<typeof createOpenAICompatibleProvider>,
  mode: AutomationMode = 'semi',
): Promise<AutomationCommandResult> {
  const checks = [
    runSafeCommand('typecheck', ['bun', 'run', 'check']),
    runSafeCommand('tests', ['bun', 'test']),
    runSafeCommand('smoke', ['bun', 'run', 'runtime:smoke']),
  ]

  const results = checks.map(check => ({
    name: check.name,
    ok: check.exitCode === 0,
    exitCode: check.exitCode,
    excerpt: truncateForTelegram(check.output),
  }))

  const snapshot = state.getSnapshot()
  const diagnosisPrompt = [
    'Anda adalah sistem diagnosis semi-autonomous untuk codebase runtime AI.',
    'Buat diagnosis singkat dan aman dalam Bahasa Indonesia.',
    'Jangan mengklaim sudah memperbaiki kode bila belum ada patch.',
    `Mode: ${mode}`,
    `Runtime ready: ${snapshot.readiness.ready}`,
    `Projects: ${snapshot.dashboard.pipeline.total_projects}`,
    `Pending approvals: ${snapshot.dashboard.approvals.pending_count}`,
    'Hasil command:',
    ...results.map(
      result =>
        `## ${result.name}\nstatus=${result.ok ? 'ok' : 'failed'} exit=${result.exitCode}\n${result.excerpt}`,
    ),
  ].join('\n')

  let diagnosis = 'Diagnosis AI tidak tersedia.'
  try {
    const response = await provider.generateText({
      messages: [{ role: 'user', content: diagnosisPrompt }],
      temperature: 0.1,
      maxTokens: 3000,
    })
    diagnosis = normalizeTelegramReply(response.content)
  } catch (error) {
    diagnosis = `Diagnosis AI gagal dibuat: ${String(error)}`
  }

  const artifactPath = await writeAutomationArtifact({
    mode,
    snapshot,
    results,
    diagnosis,
  })

  return {
    mode,
    summary: 'Audit sistem selesai.',
    checks: results,
    actions: [],
    diagnosis,
    artifactPath,
  }
}

function runSafeCommand(
  name: string,
  command: [string, ...string[]],
): { name: string; exitCode: number | null; output: string } {
  const result = spawnSync(command[0], command.slice(1), {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 300_000,
    env: getSubprocessEnvironment(),
  })

  return {
    name,
    exitCode: result.status,
    output: `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim(),
  }
}

async function writeAutomationArtifact(input: {
  mode: AutomationMode
  snapshot: ReturnType<RuntimeAppState['getSnapshot']>
  results: AutomationCommandResult['checks']
  diagnosis: string
}): Promise<string> {
  const dir = path.join(process.cwd(), 'runtime', input.snapshot.environment.env, 'artifacts', 'automation')
  await mkdir(dir, { recursive: true })
  const filePath = path.join(dir, `audit-${Date.now()}.md`)
  const content = [
    `# Semi-Autonomous Audit`,
    ``,
    `- Mode: ${input.mode}`,
    `- Generated at: ${input.snapshot.generated_at}`,
    `- Ready: ${input.snapshot.readiness.ready}`,
    ``,
    `## Checks`,
    ...input.results.map(
      result =>
        `- ${result.name}: ${result.ok ? 'PASS' : `FAIL (${result.exitCode ?? 'unknown'})`}`,
    ),
    ``,
    `## Diagnosis`,
    input.diagnosis,
    ``,
  ].join('\n')
  await writeFile(filePath, content, 'utf8')
  return filePath
}

function formatAutomationSummary(
  title: string,
  report: AutomationCommandResult,
): string {
  const checkLine = report.checks
    .map(check => `${check.name}:${check.ok ? 'PASS' : 'FAIL'}`)
    .join(' | ')
  const actions = report.actions.length > 0
    ? report.actions.slice(0, 3).map(action => `• ${escapeHtml(action)}`).join('\n')
    : '• Tidak ada aksi tambahan.'

  const lines = [
    `<b>${escapeHtml(title)}</b>`,
    '',
    `<b>Mode:</b> <code>${escapeHtml(report.mode)}</code>`,
    `<b>Summary:</b> ${escapeHtml(report.summary)}`,
    `<b>Checks:</b> <code>${escapeHtml(checkLine)}</code>`,
  ]

  lines.push('', '<b>Actions</b>', actions)
  lines.push('', '<b>Diagnosis singkat</b>', escapeHtml(summarizeDiagnosis(report.diagnosis)))

  if (report.artifactPath) {
    lines.push('', 'Detail lengkap dikirim sebagai file lampiran.')
  }

  return lines.join('\n')
}

function formatDirectiveFailure(message: string): string {
  const cleaned = cleanupTelegramText(message)
  if (!/clarification required|ambiguous/i.test(cleaned)) {
    return `<b>Directive gagal.</b>\n${escapeHtml(cleaned)}`
  }

  const detail = cleaned
    .replace(/^Clarification Required\s*/i, '')
    .replace(/^Directive intent is ambiguous\.\s*/i, '')
    .trim()

  return [
    '<b>Directive belum dijalankan.</b>',
    'Instruksinya masih terlalu ambigu.',
    '',
    detail ? escapeHtml(detail) : '',
    '',
    '<b>Coba salah satu format ini</b>',
    '• <code>/directive status perusahaan</code>',
    '• <code>/directive riwayat 10 directive terakhir</code>',
    '• <code>/directive buat laporan harian</code>',
    '• <code>/directive jalankan check</code>',
    '• <code>/directive jalankan smoke</code>',
    '• <code>/directive baca file src/runtime-app/state.ts</code>',
    '• <code>/directive status git</code>',
    '• <code>/directive analisa kebutuhan agent</code>',
    '• <code>/directive buat agent engineering baru untuk proj-001</code>',
  ]
    .filter(Boolean)
    .join('\n')
}

function buildDirectIntentReply(input: string): BotReply | undefined {
  const normalized = input.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  if (looksLikeExecutionIntent(normalized)) {
    return {
      text: [
        '<b>Permintaan ini terlihat seperti aksi operasional.</b>',
        'Saya belum mengeksekusi apa pun dari pesan biasa.',
        '',
        '<b>Gunakan directive eksplisit</b>',
        `• <code>${escapeHtml(suggestDirective(input))}</code>`,
      ].join('\n'),
      parseMode: 'HTML',
      sourceLabel: 'Runtime lokal',
    }
  }

  return undefined
}

function looksLikeExecutionIntent(input: string): boolean {
  return [
    'buat agent',
    'tambah agent',
    'create agent',
    'spawn agent',
    'hapus semua proyek',
    'hapus proyek',
    'delete all projects',
    'jalankan ',
    'run ',
    'deploy ',
    'aktifkan ',
    'nonaktifkan ',
    'suruh agent',
    'perintahkan agent',
    'buatkan ',
  ].some(pattern => input.includes(pattern))
}

function suggestDirective(input: string): string {
  return `/directive ${input.trim()}`
}

function summarizeDiagnosis(text: string): string {
  const compact = cleanupTelegramText(text).replace(/\n{2,}/g, '\n').trim()
  if (compact.length <= 420) {
    return compact
  }
  return `${compact.slice(0, 420).trim()}...`
}

function inferDirectiveSourceLabel(state: RuntimeAppState, input: string): string {
  const parsed = state.ceoRuntime.parseOwnerCommand(input, 'natural')
  if (parsed.kind === 'parsed' && parsed.command.command_type === 'runbook') {
    return 'Shell lokal'
  }
  return 'Runtime lokal'
}

function attachReplySource(reply: BotReply): BotReply {
  if (!reply.sourceLabel) {
    return reply
  }

  if (reply.parseMode === 'HTML') {
    return {
      ...reply,
      text: `<b>Sumber:</b> ${escapeHtml(reply.sourceLabel)}\n${reply.text}`,
    }
  }

  return {
    ...reply,
    text: `Sumber: ${reply.sourceLabel}\n${reply.text}`,
  }
}

function buildProviderUnavailableText(error: unknown): string {
  return [
    '<b>AI provider tidak tersedia.</b>',
    'Pesan biasa seperti ini memang butuh model/provider aktif. Saat ini saya tidak bisa menjawab dari AI.',
    '',
    `<b>Error:</b> <code>${escapeHtml(String(error))}</code>`,
    '',
    '<b>Yang masih bisa dipakai sekarang</b>',
    '• <code>/status</code>',
    '• <code>/approvals</code>',
    '• <code>/directive jalankan check</code>',
    '• <code>/directive status perusahaan</code>',
  ].join('\n')
}

function truncateForTelegram(text: string): string {
  if (!text) {
    return '(no output)'
  }
  return text
}

export function splitTelegramMessage(text: string, maxLength = 3500): string[] {
  if (text.length <= maxLength) {
    return [text]
  }

  const chunks: string[] = []
  let remaining = text
  while (remaining.length > maxLength) {
    const candidate = remaining.slice(0, maxLength)
    const breakAt = Math.max(candidate.lastIndexOf('\n'), candidate.lastIndexOf(' '))
    const index = breakAt > 0 ? breakAt : maxLength
    chunks.push(remaining.slice(0, index).trim())
    remaining = remaining.slice(index).trim()
  }
  if (remaining) {
    chunks.push(remaining)
  }
  return chunks
}

function cleanupTelegramText(text: string): string {
  return text
    .replace(/\r/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*\*\s+/gm, '- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

if (import.meta.main) {
  await startTelegramBot()
}
