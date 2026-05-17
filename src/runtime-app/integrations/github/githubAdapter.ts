import { Octokit } from '@octokit/rest'

export type GitHubClient = {
  request: (
    route: 'GET /repos/{owner}/{repo}' | 'POST /repos/{owner}/{repo}/issues',
    params:
      | { owner: string; repo: string }
      | {
          owner: string
          repo: string
          title: string
          body?: string
          labels?: string[]
        },
  ) => Promise<{ data: { full_name?: unknown; html_url?: unknown; number?: unknown } }>
}

export function createGitHubAdapter(token: string | undefined, client?: GitHubClient): {
  enabled: boolean
  getRepository: (owner: string, repo: string) => Promise<{ full_name: string }>
  createIssue: (
    owner: string,
    repo: string,
    input: { title: string; body?: string; labels?: string[] },
  ) => Promise<{ issueNumber: number; htmlUrl: string; title: string }>
} {
  const sdk = client ?? (token ? new Octokit({ auth: token }) : undefined)

  return {
    enabled: sdk !== undefined,
    async getRepository(owner, repo) {
      if (!sdk) {
        throw new Error('GitHub integration is not configured')
      }

      const response = await sdk.request('GET /repos/{owner}/{repo}', { owner, repo })
      return {
        full_name: String((response.data as { full_name?: unknown }).full_name ?? `${owner}/${repo}`),
      }
    },
    async createIssue(owner, repo, input) {
      if (!sdk) {
        throw new Error('GitHub integration is not configured')
      }

      const response = await sdk.request('POST /repos/{owner}/{repo}/issues', {
        owner,
        repo,
        title: input.title,
        body: input.body,
        labels: input.labels,
      })

      return {
        issueNumber: readNumber(response.data, 'number', 0),
        htmlUrl: readString(response.data, 'html_url'),
        title: input.title,
      }
    },
  }
}

function readString(record: unknown, key: string, fallback = ''): string {
  if (record !== null && typeof record === 'object') {
    const value = (record as Record<string, unknown>)[key]
    if (typeof value === 'string') {
      return value
    }
  }
  return fallback
}

function readNumber(record: unknown, key: string, fallback: number): number {
  if (record !== null && typeof record === 'object') {
    const value = (record as Record<string, unknown>)[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
  }
  return fallback
}
