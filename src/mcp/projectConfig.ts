import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  MCP_SERVER_CATALOG,
  MCP_SERVER_IDS,
  type McpServerId,
} from '../domain/mcpToolsMapping.js'
import type { McpJsonConfig, McpStdioServerConfig } from './services/types.js'
import { getDefaultManagedMcpVendorRoot } from './repositories.js'

export const OFFICIAL_PROJECT_MCP_SERVER_IDS = [
  'filesystem',
  'memory',
  'git',
  'fetch',
  'google-analytics-mcp',
] as const

export type ProjectMcpServerId = (typeof OFFICIAL_PROJECT_MCP_SERVER_IDS)[number]

export type ProjectMcpServerAvailability = {
  readonly serverId: ProjectMcpServerId
  readonly status: 'available' | 'deferred'
  readonly reason: string
  readonly localPath: string
  readonly requiredEnv: readonly string[]
}

export type ProjectMcpConfigPlan = {
  readonly generatedAt: string
  readonly cwd: string
  readonly vendorRoot: string
  readonly configPath: string
  readonly reportPath: string
  readonly availableServers: readonly ProjectMcpServerAvailability[]
  readonly deferredServers: readonly ProjectMcpServerAvailability[]
  readonly mcpConfig: McpJsonConfig
}

export function getDefaultProjectMcpConfigPath(cwd = process.cwd()): string {
  return path.resolve(cwd, '.mcp.json')
}

export function getDefaultProjectMcpReportPath(cwd = process.cwd()): string {
  return path.resolve(getDefaultManagedMcpVendorRoot(cwd), 'project-config-report.json')
}

export function buildProjectMcpConfigPlan(input: {
  readonly cwd?: string
  readonly vendorRoot?: string
  readonly configPath?: string
  readonly reportPath?: string
  readonly generatedAt?: string
} = {}): ProjectMcpConfigPlan {
  const cwd = input.cwd ? path.resolve(input.cwd) : process.cwd()
  const vendorRoot = input.vendorRoot
    ? path.resolve(input.vendorRoot)
    : getDefaultManagedMcpVendorRoot(cwd)
  const configPath = input.configPath
    ? path.resolve(input.configPath)
    : getDefaultProjectMcpConfigPath(cwd)
  const reportPath = input.reportPath
    ? path.resolve(input.reportPath)
    : getDefaultProjectMcpReportPath(cwd)

  const availableServers: ProjectMcpServerAvailability[] = []
  const deferredServers: ProjectMcpServerAvailability[] = []

  for (const serverId of OFFICIAL_PROJECT_MCP_SERVER_IDS) {
    const availability = resolveProjectMcpServerAvailability(serverId, vendorRoot)
    if (availability.status === 'available') {
      availableServers.push(availability)
    } else {
      deferredServers.push(availability)
    }
  }

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    cwd,
    vendorRoot,
    configPath,
    reportPath,
    availableServers,
    deferredServers,
    mcpConfig: {
      mcpServers: Object.fromEntries(
        availableServers.map(entry => [entry.serverId, buildMcpServerConfig(entry.serverId, cwd)]),
      ),
    },
  }
}

export function writeProjectMcpConfigPlan(plan: ProjectMcpConfigPlan): void {
  const existingConfig = readConfigFileIfPresent(plan.configPath)
  const mergedConfig: McpJsonConfig = {
    mcpServers: {
      ...(existingConfig?.mcpServers ?? {}),
      ...plan.mcpConfig.mcpServers,
    },
  }

  mkdirSync(path.dirname(plan.configPath), { recursive: true })
  writeFileSync(plan.configPath, `${JSON.stringify(mergedConfig, null, 2)}\n`, 'utf8')

  mkdirSync(path.dirname(plan.reportPath), { recursive: true })
  writeFileSync(
    plan.reportPath,
    `${JSON.stringify({
      generatedAt: plan.generatedAt,
      cwd: plan.cwd,
      vendorRoot: plan.vendorRoot,
      configPath: plan.configPath,
      availableServers: plan.availableServers,
      deferredServers: plan.deferredServers,
    }, null, 2)}\n`,
    'utf8',
  )
}

export function resolveMissingOfficialMcpServers(vendorRoot: string): McpServerId[] {
  const available = new Set<McpServerId>(resolveAvailableOfficialMcpServers(vendorRoot))
  return [...MCP_SERVER_IDS].filter(serverId => !available.has(serverId))
}

export function resolveAvailableOfficialMcpServers(vendorRoot: string): ProjectMcpServerId[] {
  return OFFICIAL_PROJECT_MCP_SERVER_IDS.filter(
    serverId => resolveProjectMcpServerAvailability(serverId, vendorRoot).status === 'available',
  )
}

function resolveProjectMcpServerAvailability(
  serverId: ProjectMcpServerId,
  vendorRoot: string,
): ProjectMcpServerAvailability {
  const officialRoot = path.join(vendorRoot, 'official')
  const localPath = resolveServerLocalPath(serverId, officialRoot)
  const requiredEnv = getRequiredEnv(serverId)

  if (!existsSync(localPath)) {
    return {
      serverId,
      status: 'deferred',
      reason: `upstream checkout not found at ${localPath}`,
      localPath,
      requiredEnv,
    }
  }

  return {
    serverId,
    status: 'available',
    reason: 'upstream launcher files verified from cloned repository',
    localPath,
    requiredEnv,
  }
}

