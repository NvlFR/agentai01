import { describe, expect, it } from 'bun:test'
import { getGitHubAuthStatus, normalizeGitHubIssueResponse, resolveGitHubRepoRef } from './githubRuntime.js'

describe('githubRuntime', () => {
  it('resolves default repo from env', () => {
    expect(resolveGitHubRepoRef({ env: { GITHUB_OWNER: 'octo', GITHUB_REPO: 'agentai01' } })).toEqual({
      owner: 'octo',
      repo: 'agentai01',
    })
  })

  it('returns auth status with default repo when configured', () => {
    expect(getGitHubAuthStatus({
      GITHUB_TOKEN: 'secret',
      GITHUB_OWNER: 'octo',
      GITHUB_REPO: 'agentai01',
    })).toEqual({
      configured: true,
      defaultRepo: { owner: 'octo', repo: 'agentai01' },
    })
  })

  it('normalizes issue payloads', () => {
    expect(normalizeGitHubIssueResponse({ number: 7, html_url: 'https://github.com/octo/agentai01/issues/7' })).toEqual({
      issueNumber: 7,
      htmlUrl: 'https://github.com/octo/agentai01/issues/7',
    })
  })
})
