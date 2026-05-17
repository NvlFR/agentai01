import { redactSensitiveValue } from '../../secrets/index.js'
import type {
  ExtensionContract,
  ExtensionSnapshot,
  ExtensionValidationIssue,
} from './types.js'

const BUILTIN_EXTENSIONS: ExtensionContract[] = [
  createExtension({
    id: 'skills',
    kind: 'skill_registry',
    description: 'Reusable skill manifests and local skill execution.',
    requiredEnv: [],
    optionalEnv: ['SKILLS_ROOT'],
  }),
  createExtension({
    id: 'telegram',
    kind: 'channel_bridge',
    description: 'Telegram bot bridge for bidirectional agent messaging and operator alerts.',
    requiredEnv: ['TOKEN_TELE'],
    optionalEnv: ['TELEGRAM_ALLOWED_CHAT_IDS', 'TELEGRAM_AUTOMATION_MODE', 'TELEGRAM_POLLING_INTERVAL_MS'],
  }),
  createExtension({
    id: 'whatsapp',
    kind: 'channel_bridge',
    description: 'WhatsApp Baileys socket bridge for enterprise agent messaging and auto-replies.',
    requiredEnv: ['WHATSAPP_PHONE_ID'],
    optionalEnv: ['WHATSAPP_AUTH_FOLDER', 'WHATSAPP_AUTO_REPLY_ENABLED'],
  }),
  createExtension({
    id: 'elevenlabs',
    kind: 'tts_provider',
    description: 'Premium TTS provider using ElevenLabs voices.',
    requiredEnv: ['ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID'],
    optionalEnv: ['ELEVENLABS_TTS_TIMEOUT_MS', 'ELEVENLABS_TTS_RETRY_LIMIT'],
  }),
  createExtension({
    id: 'azure-speech',
    kind: 'tts_provider',
    description: 'Premium TTS provider backed by Azure Speech.',
    requiredEnv: ['AZURE_SPEECH_KEY', 'AZURE_SPEECH_REGION'],
    optionalEnv: ['AZURE_SPEECH_TTS_TIMEOUT_MS', 'AZURE_SPEECH_TTS_RETRY_LIMIT'],
  }),
  createExtension({
    id: 'microsoft-tts',
    kind: 'tts_provider',
    description: 'Microsoft Cognitive Services TTS provider adapter.',
    requiredEnv: ['MICROSOFT_TTS_KEY'],
    optionalEnv: ['MICROSOFT_TTS_TIMEOUT_MS', 'MICROSOFT_TTS_RETRY_LIMIT'],
  }),
  createExtension({
    id: 'fal',
    kind: 'image_provider',
    description: 'Advanced image generation via Fal.',
    requiredEnv: ['FAL_API_KEY'],
    optionalEnv: ['FAL_IMAGE_TIMEOUT_MS'],
  }),
  createExtension({
    id: 'comfy',
    kind: 'image_provider',
    description: 'Advanced image generation via local ComfyUI.',
    requiredEnv: ['COMFY_BASE_URL'],
    optionalEnv: ['COMFY_IMAGE_TIMEOUT_MS'],
  }),
  createExtension({
    id: 'runway',
    kind: 'video_provider',
    description: 'Advanced video generation via Runway.',
    requiredEnv: ['RUNWAY_API_KEY'],
    optionalEnv: ['RUNWAY_VIDEO_TIMEOUT_MS'],
  }),
  createExtension({
    id: 'vydra',
    kind: 'video_provider',
    description: 'Advanced video generation via Vydra.',
    requiredEnv: ['VYDRA_API_KEY'],
    optionalEnv: ['VYDRA_VIDEO_TIMEOUT_MS'],
  }),
  createExtension({
    id: 'perplexity',
    kind: 'search_tool',
    description: 'AI-synthesized and raw search tool via Perplexity.',
    requiredEnv: ['PERPLEXITY_API_KEY'],
    optionalEnv: ['PERPLEXITY_BASE_URL', 'PERPLEXITY_SEARCH_TIMEOUT_MS'],
  }),
  createExtension({
    id: 'firecrawl',
    kind: 'search_tool',
    description: 'Recursive crawler-backed search tool via Firecrawl.',
    requiredEnv: ['FIRECRAWL_API_KEY'],
    optionalEnv: ['FIRECRAWL_BASE_URL', 'FIRECRAWL_MAX_DEPTH', 'FIRECRAWL_SEARCH_TIMEOUT_MS'],
  }),
  createExtension({
    id: 'searxng',
    kind: 'search_tool',
    description: 'Self-hosted search fallback via SearXNG.',
    requiredEnv: ['SEARXNG_BASE_URL'],
    optionalEnv: ['SEARXNG_SEARCH_TIMEOUT_MS'],
  }),
  createFlaggedExtension({
    id: 'openshell',
    kind: 'operator_tool',
    description: 'Sandboxed shell tool with audit guardrails.',
    enabledBy: ['OPENSHELL_ENABLED'],
    requiredEnv: ['OPENSHELL_ALLOWED_DIRS'],
    optionalEnv: ['OPENSHELL_COMMAND_TIMEOUT_MS', 'OPENSHELL_NETWORK_ALLOWLIST'],
    riskProfile: 'high',
  }),
  createFlaggedExtension({
    id: 'phone-control',
    kind: 'operator_tool',
    description: 'Mobile device automation for Android and iOS.',
    enabledBy: ['PHONE_CONTROL_ENABLED'],
    requiredEnv: ['PHONE_CONTROL_DEVICE_ID'],
    optionalEnv: ['PHONE_CONTROL_PLATFORM'],
    riskProfile: 'high',
  }),
  createExtension({
    id: 'qa-lab',
    kind: 'qa_tool',
    description: 'Complex QA lab environment orchestration.',
    requiredEnv: [],
    optionalEnv: ['QA_LAB_ROOT'],
  }),
  createExtension({
    id: 'qa-matrix',
    kind: 'qa_tool',
    description: 'Scenario execution matrix across providers and models.',
    requiredEnv: [],
    optionalEnv: ['QA_MATRIX_CONFIG'],
  }),
  createExtension({
    id: 'skill-workshop',
    kind: 'authoring_tool',
    description: 'Interactive authoring workflow for skills.',
    requiredEnv: [],
    optionalEnv: ['SKILLS_ROOT'],
  }),
  createExtension({
    id: 'open-prose',
    kind: 'authoring_tool',
    description: 'Long-form prose generation and rewriting using active provider.',
    requiredEnv: [],
    optionalEnv: ['OPEN_PROSE_DEFAULT_TONE', 'OPEN_PROSE_DEFAULT_FORMAT'],
  }),
]

