import { describe, expect, it, mock } from 'bun:test';
import { fetchWithTimeout } from './fetch-timeout.js';

describe('fetchWithTimeout', () => {
  it('resolves when fetch is successful', async () => {
    const mockResponse = new Response('ok');
    const mockFetch = mock(async () => mockResponse);

    const res = await fetchWithTimeout('https://example.com', {}, 1000, mockFetch as any);
    expect(await res.text()).toBe('ok');
    expect(mockFetch).toHaveBeenCalled();
  });

  it('rejects with TimeoutError when it times out', async () => {
    const mockFetch = mock(async (_url, init) => {
      return new Promise<Response>((_resolve, reject) => {
        if (init?.signal) {
          init.signal.addEventListener('abort', () => {
            const err = new Error('request timed out');
            err.name = 'TimeoutError';
            reject(err);
          });
        }
      });
    });

    try {
      await fetchWithTimeout('https://example.com', {}, 10, mockFetch as any);
      expect().fail('Should have timed out');
    } catch (error: any) {
      expect(error.name).toBe('TimeoutError');
    }
  });
});
