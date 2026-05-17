import { Command } from 'commander'
import chalk from 'chalk'
import { confirm, isCancel } from '@clack/prompts'
import { updateSettings } from '@clack/core'
import { PassThrough } from 'node:stream'

export type OperatorCliTextWriter = {
  write: (chunk: string) => void
}

export type OperatorCliPromptRunner = (message: string, initialValue?: boolean) => Promise<boolean>

export type OperatorCliDeps = {
  stdout?: OperatorCliTextWriter
  stderr?: OperatorCliTextWriter
  interactive?: boolean
  env?: Record<string, string | undefined>
  promptConfirm?: OperatorCliPromptRunner
  runtimeStatus?: () => Promise<Record<string, unknown>> | Record<string, unknown>
  stopRuntime?: () => Promise<void> | void
}

export type OperatorCliResult = {
  exitCode: number
  stdout: string
  stderr: string
}

export async function runOperatorCli(
  argv: readonly string[],
  deps: OperatorCliDeps = {},
): Promise<OperatorCliResult> {
  const stdoutBuffer = new PassThrough()
  const stderrBuffer = new PassThrough()
  let stdout = ''
  let stderr = ''
  stdoutBuffer.on('data', chunk => {
    stdout += String(chunk)
    deps.stdout?.write(String(chunk))
  })
  stderrBuffer.on('data', chunk => {
    stderr += String(chunk)
    deps.stderr?.write(String(chunk))
  })

  const program = buildOperatorCliProgram(deps, stdoutBuffer, stderrBuffer)

  try {
    await program.parseAsync(argv, { from: 'user' })
    return { exitCode: 0, stdout, stderr }
  } catch (error) {
    if (error instanceof Error && 'exitCode' in error && typeof error.exitCode === 'number') {
      return { exitCode: error.exitCode, stdout, stderr }
    }

    throw error
  } finally {
    stdoutBuffer.end()
    stderrBuffer.end()
  }
}

export function buildOperatorCliProgram(
  deps: OperatorCliDeps,
  stdout: NodeJS.WritableStream,
  stderr: NodeJS.WritableStream,
): Command {
  const env = deps.env ?? process.env
  const interactive = deps.interactive ?? (process.stdout.isTTY && process.stdin.isTTY)
  const promptConfirm = deps.promptConfirm ?? createClackPromptRunner(interactive)

  const program = new Command()
    .name('agentai01')
    .description('Operator CLI for the local runtime')
    .configureOutput({
      writeOut: chunk => {
        stdout.write(chunk)
      },
      writeErr: chunk => {
        stderr.write(chunk)
      },
    })
    .exitOverride()

  program
    .command('doctor')
    .description('Inspect local operator runtime prerequisites')
    .option('--json', 'Print machine-readable output')
    .action((options: { json?: boolean }) => {
      const report = {
        runtime_app_ready: hasValue(env['AI_API_KEY']),
        telegram_configured: hasValue(env['TOKEN_TELE']),
        tavily_configured: hasValue(env['TAVILY_API_KEY']),
        operator_token_configured: hasValue(env['OPERATOR_TOKEN']),
        interactive,
      }

      if (options.json) {
        stdout.write(`${JSON.stringify(report, null, 2)}\n`)
        return
      }

      stdout.write(renderDoctorReport(report))
    })

  const runtime = program.command('runtime').description('Inspect or control the runtime')

  runtime
    .command('status')
    .description('Print runtime status payload')
    .option('--json', 'Print machine-readable output')
    .action(async (options: { json?: boolean }) => {
      const report = await Promise.resolve(
        deps.runtimeStatus?.() ?? {
          env: env['APP_ENV'] ?? env['NODE_ENV'] ?? 'development',
          ai_configured: hasValue(env['AI_API_KEY']),
          host: env['APP_HOST'] ?? '127.0.0.1',
          port: env['APP_PORT'] ?? '3000',
        },
      )

      if (options.json) {
        stdout.write(`${JSON.stringify(report, null, 2)}\n`)
        return
      }

      stdout.write(renderStatusReport(report))
    })

  runtime
    .command('stop')
    .description('Stop the runtime after confirmation')
    .option('--yes', 'Skip interactive confirmation')
    .action(async (options: { yes?: boolean }) => {
      const confirmed = options.yes === true
        ? true
        : interactive
          ? await promptConfirm('Stop the local runtime?', false)
          : false

      if (!confirmed) {
        throw program.error(
          interactive
            ? 'Runtime stop was cancelled.'
            : 'Refusing to stop runtime in non-interactive mode without --yes.',
          { exitCode: 1, code: 'operator.stop.cancelled' },
        )
      }

      await Promise.resolve(deps.stopRuntime?.())
      stdout.write(`${chalk.green('Runtime stop confirmed.')}\n`)
    })

  program
    .command('integrations')
    .description('Inspect integration readiness')
    .option('--json', 'Print machine-readable output')
    .action((options: { json?: boolean }) => {
      const report = buildIntegrationReport(env)
      if (options.json) {
        stdout.write(`${JSON.stringify(report, null, 2)}\n`)
        return
      }

      stdout.write(renderIntegrationReport(report))
    })

  return program
}

export function createClackPromptRunner(interactive: boolean): OperatorCliPromptRunner {
  return async (message, initialValue = false) => {
    if (!interactive) {
      return false
    }

    updateSettings({
      withGuide: true,
    })

    const result = await confirm({
      message,
      initialValue,
      active: 'Yes',
      inactive: 'No',
    })

    return !isCancel(result) && result === true
  }
}

export function renderDoctorReport(report: Record<string, boolean>): string {
  return [
    chalk.bold('Operator doctor'),
    renderLine('AI provider', report['runtime_app_ready'] === true),
    renderLine('Telegram bot', report['telegram_configured'] === true),
    renderLine('Tavily search', report['tavily_configured'] === true),
    renderLine('Operator token', report['operator_token_configured'] === true),
    renderLine('Interactive terminal', report['interactive'] === true),
  ].join('\n') + '\n'
}

export function renderStatusReport(report: Record<string, unknown>): string {
  return [
    chalk.bold('Runtime status'),
    ...Object.entries(report).map(([key, value]) => `${chalk.cyan(key)}: ${String(value)}`),
  ].join('\n') + '\n'
}

export function buildIntegrationReport(
  env: Record<string, string | undefined>,
): Array<{ id: string; configured: boolean }> {
  return [
    { id: 'ai', configured: hasValue(env['AI_API_KEY']) },
    { id: 'telegram', configured: hasValue(env['TOKEN_TELE']) },
    { id: 'tavily', configured: hasValue(env['TAVILY_API_KEY']) },
    { id: 'github', configured: hasValue(env['GITHUB_TOKEN']) },
    { id: 'slack', configured: hasValue(env['SLACK_BOT_TOKEN']) },
  ]
}

export function renderIntegrationReport(
  report: ReadonlyArray<{ id: string; configured: boolean }>,
): string {
  return [
    chalk.bold('Integrations'),
    ...report.map(item => renderLine(item.id, item.configured)),
  ].join('\n') + '\n'
}

function renderLine(label: string, healthy: boolean): string {
  const state = healthy ? chalk.green('ready') : chalk.yellow('missing')
  return `${chalk.cyan(label)}: ${state}`
}

function hasValue(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}
