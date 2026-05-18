import { describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  buildProjectMcpConfigPlan,
  getOfficialMcpCatalogCoverage,
  resolveMissingOfficialMcpServers,
  writeProjectMcpConfigPlan,
} from './projectConfig.js'

describe('project MCP config wiring', () => {
  it('builds a config plan from the officially verified server subset', () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), 'agentai01-mcp-cwd-'))
    const vendorRoot = mkdtempSync(path.join(os.tmpdir(), 'agentai01-mcp-vendors-'))

    mkdirSync(path.join(vendorRoot, 'official', 'modelcontextprotocol-servers', 'src', 'filesystem'), {
      recursive: true,
    })
    mkdirSync(path.join(vendorRoot, 'official', 'modelcontextprotocol-servers', 'src', 'memory'), {
      recursive: true,
    })
    mkdirSync(path.join(vendorRoot, 'official', 'modelcontextprotocol-servers', 'src', 'git'), {
      recursive: true,
    })
    mkdirSync(path.join(vendorRoot, 'official', 'modelcontextprotocol-servers', 'src', 'fetch'), {
      recursive: true,
    })
    mkdirSync(path.join(vendorRoot, 'official', 'google-analytics-mcp'), {
      recursive: true,
    })

    const plan = buildProjectMcpConfigPlan({
      cwd,
      vendorRoot,
      generatedAt: '2026-05-18T00:00:00.000Z',
    })

    expect(plan.availableServers.map(entry => entry.serverId)).toEqual([
      'filesystem',
      'memory',
      'git',
      'fetch',
      'google-analytics-mcp',
    ])
    expect(plan.deferredServers).toEqual([])
    expect(Object.keys(plan.mcpConfig.mcpServers).sort()).toEqual([
      'fetch',
      'filesystem',
      'git',
      'google-analytics-mcp',
      'memory',
    ])
    expect(plan.mcpConfig.mcpServers['filesystem']).toEqual({
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', cwd],
    })
    expect(plan.mcpConfig.mcpServers['memory']).toEqual({
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
      env: {
        MEMORY_FILE_PATH: path.join(cwd, 'runtime', 'mcp', 'memory.jsonl'),
      },
    })
  })

  it('reports deferred upstream servers that are still absent from the cloned monorepo', () => {
    const vendorRoot = mkdtempSync(path.join(os.tmpdir(), 'agentai01-mcp-coverage-'))

    mkdirSync(path.join(vendorRoot, 'official', 'modelcontextprotocol-servers', 'src', 'filesystem'), {
      recursive: true,
    })
    mkdirSync(path.join(vendorRoot, 'official', 'modelcontextprotocol-servers', 'src', 'memory'), {
      recursive: true,
    })
    mkdirSync(path.join(vendorRoot, 'official', 'modelcontextprotocol-servers', 'src', 'git'), {
      recursive: true,
    })
    mkdirSync(path.join(vendorRoot, 'official', 'modelcontextprotocol-servers', 'src', 'fetch'), {
      recursive: true,
    })
    mkdirSync(path.join(vendorRoot, 'official', 'google-analytics-mcp'), {
      recursive: true,
    })

    expect(resolveMissingOfficialMcpServers(vendorRoot)).toEqual([
      'brave-search',
      'notion',
      'slack',
      'postgres',
      'github',
      'puppeteer',
      'sqlite',
    ])
    expect(
      getOfficialMcpCatalogCoverage(vendorRoot).filter(entry => entry.status === 'deferred').map(entry => entry.serverId),
    ).toEqual([
      'brave-search',
      'notion',
      'slack',
      'postgres',
      'github',
      'puppeteer',
      'sqlite',
    ])
  })

  it('writes the MCP config and coverage report to disk', () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), 'agentai01-mcp-write-cwd-'))
    const vendorRoot = mkdtempSync(path.join(os.tmpdir(), 'agentai01-mcp-write-vendors-'))

    mkdirSync(path.join(vendorRoot, 'official', 'modelcontextprotocol-servers', 'src', 'filesystem'), {
      recursive: true,
    })
    mkdirSync(path.join(vendorRoot, 'official', 'modelcontextprotocol-servers', 'src', 'memory'), {
      recursive: true,
    })
    mkdirSync(path.join(vendorRoot, 'official', 'modelcontextprotocol-servers', 'src', 'git'), {
      recursive: true,
    })
    mkdirSync(path.join(vendorRoot, 'official', 'modelcontextprotocol-servers', 'src', 'fetch'), {
      recursive: true,
    })
    mkdirSync(path.join(vendorRoot, 'official', 'google-analytics-mcp'), {
      recursive: true,
    })

    const plan = buildProjectMcpConfigPlan({
      cwd,
      vendorRoot,
      configPath: path.join(cwd, '.mcp.json'),
      reportPath: path.join(vendorRoot, 'project-config-report.json'),
      generatedAt: '2026-05-18T00:00:00.000Z',
    })

    writeFileSync(
      plan.configPath,
      `${JSON.stringify({
        mcpServers: {
          existing: {
            type: 'stdio',
            command: 'existing-command',
            args: ['existing-arg'],
          },
        },
      }, null, 2)}\n`,
      'utf8',
    )

    writeProjectMcpConfigPlan(plan)

    const config = JSON.parse(readFileSync(plan.configPath, 'utf8')) as {
      mcpServers: Record<string, unknown>
    }
    const report = JSON.parse(readFileSync(plan.reportPath, 'utf8')) as {
      availableServers: Array<{ serverId: string }>
    }

    expect(Object.keys(config.mcpServers).sort()).toEqual([
      'existing',
      'fetch',
      'filesystem',
      'git',
      'google-analytics-mcp',
      'memory',
    ])
    expect(report.availableServers.map(entry => entry.serverId)).toEqual([
      'filesystem',
      'memory',
      'git',
      'fetch',
      'google-analytics-mcp',
    ])
  })
})
