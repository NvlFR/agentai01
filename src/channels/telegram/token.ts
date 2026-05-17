import { tryReadSecretFileSync } from '../../plugin-sdk/secret-file.js'

export function resolveTelegramToken(cfg: any, accountId?: string): string {
  // 1. Check environment variable (highest precedence)
  const envToken = process.env.TOKEN_TELE || process.env.TELEGRAM_BOT_TOKEN;
  if (envToken?.trim()) {
    return envToken.trim();
  }

  // 2. Resolve account-specific config
  const telegramCfg = cfg?.channels?.telegram;
  const accountCfg = accountId ? telegramCfg?.accounts?.[accountId] : null;
  
  // Try account botToken or tokenFile
  const accountToken = accountCfg?.botToken || accountCfg?.token;
  if (accountToken?.trim()) {
    return accountToken.trim();
  }

  const accountTokenFile = accountCfg?.tokenFile;
  if (accountTokenFile?.trim()) {
    const fileToken = tryReadSecretFileSync(accountTokenFile, 'TOKEN_TELE');
    if (fileToken?.trim()) {
      return fileToken.trim();
    }
  }

  // 3. Fallback to global telegram config
  const globalToken = telegramCfg?.token || telegramCfg?.botToken;
  if (globalToken?.trim()) {
    return globalToken.trim();
  }

  const globalTokenFile = telegramCfg?.tokenFile;
  if (globalTokenFile?.trim()) {
    const fileToken = tryReadSecretFileSync(globalTokenFile, 'TOKEN_TELE');
    if (fileToken?.trim()) {
      return fileToken.trim();
    }
  }

  throw new Error(
    `Telegram bot token missing for account "${accountId ?? 'default'}" (set channels.telegram.accounts.${accountId ?? 'default'}.botToken/tokenFile or TOKEN_TELE/TELEGRAM_BOT_TOKEN environment variable).`
  );
}
