import { spawnSync } from 'node:child_process'
import type { PhoneControlDriver } from '../phoneControlTool.js'

export class IosDriver implements PhoneControlDriver {
  readonly platform = 'ios' as const

  constructor(private readonly deviceId: string) {}

  async tap(x: number, y: number): Promise<void> {
    runXcrun(['simctl', 'io', this.deviceId, 'tap', String(x), String(y)])
  }

  async swipe(from: { x: number; y: number }, to: { x: number; y: number }): Promise<void> {
    runXcrun(['simctl', 'io', this.deviceId, 'swipe', String(from.x), String(from.y), String(to.x), String(to.y)])
  }

  async typeText(text: string): Promise<void> {
    runXcrun(['simctl', 'spawn', this.deviceId, 'textinput', text])
  }

  async screenshot(): Promise<string> {
    const output = runXcrun(['simctl', 'io', this.deviceId, 'screenshot', '-'])
    return Buffer.from(output, 'binary').toString('base64')
  }

  async launchApp(appId: string): Promise<void> {
    runXcrun(['simctl', 'launch', this.deviceId, appId])
  }
}

function runXcrun(args: string[]): string {
  const result = spawnSync('xcrun', args, {
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'xcrun command failed')
  }
  return result.stdout ?? ''
}
