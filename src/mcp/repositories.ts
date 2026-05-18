import path from 'node:path'
import {
  AGENT_MCP_TOOL_PROFILES,
  MCP_SERVER_CATALOG,
  type McpServerId,
  type ExternalRepositoryRef,
} from '../domain/mcpToolsMapping.js'

export const MANAGED_MCP_REPOSITORY_IDS = [
  'modelcontextprotocol-servers',
  'google-analytics-mcp',
  'antigravity-awesome-skills',
  'open-outreach',
  'agentic-seo-skill',
  'youtube-content-creation-agent',
  'smart-marketing-assistant-crew-ai',
  'facebook-python-business-sdk',
  'instapy',
  'facebook-posts-automation',
  'tiktok-automation',
  'tiktok-uploader',
] as const

export type ManagedMcpRepositoryId = (typeof MANAGED_MCP_REPOSITORY_IDS)[number]

export type ManagedMcpRepositoryKind =
  | 'official-mcp-monorepo'
  | 'official-mcp-server'
  | 'external-skill'
  | 'external-automation'

export type ManagedMcpRepositoryDescriptor = {
  readonly id: ManagedMcpRepositoryId
  readonly kind: ManagedMcpRepositoryKind
  readonly url: string
  readonly checkoutDir: string
  readonly purpose: string
  readonly serverIds: readonly McpServerId[]
  readonly upstreamPaths: readonly string[]
}

export type ManagedMcpRepositoryInstallPlan = ManagedMcpRepositoryDescriptor & {
  readonly localPath: string
  readonly relatedAgentIds: readonly string[]
}

type OfficialRepoDescriptorSeed = Omit<
  ManagedMcpRepositoryDescriptor,
  'upstreamPaths'
> & {
  readonly upstreamPaths?: readonly string[]
}

const MODEL_CONTEXT_PROTOCOL_SERVERS_REPO = 'https://github.com/modelcontextprotocol/servers.git'

const OFFICIAL_REPOSITORY_CATALOG: Record<ManagedMcpRepositoryId, ManagedMcpRepositoryDescriptor> = {
  'modelcontextprotocol-servers': {
    id: 'modelcontextprotocol-servers',
    kind: 'official-mcp-monorepo',
    url: MODEL_CONTEXT_PROTOCOL_SERVERS_REPO,
    checkoutDir: 'official/modelcontextprotocol-servers',
    purpose: 'Monorepo server MCP resmi untuk Brave, Notion, Slack, Postgres, Memory, GitHub, Git, Fetch, Filesystem, Puppeteer, SQLite.',
    serverIds: [
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
    ],
    upstreamPaths: [
      'src/brave-search',
      'src/notion',
      'src/slack',
      'src/postgres',
      'src/memory',
      'src/github',
      'src/git',
      'src/fetch',
      'src/filesystem',
      'src/puppeteer',
      'src/sqlite',
    ],
  },
  'google-analytics-mcp': {
    id: 'google-analytics-mcp',
    kind: 'official-mcp-server',
    url: 'https://github.com/googleanalytics/google-analytics-mcp.git',
    checkoutDir: 'official/google-analytics-mcp',
    purpose: MCP_SERVER_CATALOG['google-analytics-mcp'].description,
    serverIds: ['google-analytics-mcp'],
    upstreamPaths: [],
  },
  'antigravity-awesome-skills': externalDescriptor(
    'antigravity-awesome-skills',
    'external-skill',
    'external/antigravity-awesome-skills',
  ),
  'open-outreach': externalDescriptor(
    'open-outreach',
    'external-automation',
    'external/open-outreach',
  ),
  'agentic-seo-skill': externalDescriptor(
    'agentic-seo-skill',
    'external-skill',
    'external/agentic-seo-skill',
  ),
  'youtube-content-creation-agent': externalDescriptor(
    'youtube-content-creation-agent',
    'external-skill',
    'external/youtube-content-creation-agent',
  ),
  'smart-marketing-assistant-crew-ai': externalDescriptor(
    'smart-marketing-assistant-crew-ai',
    'external-skill',
    'external/smart-marketing-assistant-crew-ai',
  ),
  'facebook-python-business-sdk': externalDescriptor(
    'facebook-python-business-sdk',
    'external-automation',
    'external/facebook-python-business-sdk',
  ),
  instapy: externalDescriptor(
    'instapy',
    'external-automation',
    'external/instapy',
  ),
  'facebook-posts-automation': externalDescriptor(
    'facebook-posts-automation',
    'external-automation',
    'external/facebook-posts-automation',
  ),
  'tiktok-automation': externalDescriptor(
    'tiktok-automation',
    'external-automation',
    'external/tiktok-automation',
  ),
  'tiktok-uploader': externalDescriptor(
    'tiktok-uploader',
    'external-automation',
    'external/tiktok-uploader',
  ),
}

