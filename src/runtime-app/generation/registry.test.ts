import { test, expect, describe } from 'bun:test';
import { createGenerationRegistry } from './registry.js';
import type { GenerationProvider } from './types.js';

describe('GenerationRegistry', () => {
  test('registers and routes request to provider', async () => {
    const registry = createGenerationRegistry();
    const mockProvider: GenerationProvider = {
      id: 'mock-provider',
      supportedTypes: ['image'],
      generate: async () => ({
        buffers: [Buffer.from('test')],
        mimeType: 'image/png',
      }),
    };
    registry.register(mockProvider);

    const result = await registry.generate({
      type: 'image',
      provider: 'mock-provider',
      model: 'test',
      prompt: 'test',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.mimeType).toBe('image/png');
    }
  });

  test('returns error for missing provider', async () => {
    const registry = createGenerationRegistry();
    const result = await registry.generate({
      type: 'image',
      provider: 'missing',
      model: 'test',
      prompt: 'test',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Generation provider not found: missing');
    }
  });

  test('returns error for unsupported type', async () => {
    const registry = createGenerationRegistry();
    const mockProvider: GenerationProvider = {
      id: 'mock-provider',
      supportedTypes: ['image'],
      generate: async () => ({ buffers: [], mimeType: 'image/png' }),
    };
    registry.register(mockProvider);

    const result = await registry.generate({
      type: 'audio',
      provider: 'mock-provider',
      model: 'test',
      prompt: 'test',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('does not support generation type');
    }
  });
});
