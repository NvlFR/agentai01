import { isRecord } from '../../../shared/index.js'

export type GitHubRepoRef = {
  readonly owner: string
  readonly repo: string
}

export function resolveGitHubRepoRef(input: {
  readonly owner?: string
  readonly repo?: string
  readonly env?: Readonly<Record<string, string | undefined>>
}): GitHubRepoRef | null {
  const owner = input.owner ?? input.env?.['GITHUB_OWNER'] ?? ''
  const repo = input.repo ?? input.env?.['GITHUB_REPO'] ?? ''
  if (!owner.trim() || !repo.trim()) {
    return null
  }

  return { owner: owner.trim(), repo: repo.trim() }
}

export function getGitHubAuthStatus(env: Readonly<Record<string, string | undefined>>): {
  readonly configured: boolean
  readonly defaultRepo?: GitHubRepoRef
} {
  const configured = Boolean(env['GITHUB_TOKEN'])
  const defaultRepo = resolveGitHubRepoRef({ env })
  return defaultRepo ? { configured, defaultRepo } : { configured }
}

export function normalizeGitHubIssueResponse(payload: unknown): {
  readonly issueNumber: number
  readonly htmlUrl: string
} | null {
  if (!isRecord(payload)) {
    return null
  }

  const issueNumber = typeof payload['number'] === 'number' ? payload['number'] : null
  const htmlUrl = typeof payload['html_url'] === 'string' ? payload['html_url'] : null
  if (issueNumber === null || htmlUrl === null) {
    return null
  }

  return { issueNumber, htmlUrl }
}
