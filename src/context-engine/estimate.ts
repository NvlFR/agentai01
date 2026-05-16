export function estimateTokens(content: string): number {
  return Math.max(1, Math.ceil(content.trim().length / 4))
}
