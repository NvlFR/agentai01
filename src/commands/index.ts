import { err, ok, type Result } from '../shared/index.js'

export type CommandContext = {
  actor: string
  args: readonly string[]
}

export type CommandResult = {
  code: 'ok' | 'not_found' | 'failed'
  message: string
  data?: unknown
}

export type CommandDefinition = {
  id: string
  summary: string
  usage: string
  execute(context: CommandContext): Promise<CommandResult>
}

export type CommandRegistry = {
  register(command: CommandDefinition): Result<CommandDefinition, string>
  execute(id: string, context: CommandContext): Promise<CommandResult>
  help(): string
}

export function createCommandRegistry(): CommandRegistry {
  const commands = new Map<string, CommandDefinition>()

  return {
    register(command) {
      if (!command.id.trim()) {
        return err('Command id is required.')
      }
      commands.set(command.id, command)
      return ok(command)
    },
    async execute(id, context) {
      const command = commands.get(id)
      if (!command) {
        return { code: 'not_found', message: `Command not found: ${id}` }
      }

      try {
        return await command.execute(context)
      } catch (error) {
        return {
          code: 'failed',
          message: error instanceof Error ? error.message : 'Command failed.',
        }
      }
    },
    help() {
      return [...commands.values()]
        .map(command => `${command.usage} - ${command.summary}`)
        .join('\n')
    },
  }
}
