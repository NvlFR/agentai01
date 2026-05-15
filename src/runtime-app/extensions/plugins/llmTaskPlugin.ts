// src/runtime-app/extensions/plugins/llmTaskPlugin.ts
// LLM Task extension — delegates a specific reasoning task back to a configured LLM provider.

import { type ExtensionPlugin, type ExtensionContext, type ExtensionResult } from '../extensionContract.js'

export interface LlmDelegate {
  generateText(prompt: string, options?: { model?: string; temperature?: number }): Promise<string>
}

export class LlmTaskPlugin implements ExtensionPlugin {
  readonly id = 'llm-task'
  readonly description = 'Delegate a specific reasoning or transformation task to an LLM.'

  constructor(private readonly delegate: LlmDelegate) {}

  async execute(args: Record<string, unknown>, context: ExtensionContext): Promise<ExtensionResult> {
    const { task, input, model, temperature } = args as {
      task: string, input?: string, model?: string, temperature?: number
    }

    if (!task) {
      return { success: false, output: 'Error: "task" description is required.' }
    }

    try {
      context.logger(`Delegating LLM task: ${task.slice(0, 50)}...`)
      
      const prompt = `Task: ${task}\n\nInput Context:\n${input ?? 'No additional context provided.'}\n\nPlease perform the task and return ONLY the result.`
      
      const result = await this.delegate.generateText(prompt, { model, temperature })

      return {
        success: true,
        output: result,
      }
    } catch (err: any) {
      return {
        success: false,
        output: `LLM Task failed: ${err.message}`,
        error: { code: 'LLM_DELEGATE_ERROR', message: err.message, retryable: true }
      }
    }
  }
}
