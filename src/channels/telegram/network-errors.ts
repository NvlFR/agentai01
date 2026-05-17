export function isSafeToRetrySendError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  // Simplified: retry on typical network connection failures
  const code = (err as Record<string, unknown>).code || (err as Record<string, unknown>).errno;
  if (typeof code === 'string') {
    const uc = code.toUpperCase();
    return ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ENETUNREACH', 'EHOSTUNREACH'].includes(uc);
  }
  return false;
}

export function isTelegramClientRejection(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as Record<string, unknown>).error_code;
  return typeof code === 'number' && code >= 400 && code < 500;
}
