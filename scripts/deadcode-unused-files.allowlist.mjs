export const entryFilePatterns = [
  /^src\/index\.ts$/,
  /^src\/.+\/index\.ts$/,
  /^src\/runtime-app\/(index|worker|scheduler|smoke|telegramBot)\.ts$/,
  /^src\/runtime-app\/config\.ts$/,
  /^src\/runtime-app\/config\/runtimeConfig\.ts$/,
]

export const ignoredFilePatterns = [
  /\.test\.ts$/,
]

export const ignoredExports = {
  'src/index.ts': ['*'],
  'src/runtime-app/capabilities.ts': [
    'RuntimeCapabilityAction',
    'RuntimeCapabilityExecution',
  ],
  'src/runtime-app/integration/agentExecution.ts': [
    'AgentExecutionResult',
    'AgentExecutionContext',
  ],
  'src/runtime-app/integration/bootstrap.ts': [
    'RuntimeAppBootstrapRequest',
  ],
  'src/runtime-app/orchestration/runtimeApp.ts': [
    'RuntimeOperationalAppOptions',
  ],
  'src/runtime-app/providers/openaiCompatible.ts': [
    'ProviderRequest',
    'ProviderResponse',
    'ProviderTelemetry',
  ],
  'src/runtime-app/server.ts': ['RuntimeAppServer'],
  'src/runtime-app/state.ts': [
    'RuntimeJobKind',
    'RuntimeJobStatus',
    'RuntimeJob',
    'OperatorAuditEntry',
    'ProjectDetailSnapshot',
    'DirectiveSubmission',
    'ApprovalResponseSubmission',
    'ActionResult',
  ],
  'src/runtime-app/telegram.ts': [
    'TelegramSendMessageInput',
    'TelegramSendDocumentInput',
    'sendTelegramMessage',
    'sendTelegramDocument',
  ],
}

export const ignoredFiles = [
  'src/runtime-app/queue/backend.ts',
  'src/runtime-app/queue/models.ts',
  'src/runtime-app/queue/repository.ts',
  'src/runtime-app/runtime/runtime.ts',
  'src/runtime-app/runtime/scheduler.ts',
  'src/runtime-app/workers/pool.ts',
]
