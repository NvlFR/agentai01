import { GoogleGenAI } from '@google/genai'

export type GoogleGenAiClient = {
  models: {
    generateContent: (input: {
      model: string
      contents: string
    }) => Promise<{ text?: string }>
  }
}

export function createGoogleGenAiTextAdapter(input: {
  apiKey: string | undefined
  model: string
  client?: GoogleGenAiClient
}): {
  enabled: boolean
  generateText: (prompt: string) => Promise<string>
} {
  const sdk = input.client ?? (input.apiKey ? new GoogleGenAI({ apiKey: input.apiKey }) : undefined)

  return {
    enabled: sdk !== undefined,
    async generateText(prompt) {
      if (!sdk) {
        throw new Error('Google GenAI adapter is not configured')
      }

      const response = await sdk.models.generateContent({
        model: input.model,
        contents: prompt,
      })

      return response.text ?? ''
    },
  }
}
