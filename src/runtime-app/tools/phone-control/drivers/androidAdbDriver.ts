import { spawnSync } from 'node:child_process'
import type { PhoneControlDriver } from '../phoneControlTool.js'

export class AndroidAdbDriver implements PhoneControlDriver {
  readonly platform = 'android' as const

  constructor(private readonly deviceId: string) {}

  async tap(x: number, y: number): Promise<void> {
    runAdb(this.deviceId, ['shell', 'input', 'tap', String(x), String(y)])
  }

  async swipe(from: { x: number; y: number }, to: { x: number; y: number }): Promise<void> {
    runAdb(this.deviceId, ['shell', 'input', 'swipe', String(from.x), String(from.y), String(to.x), String(to.y)])
  }

  async typeText(text: string): Promise<void> {
    runAdb(this.deviceId, ['shell', 'input', 'text', text])
  }

  async screenshot(): Promise<string> {
    const result = runAdb(this.deviceId, ['exec-out', 'screencap', '-p'])
    return Buffer.from(result, 'binary').toString('base64')
  }

  async launchApp(appId: string): Promise<void> {
    runAdb(this.deviceId, ['shell', 'monkey', '-p', appId, '-c', 'android.intent.category.LAUNCHER', '1'])
  }
}

function runAdb(deviceId: string, args: string[]): string {
  const result = spawnSync('adb', ['-s', deviceId, ...args], {
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'adb command failed')
  }
  return result.stdout ?? ''
}