function resolveServerLocalPath(serverId: ProjectMcpServerId, officialRoot: string): string {
  if (serverId === 'google-analytics-mcp') {
    return path.join(officialRoot, 'google-analytics-mcp')
  }

  return path.join(officialRoot, 'modelcontextprotocol-servers', 'src', serverId)
}

function getRequiredEnv(serverId: ProjectMcpServerId): readonly string[] {
  if (serverId === 'google-analytics-mcp') {
    return ['GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_PROJECT_ID']
  }
  return []
}

function buildMcpServerConfig(serverId: ProjectMcpServerId, cwd: string): McpStdioServerConfig {
  switch (serverId) {
    case 'filesystem':
      return {
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', cwd],
      }
    case 'memory':
      return {
        type: 'stdio',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory'],
        env: {
          MEMORY_FILE_PATH: path.join(cwd, 'runtime', 'mcp', 'memory.jsonl'),
        },
      }
    case 'git':
      return {
        type: 'stdio',
        command: 'uvx',
        args: ['mcp-server-git', '--repository', cwd],
      }
    case 'fetch':
      return {
        type: 'stdio',
        command: 'uvx',
        args: ['mcp-server-fetch'],
      }
    case 'google-analytics-mcp':
      return {
        type: 'stdio',
        command: 'pipx',
        args: ['run', 'analytics-mcp'],
        env: {
          GOOGLE_APPLICATION_CREDENTIALS: '${GOOGLE_APPLICATION_CREDENTIALS}',
          GOOGLE_PROJECT_ID: '${GOOGLE_PROJECT_ID}',
        },
      }
  }
}

type CliOptions = {
  readonly cwd: string
  readonly vendorRoot: string
  readonly configPath: string
  readonly reportPath: string
  readonly planOnly: boolean
}

if (import.meta.main) {
  const options = parseArgs(process.argv.slice(2))
  const plan = buildProjectMcpConfigPlan(options)

  if (options.planOnly) {
    process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`)
    process.exit(0)
  }

  writeProjectMcpConfigPlan(plan)
  process.stdout.write(renderProjectPlanSummary(plan))
}

function parseArgs(args: readonly string[]): CliOptions {
  let cwd = process.cwd()
  let vendorRoot = getDefaultManagedMcpVendorRoot(cwd)
  let configPath = getDefaultProjectMcpConfigPath(cwd)
  let reportPath = getDefaultProjectMcpReportPath(cwd)
  let planOnly = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--cwd') {
      const value = args[index + 1]
      if (!value) {
        throw new Error('--cwd requires a value')
      }
      cwd = path.resolve(value)
      vendorRoot = getDefaultManagedMcpVendorRoot(cwd)
      configPath = getDefaultProjectMcpConfigPath(cwd)
      reportPath = getDefaultProjectMcpReportPath(cwd)
      index += 1
      continue
    }
    if (arg === '--vendor-root') {
      const value = args[index + 1]
      if (!value) {
        throw new Error('--vendor-root requires a value')
      }
      vendorRoot = path.resolve(value)
      reportPath = path.join(vendorRoot, 'project-config-report.json')
      index += 1
      continue
    }
    if (arg === '--config') {
      const value = args[index + 1]
      if (!value) {
        throw new Error('--config requires a value')
      }
      configPath = path.resolve(value)
      index += 1
      continue
    }
    if (arg === '--report') {
      const value = args[index + 1]
      if (!value) {
        throw new Error('--report requires a value')
      }
      reportPath = path.resolve(value)
      index += 1
      continue
    }
    if (arg === '--plan') {
      planOnly = true
      continue
    }
    throw new Error(`Unknown argument: ${arg}`)
  }

  return {
    cwd,
    vendorRoot,
    configPath,
    reportPath,
    planOnly,
  }
}

function renderProjectPlanSummary(plan: ProjectMcpConfigPlan): string {
  const existingConfig = readConfigFileIfPresent(plan.configPath)
  const lines = [
    `Project MCP config: ${plan.configPath}`,
    `Project MCP report: ${plan.reportPath}`,
    `Available official servers: ${plan.availableServers.length}`,
    ...plan.availableServers.map(entry => `  - ${entry.serverId}: ${entry.reason}`),
    `Deferred official servers: ${plan.deferredServers.length}`,
    ...plan.deferredServers.map(entry => `  - ${entry.serverId}: ${entry.reason}`),
  ]

  if (existingConfig) {
    lines.push(`Merged with existing config: preserved ${Object.keys(existingConfig.mcpServers).length} server entries`)
  }

  return `${lines.join('\n')}\n`
}

function readConfigFileIfPresent(configPath: string): McpJsonConfig | null {
  if (!existsSync(configPath)) {
    return null
  }

  try {
    return JSON.parse(readFileSync(configPath, 'utf8')) as McpJsonConfig
  } catch {
    return null
  }
}

export function getOfficialMcpCatalogCoverage(vendorRoot: string): Array<{
  readonly serverId: McpServerId
  readonly status: 'available' | 'deferred'
  readonly localPath: string
}> {
  const officialRoot = path.join(vendorRoot, 'official')

  return [...MCP_SERVER_IDS].map(serverId => {
    const localPath = serverId === 'google-analytics-mcp'
      ? path.join(officialRoot, 'google-analytics-mcp')
      : path.join(
        officialRoot,
        'modelcontextprotocol-servers',
        MCP_SERVER_CATALOG[serverId].upstreamPath ?? '',
      )

    return {
      serverId,
      status: existsSync(localPath) ? 'available' : 'deferred',
      localPath,
    }
  })
}
