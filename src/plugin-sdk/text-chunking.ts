/**
 * Splits text into chunks by finding the best break point within a window.
 */
export function chunkTextByBreakResolver(
  text: string,
  limit: number,
  resolver: (window: string) => number,
): string[] {
  if (!text) return [];
  if (limit <= 0) return [text];
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + limit, text.length);
    if (end === text.length) {
      chunks.push(text.slice(start));
      break;
    }

    const window = text.slice(start, end);
    const breakIdx = resolver(window);

    if (breakIdx <= 0) {
      // No good break point, force split at limit
      chunks.push(window);
      start = end;
    } else {
      chunks.push(text.slice(start, start + breakIdx));
      start = start + breakIdx;
      // Skip leading whitespace after break
      while (start < text.length && /\s/.test(text[start]!)) {
        start++;
      }
    }
  }
  return chunks;
}
