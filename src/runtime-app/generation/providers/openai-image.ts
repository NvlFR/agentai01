import OpenAI from 'openai';
import type { GenerationProvider, GenerationRequest, GenerationResult } from '../types.js';

export type OpenAIImageProviderConfig = {
  apiKey: string;
  baseURL?: string;
};

export function createOpenAIImageProvider(config: OpenAIImageProviderConfig): GenerationProvider {
  return {
    id: 'openai-image',
    supportedTypes: ['image'],
    async generate(req: GenerationRequest): Promise<GenerationResult> {
      if (req.type !== 'image') {
        throw new Error('OpenAI Image Provider only supports image generation');
      }

      const client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
      });

      const response = await client.images.generate({
        model: req.model || 'dall-e-3',
        prompt: req.prompt,
        n: req.count || 1,
        size: (req.size || '1024x1024') as '1024x1024',
        response_format: 'b64_json',
      });

      const buffers: Buffer[] = [];
      if (response.data) {
        for (const data of response.data) {
          if (data.b64_json) {
            buffers.push(Buffer.from(data.b64_json, 'base64'));
          }
        }
      }

      return {
        buffers,
        mimeType: 'image/png',
        model: req.model || 'dall-e-3',
      };
    },
  };
}
