import { Result, ok, err } from '../../shared/result.js';
import type { GenerationProvider, GenerationRequest, GenerationResult } from './types.js';

export class GenerationRegistry {
  private providers = new Map<string, GenerationProvider>();

  register(provider: GenerationProvider): void {
    this.providers.set(provider.id, provider);
  }

  async generate(req: GenerationRequest): Promise<Result<GenerationResult, Error>> {
    const provider = this.providers.get(req.provider);
    if (!provider) {
      return err(new Error(`Generation provider not found: ${req.provider}`));
    }

    if (!provider.supportedTypes.includes(req.type)) {
      return err(new Error(`Provider ${req.provider} does not support generation type: ${req.type}`));
    }

    try {
      const result = await provider.generate(req);
      return ok(result);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export function createGenerationRegistry(): GenerationRegistry {
  return new GenerationRegistry();
}
