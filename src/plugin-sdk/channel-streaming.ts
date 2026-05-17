export type TextChunkMode = 'length' | 'newline';
export type StreamingMode = 'off' | 'partial' | 'block' | 'progress';

export type BlockStreamingChunkConfig = {
  minChars?: number;
  maxChars?: number;
  breakPreference?: 'paragraph' | 'newline' | 'sentence';
};

export type ChannelStreamingConfig = {
  mode?: StreamingMode;
  chunkMode?: TextChunkMode;
  preview?: {
    chunk?: BlockStreamingChunkConfig;
  };
};

export type StreamingCompatEntry = {
  streaming?: unknown;
  draftChunk?: unknown;
};

function asObjectRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asBlockStreamingChunkConfig(value: unknown): BlockStreamingChunkConfig | undefined {
  return asObjectRecord(value) as BlockStreamingChunkConfig | undefined;
}

export function getChannelStreamingConfigObject(
  entry: StreamingCompatEntry | null | undefined,
): ChannelStreamingConfig | undefined {
  const streaming = asObjectRecord(entry?.streaming);
  return streaming ? (streaming as ChannelStreamingConfig) : undefined;
}

export function resolveChannelStreamingPreviewChunk(
  entry: StreamingCompatEntry | null | undefined,
): BlockStreamingChunkConfig | undefined {
  const config = getChannelStreamingConfigObject(entry);
  return (
    asBlockStreamingChunkConfig(config?.preview?.chunk) ??
    asBlockStreamingChunkConfig(entry?.draftChunk)
  );
}
