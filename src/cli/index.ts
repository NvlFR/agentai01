import { err, ok, type Result } from '../shared/index.js'
import { renderProgressBar } from '../terminal/index.js'

export * from './operatorCli.js'

export type ParsedArgs = {
  command: string[]
  options: Record<string, string | boolean>
  positionals: string[]
  passthrough: string[]
}

export type CommandContext<TDeps = unknown> = {
  args: ParsedArgs
  deps: TDeps
}

export type CommandResult = {
  exitCode: number
  stdout?: string
  stderr?: string
}

export type Command<TDeps = unknown> = {
  name: string
  description: string
  aliases?: readonly string[]
  run: (context: CommandContext<TDeps>) => Promise<CommandResult> | CommandResult
}

export type CommandRegistry<TDeps = unknown> = {
  register: (command: Command<TDeps>) => Result<void, string>
  resolve: (name: string) => Command<TDeps> | undefined
  list: () => Array<Command<TDeps>>
  run: (argv: readonly string[], deps: TDeps) => Promise<CommandResult>
}

export type OutputFormat = 'text' | 'json' | 'ndjson'

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const command: string[] = []
  const positionals: string[] = []
  const passthrough: string[] = []
  const options: Record<string, string | boolean> = {}
  let passthroughMode = false

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === undefined) {
      continue
    }

    if (passthroughMode) {
      passthrough.push(token)
      continue
    }

    if (token === '--') {
      passthroughMode = true
      continue
    }

    if (token.startsWith('--')) {
      const [rawName, inlineValue] = token.slice(2).split(/=(.*)/s, 2)
      if (!rawName) {
        continue
      }
      if (inlineValue !== undefined) {
        options[toCamelCase(rawName)] = inlineValue
        continue
      }

      const next = argv[index + 1]
      if (next !== undefined && !next.startsWith('-')) {
        options[toCamelCase(rawName)] = next
        index += 1
      } else {
        options[toCamelCase(rawName)] = true
      }
      continue
    }

    if (token.startsWith('-') && token.length > 1) {
      for (const flag of token.slice(1)) {
        options[flag] = true
      }
      continue
    }

    if (command.length === 0) {
      command.push(token)
    } else {
      positionals.push(token)
    }
  }

  return { command, options, positionals, passthrough }
}

export function createCommandRegistry<TDeps = unknown>(): CommandRegistry<TDeps> {
  const commands = new Map<string, Command<TDeps>>()
  const aliases = new Map<string, string>()

  return {
    register(command) {
      if (commands.has(command.name) || aliases.has(command.name)) {
        return err(`Command already registered: ${command.name}`)
      }

      commands.set(command.name, command)
      for (const alias of command.aliases ?? []) {
        if (commands.has(alias) || aliases.has(alias)) {
          return err(`Command alias already registered: ${alias}`)
        }
        aliases.set(alias, command.name)
      }
      return ok(undefined)
    },
    resolve(name) {
      return commands.get(aliases.get(name) ?? name)
    },
    list() {
      return [...commands.values()].sort((left, right) => left.name.localeCompare(right.name))
    },
    async run(argv, deps) {
      const args = parseArgs(argv)
      const name = args.command[0]
      if (!name) {
        return { exitCode: 1, stderr: 'No command provided.' }
      }

      const command = this.resolve(name)
      if (!command) {
        return { exitCode: 1, stderr: `Unknown command: ${name}` }
      }

      return command.run({ args, deps })
    },
  }
}

export function formatOutput(value: unknown, format: OutputFormat = 'text'): string {
  if (format === 'json') {
    return `${JSON.stringify(value, null, 2)}\n`
  }

  if (format === 'ndjson') {
    const values = Array.isArray(value) ? value : [value]
    return values.map(entry => JSON.stringify(entry)).join('\n') + '\n'
  }

  if (typeof value === 'string') {
    return `${value}\n`
  }

  if (Array.isArray(value)) {
    return `${value.map(String).join('\n')}\n`
  }

  if (value && typeof value === 'object') {
    return `${Object.entries(value)
      .map(([key, entryValue]) => `${key}: ${String(entryValue)}`)
      .join('\n')}\n`
  }

  return `${String(value)}\n`
}

export function formatHelp(commands: ReadonlyArray<Command>, binaryName = 'agentai01'): string {
  const rows = commands
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(command => `  ${command.name.padEnd(16)} ${command.description}`)
    .join('\n')

  return `Usage: ${binaryName} <command> [options]\n\nCommands:\n${rows}\n`
}

export function formatCliProgress(label: string, current: number, total: number): string {
  return renderProgressBar({ label, current, total, width: 20 })
}

function toCamelCase(value: string): string {
  return value.replace(/-([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase())
}
