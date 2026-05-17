import { describe, expect, it, afterEach, beforeEach } from 'bun:test';
import { resolveTelegramToken } from './token.js';
import { writeFile, unlink, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

describe('telegram token resolution', () => {
  const tempDir = join(process.cwd(), 'temp-token-test');

  beforeEach(async () => {
    await mkdir(tempDir, { recursive: true });
    process.env.TOKEN_TELE = '';
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    process.env.TOKEN_TELE = '';
  });

  it('should resolve from environment variable (highest precedence)', () => {
    process.env.TOKEN_TELE = 'env-token';
    const cfg = {
      channels: {
        telegram: {
          token: 'config-token'
        }
      }
    };
    const res = resolveTelegramToken(cfg);
    expect(res).toBe('env-token');
  });

  it('should resolve from token file', async () => {
    const tokenPath = join(tempDir, 'bot.token');
    await writeFile(tokenPath, 'file-token');
    
    const cfg = {
      channels: {
        telegram: {
          accounts: {
            'acc1': {
              tokenFile: tokenPath
            }
          }
        }
      }
    };
    const res = resolveTelegramToken(cfg, 'acc1');
    expect(res).toBe('file-token');
  });

  it('should resolve from config botToken', () => {
    const cfg = {
      channels: {
        telegram: {
          accounts: {
            'acc1': {
              botToken: 'config-acc-token'
            }
          }
        }
      }
    };
    const res = resolveTelegramToken(cfg, 'acc1');
    expect(res).toBe('config-acc-token');
  });

  it('should resolve from default config token if no accountId', () => {
    const cfg = {
      channels: {
        telegram: {
          token: 'default-token'
        }
      }
    };
    const res = resolveTelegramToken(cfg);
    expect(res).toBe('default-token');
  });

  it('should throw if no token found', () => {
    const cfg = {};
    expect(() => resolveTelegramToken(cfg)).toThrow(/Telegram bot token missing/);
  });
});