export class LowPriorityExtensionRegistry {
  constructor(
    private readonly contracts: ExtensionContract[] = BUILTIN_EXTENSIONS,
    private readonly env: Record<string, string | undefined> = process.env,
  ) {}

  list(): ExtensionSnapshot[] {
    return this.contracts.map(contract => toSnapshot(contract, this.env))
  }

  get(id: string): ExtensionSnapshot | null {
    const contract = this.contracts.find(item => item.id === id)
    return contract ? toSnapshot(contract, this.env) : null
  }

  listEnabled(): ExtensionSnapshot[] {
    return this.list().filter(extension => extension.enabled)
  }
}

export function createLowPriorityExtensionRegistry(input: {
  env?: Record<string, string | undefined>
  contracts?: ExtensionContract[]
} = {}): LowPriorityExtensionRegistry {
  return new LowPriorityExtensionRegistry(input.contracts, input.env)
}

function toSnapshot(
  contract: ExtensionContract,
  env: Record<string, string | undefined>,
): ExtensionSnapshot {
  const issues = contract.validate(env)
  const enabled = isEnabled(contract, env)
  const status = enabled
    ? issues.length > 0 ? 'misconfigured' : 'enabled'
    : 'disabled'

  return {
    id: contract.id,
    kind: contract.kind,
    description: contract.description,
    defaultEnabled: contract.defaultEnabled,
    enabled,
    status,
    riskProfile: contract.riskProfile,
    requiredEnv: [...contract.requiredEnv],
    optionalEnv: [...(contract.optionalEnv ?? [])],
    issues,
    config: redactSensitiveValue(contract.sanitizeConfig(env)) as Record<string, unknown>,
  }
}

function createExtension(input: {
  id: string
  kind: ExtensionContract['kind']
  description: string
  requiredEnv: string[]
  optionalEnv?: string[]
  riskProfile?: ExtensionContract['riskProfile']
  enabledBy?: string[]
}): ExtensionContract {
  return {
    id: input.id,
    kind: input.kind,
    description: input.description,
    defaultEnabled: input.enabledBy ? false : true,
    riskProfile: input.riskProfile ?? 'medium',
    requiredEnv: input.requiredEnv,
    optionalEnv: input.optionalEnv ?? [],
    enabledBy: input.enabledBy ?? [],
    validate(env) {
      if (!isEnabled(this, env)) {
        return []
      }
      return collectMissingEnv(this.requiredEnv, env)
    },
    sanitizeConfig(env) {
      return collectConfigKeys(this, env)
    },
  }
}

function createFlaggedExtension(input: {
  id: string
  kind: ExtensionContract['kind']
  description: string
  enabledBy: string[]
  requiredEnv: string[]
  optionalEnv?: string[]
  riskProfile?: ExtensionContract['riskProfile']
}): ExtensionContract {
  return createExtension({
    ...input,
    riskProfile: input.riskProfile ?? 'high',
  })
}

function collectMissingEnv(
  keys: string[],
  env: Record<string, string | undefined>,
): ExtensionValidationIssue[] {
  return keys.flatMap(key => {
    const value = env[key]?.trim()
    return value
      ? []
      : [{ field: key, message: `${key} is required when the extension is enabled.` }]
  })
}

function collectConfigKeys(
  contract: ExtensionContract,
  env: Record<string, string | undefined>,
): Record<string, unknown> {
  const keys = [...contract.requiredEnv, ...(contract.optionalEnv ?? []), ...(contract.enabledBy ?? [])]
  return Object.fromEntries(
    keys
      .filter(key => env[key] !== undefined)
      .map(key => [key, env[key] ?? null]),
  )
}

function isEnabled(
  contract: ExtensionContract,
  env: Record<string, string | undefined>,
): boolean {
  if (!contract.enabledBy || contract.enabledBy.length === 0) {
    return contract.requiredEnv.length === 0
      ? true
      : contract.requiredEnv.some(key => Boolean(env[key]?.trim()))
  }

  return contract.enabledBy.some(flag => readBoolean(env[flag]) === true)
}

function readBoolean(value: string | undefined): boolean | null {
  if (!value) {
    return null
  }

  const normalized = value.trim().toLowerCase()
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false
  }
  return null
}