function externalDescriptor(
  id: Exclude<
    ManagedMcpRepositoryId,
    'modelcontextprotocol-servers' | 'google-analytics-mcp'
  >,
  kind: ManagedMcpRepositoryKind,
  checkoutDir: string,
): ManagedMcpRepositoryDescriptor {
  const source = findExternalRepository(id)
  return {
    id,
    kind,
    url: `${source.url}.git`,
    checkoutDir,
    purpose: source.purpose,
    serverIds: [],
    upstreamPaths: [],
  }
}

function findExternalRepository(id: string): ExternalRepositoryRef {
  for (const profile of Object.values(AGENT_MCP_TOOL_PROFILES)) {
    const match = profile.repositories.find(repository => repository.id === id)
    if (match) {
      return match
    }
  }
  throw new Error(`Unknown external repository id: ${id}`)
}

export const MANAGED_MCP_REPOSITORY_CATALOG: Record<
  ManagedMcpRepositoryId,
  ManagedMcpRepositoryDescriptor
> = OFFICIAL_REPOSITORY_CATALOG

export function getDefaultManagedMcpVendorRoot(
  cwd = process.cwd(),
): string {
  return path.resolve(cwd, 'workspaces', 'mcp-vendors')
}

export function resolveManagedMcpRepositoryIdsForServers(
  serverIds: readonly McpServerId[],
): ManagedMcpRepositoryId[] {
  const result = new Set<ManagedMcpRepositoryId>()
  for (const serverId of serverIds) {
    if (serverId === 'google-analytics-mcp') {
      result.add('google-analytics-mcp')
      continue
    }
    result.add('modelcontextprotocol-servers')
  }
  return [...result].sort()
}

export function resolveManagedMcpRepositoryIdsForAgent(
  agentId: string,
): ManagedMcpRepositoryId[] {
  const profile = AGENT_MCP_TOOL_PROFILES[agentId]
  if (!profile) {
    return []
  }

  const result = new Set<ManagedMcpRepositoryId>()
  for (const repositoryId of resolveManagedMcpRepositoryIdsForServers(profile.mcpServers)) {
    result.add(repositoryId)
  }
  for (const repository of profile.repositories) {
    result.add(assertManagedRepositoryId(repository.id))
  }
  return [...result].sort()
}

export function buildManagedMcpInstallPlan(input: {
  readonly agentIds?: readonly string[]
  readonly vendorRoot?: string
} = {}): ManagedMcpRepositoryInstallPlan[] {
  const vendorRoot = input.vendorRoot
    ? path.resolve(input.vendorRoot)
    : getDefaultManagedMcpVendorRoot()

  const selectedAgentIds = input.agentIds && input.agentIds.length > 0
    ? [...input.agentIds]
    : Object.keys(AGENT_MCP_TOOL_PROFILES)

  const repositoryIds = new Set<ManagedMcpRepositoryId>()
  for (const agentId of selectedAgentIds) {
    for (const repositoryId of resolveManagedMcpRepositoryIdsForAgent(agentId)) {
      repositoryIds.add(repositoryId)
    }
  }

  return [...repositoryIds]
    .sort()
    .map(repositoryId => {
      const descriptor = MANAGED_MCP_REPOSITORY_CATALOG[repositoryId]
      const relatedAgentIds = selectedAgentIds
        .filter(agentId =>
          resolveManagedMcpRepositoryIdsForAgent(agentId).includes(repositoryId),
        )
        .sort()
      return {
        ...descriptor,
        localPath: path.join(vendorRoot, descriptor.checkoutDir),
        relatedAgentIds,
      }
    })
}

export function buildManagedMcpWorkspaceManifest(input: {
  readonly agentIds?: readonly string[]
  readonly vendorRoot?: string
  readonly generatedAt?: string
} = {}) {
  const vendorRoot = input.vendorRoot
    ? path.resolve(input.vendorRoot)
    : getDefaultManagedMcpVendorRoot()
  const plan = buildManagedMcpInstallPlan({
    agentIds: input.agentIds,
    vendorRoot,
  })

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    vendorRoot,
    repositories: plan.map(entry => ({
      id: entry.id,
      kind: entry.kind,
      url: entry.url,
      purpose: entry.purpose,
      localPath: entry.localPath,
      checkoutDir: entry.checkoutDir,
      relatedAgentIds: entry.relatedAgentIds,
      serverIds: entry.serverIds,
      upstreamPaths: entry.upstreamPaths,
    })),
  }
}

function assertManagedRepositoryId(value: string): ManagedMcpRepositoryId {
  if ((MANAGED_MCP_REPOSITORY_IDS as readonly string[]).includes(value)) {
    return value as ManagedMcpRepositoryId
  }
  throw new Error(`Repository "${value}" is not declared in MANAGED_MCP_REPOSITORY_CATALOG.`)
}
