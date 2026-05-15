export type TelegramSendMessageInput = {
  token: string
  chatId: string
  text: string
  parseMode?: 'Markdown' | 'HTML'
}

export type TelegramSendDocumentInput = {
  token: string
  chatId: string
  filePath: string
  caption?: string
}

export type TelegramUpdate = {
  update_id: number
  message?: {
    message_id: number
    date: number
    text?: string
    chat: {
      id: number
      type: string
    }
    from?: {
      id: number
      is_bot: boolean
      username?: string
      first_name?: string
    }
  }
}

export class TelegramBotClient {
  constructor(private readonly token: string) {}

  async sendMessage(input: Omit<TelegramSendMessageInput, 'token'>): Promise<void> {
    const response = await fetch(this.buildApiUrl('sendMessage'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: input.chatId,
        text: input.text,
        parse_mode: input.parseMode,
        disable_web_page_preview: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Telegram send failed: HTTP ${response.status} ${await response.text()}`)
    }
  }

  async getUpdates(input: {
    offset?: number
    timeoutSeconds?: number
  } = {}): Promise<TelegramUpdate[]> {
    const response = await fetch(this.buildApiUrl('getUpdates'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        offset: input.offset,
        timeout: input.timeoutSeconds ?? 25,
        allowed_updates: ['message'],
      }),
    })

    if (!response.ok) {
      throw new Error(`Telegram getUpdates failed: HTTP ${response.status} ${await response.text()}`)
    }

    const payload = await response.json() as {
      ok: boolean
      result?: TelegramUpdate[]
      description?: string
    }

    if (!payload.ok) {
      throw new Error(`Telegram getUpdates rejected: ${payload.description ?? 'unknown error'}`)
    }

    return payload.result ?? []
  }

  async sendDocument(input: Omit<TelegramSendDocumentInput, 'token'>): Promise<void> {
    const form = new FormData()
    form.set('chat_id', input.chatId)
    if (input.caption) {
      form.set('caption', input.caption)
    }
    form.set('document', Bun.file(input.filePath))

    const response = await fetch(this.buildApiUrl('sendDocument'), {
      method: 'POST',
      body: form,
    })

    if (!response.ok) {
      throw new Error(`Telegram sendDocument failed: HTTP ${response.status} ${await response.text()}`)
    }
  }

  private buildApiUrl(method: string): string {
    return `https://api.telegram.org/bot${this.token}/${method}`
  }
}

export async function sendTelegramMessage(input: TelegramSendMessageInput): Promise<void> {
  const client = new TelegramBotClient(input.token)
  await client.sendMessage({
    chatId: input.chatId,
    text: input.text,
    parseMode: input.parseMode,
  })
}

export async function sendTelegramDocument(input: TelegramSendDocumentInput): Promise<void> {
  const client = new TelegramBotClient(input.token)
  await client.sendDocument({
    chatId: input.chatId,
    filePath: input.filePath,
    caption: input.caption,
  })
}
