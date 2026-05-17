import { Octokit } from '@octokit/rest'

export type GitHubClient = {
  request: (
    route: 'GET /repos/{owner}/{repo}',
    params: { owner: string; repo: string },
  ) => Promise<{ data: { full_name?: unknown } }>
}

export function createGitHubAdapter(token: string | undefined, client?: GitHubClient): {
  enabled: boolean
  getRepository: (owner: string, repo: string) => Promise<{ full_name: string }>
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
  }
}
