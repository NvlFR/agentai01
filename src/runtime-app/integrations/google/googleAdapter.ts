import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

type GoogleApisModule = {
  google: {
    drive: (input: { version: 'v3'; auth: string }) => {
      about: GoogleDriveClient
    }
  }
}

export type GoogleDriveClient = {
  get: (input: { fields: string }) => Promise<{ data: Record<string, unknown> }>
}

export function createGoogleDriveAdapter(auth: string | undefined, client?: GoogleDriveClient): {
  enabled: boolean
  getAbout: () => Promise<Record<string, unknown>>
} {
  const googleApisModule = require('googleapis') as GoogleApisModule
  const drive = client ?? (auth ? googleApisModule.google.drive({ version: 'v3', auth }).about : undefined)

  return {
    enabled: drive !== undefined,
    async getAbout() {
      if (!drive) {
        throw new Error('Google integration is not configured')
      }

      const response = await drive.get({
        fields: 'user,storageQuota',
      })
      return response.data as Record<string, unknown>
    },
  }
}
