import { describe, expect, it } from 'bun:test'

import {
  buildManagedMcpInstallPlan,
  buildManagedMcpWorkspaceManifest,
  getDefaultManagedMcpVendorRoot,
  MANAGED_MCP_REPOSITORY_CATALOG,
  MANAGED_MCP_REPOSITORY_IDS,
  resolveManagedMcpRepositoryIdsForAgent,
  resolveManagedMcpRepositoryIdsForServers,
} from './repositories.js'

describe('managed MCP repository catalog', () => {
  it('keeps a descriptor for every declared managed repository id', () => {
    expect(Object.keys(MANAGED_MCP_REPOSITORY_CATALOG).sort()).toEqual(
      [...MANAGED_MCP_REPOSITORY_IDS].sort(),
    )
  })

  it('maps official MCP servers into the shared monorepo plus analytics repo', () => {
    expect(
      resolveManagedMcpRepositoryIdsForServers(['github', 'filesystem', 'google-analytics-mcp']),
    ).toEqual(['google-analytics-mcp', 'modelcontextprotocol-servers'])
  })

  it('collects official and external repositories for an agent profile', () => {
    expect(resolveManagedMcpRepositoryIdsForAgent('marketing-trend-watcher')).toEqual([
      'agentic-seo-skill',
      'modelcontextprotocol-servers',
      'open-outreach',
    ])
  })

  it('builds a de-duplicated install plan for selected agents', () => {
    const plan = buildManagedMcpInstallPlan({
      agentIds: ['marketing-trend-watcher', 'ceo-agent'],
      vendorRoot: '/tmp/agentai01-mcp',
    })

    expect(plan.map(entry => entry.id)).toEqual([
      'agentic-seo-skill',
      'antigravity-awesome-skills',
      'google-analytics-mcp',
      'modelcontextprotocol-servers',
      'open-outreach',
    ])
    expect(plan.find(entry => entry.id === 'modelcontextprotocol-servers')?.relatedAgentIds).toEqual([
      'ceo-agent',
      'marketing-trend-watcher',
    ])
  })

  it('builds a workspace manifest with local clone targets under the vendor root', () => {
    const manifest = buildManagedMcpWorkspaceManifest({
      agentIds: ['support-escalation-router'],
      vendorRoot: '/tmp/agentai01-mcp',
      generatedAt: '2026-05-18T00:00:00.000Z',
    })

    expect(manifest.generatedAt).toBe('2026-05-18T00:00:00.000Z')
    expect(manifest.vendorRoot).toBe('/tmp/agentai01-mcp')
    expect(manifest.repositories.map(repository => repository.id)).toEqual([
      'modelcontextprotocol-servers',
      'open-outreach',
    ])
    expect(
      manifest.repositories.every(repository => repository.localPath.startsWith('/tmp/agentai01-mcp/')),
    ).toBe(true)
  })

  it('uses the repo workspace as the default vendor root', () => {
    expect(getDefaultManagedMcpVendorRoot('/workspace/project')).toBe(
      '/workspace/project/workspaces/mcp-vendors',
    )
  })
})
