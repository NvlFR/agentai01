import { test, expect, describe, mock } from 'bun:test';
import { createOpenAIImageProvider } from './openai-image.js';

// Mock OpenAI client
mock.module('openai', () => {
  return {
    default: class MockOpenAI {
      images = {
        generate: mock(async () => {
          return {
            data: [
              { b64_json: Buffer.from('fake-image').toString('base64') }
            ]
          };
        }),
      };
    }
  };
});

describe('createOpenAIImageProvider', () => {
  test('generates image successfully', async () => {
    const provider = createOpenAIImageProvider({ apiKey: 'test-key' });
    const result = await provider.generate({
      type: 'image',
      provider: 'openai-image',
      model: 'dall-e-3',
      prompt: 'a cute cat',
    });

    expect(result.buffers.length).toBe(1);
    expect(result.buffers[0].toString()).toBe('fake-image');
    expect(result.mimeType).toBe('image/png');
  });

  test('throws error for unsupported type', async () => {
    const provider = createOpenAIImageProvider({ apiKey: 'test-key' });
    expect(provider.generate({
      type: 'audio',
      provider: 'openai-image',
      model: 'dall-e-3',
      prompt: 'test',
    })).rejects.toThrow('OpenAI Image Provider only supports image generation');
  });
});
