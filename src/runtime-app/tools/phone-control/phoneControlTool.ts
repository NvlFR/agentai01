export type PhonePlatform = 'android' | 'ios'
export type PhoneAction =
  | { type: 'tap'; x: number; y: number }
  | { type: 'swipe'; from: { x: number; y: number }; to: { x: number; y: number } }
  | { type: 'type_text'; text: string }
  | { type: 'screenshot' }
  | { type: 'launch_app'; appId: string }

export type PhoneControlAuditEntry = {
  toolId: 'phone-control'
  action: PhoneAction['type']
  deviceId: string
  timestamp: string
}

export type PhoneControlResult = {
  ok: boolean
  output?: string
  screenshot?: {
    encoding: 'base64'
    data: string
  }
  audit: PhoneControlAuditEntry
}

export type PhoneControlDriver = {
  platform: PhonePlatform
  tap(x: number, y: number): Promise<void>
  swipe(from: { x: number; y: number }, to: { x: number; y: number }): Promise<void>
  typeText(text: string): Promise<void>
  screenshot(): Promise<string>
  launchApp(appId: string): Promise<void>
}

export class PhoneControlError extends Error {
  readonly code: 'disabled' | 'device_unavailable' | 'invalid_action'

  constructor(code: PhoneControlError['code'], message: string) {
    super(message)
    this.name = 'PhoneControlError'
    this.code = code
  }
}

export class PhoneControlTool {
  readonly id = 'phone-control' as const

  constructor(
    private readonly input: {
      deviceId?: string
      enabled?: boolean
      driverFactory: (deviceId: string) => Promise<PhoneControlDriver>
      now?: () => string
    },
  ) {}

  isEnabled(): boolean {
    return this.input.enabled ?? process.env['PHONE_CONTROL_ENABLED'] === 'true'
  }

  async execute(action: PhoneAction): Promise<PhoneControlResult> {
    if (!this.isEnabled()) {
      throw new PhoneControlError('disabled', 'Phone Control is disabled. Set PHONE_CONTROL_ENABLED=true to enable it.')
    }

    const deviceId = this.input.deviceId ?? process.env['PHONE_CONTROL_DEVICE_ID'] ?? ''
    if (!deviceId) {
      throw new PhoneControlError('device_unavailable', 'Phone Control target device is not configured.')
    }

    const driver = await this.input.driverFactory(deviceId)
    const audit: PhoneControlAuditEntry = {
      toolId: this.id,
      action: action.type,
      deviceId,
      timestamp: this.input.now?.() ?? new Date().toISOString(),
    }

    switch (action.type) {
      case 'tap':
        await driver.tap(action.x, action.y)
        return { ok: true, output: 'tap completed', audit }
      case 'swipe':
        await driver.swipe(action.from, action.to)
        return { ok: true, output: 'swipe completed', audit }
      case 'type_text':
        await driver.typeText(action.text)
        return { ok: true, output: 'text entered', audit }
      case 'launch_app':
        await driver.launchApp(action.appId)
        return { ok: true, output: 'app launched', audit }
      case 'screenshot': {
        const data = await driver.screenshot()
        if (!data) {
          throw new PhoneControlError('invalid_action', 'Screenshot action returned empty data.')
        }
        return {
          ok: true,
          screenshot: {
            encoding: 'base64',
            data,
          },
          audit,
        }
      }
    }
  }
}
