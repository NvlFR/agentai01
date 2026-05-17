import { Client } from '@notionhq/client'

export type NotionClient = {
  pages: {
    create: (input: {
      parent: { page_id: string }
      properties: {
        title: {
          title: Array<{ type: 'text'; text: { content: string } }>
        }
      }
    }) => Promise<unknown>
  }
}

export function createNotionAdapter(token: string | undefined, client?: NotionClient): {
  enabled: boolean
  createPage: (parentId: string, title: string) => Promise<void>
} {
  const sdk = client ?? (token ? new Client({ auth: token }) : undefined)

  return {
    enabled: sdk !== undefined,
    async createPage(parentId, title) {
      if (!sdk) {
        throw new Error('Notion integration is not configured')
      }

      await sdk.pages.create({
        parent: { page_id: parentId },
        properties: {
          title: {
            title: [{ type: 'text', text: { content: title } }],
          },
        },
      })
    },
  }
}
