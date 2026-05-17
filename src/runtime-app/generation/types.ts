export type GenerationType = 'image' | 'audio' | 'document';

export type GenerationRequest = {
  type: GenerationType;
  provider: string;
  model: string;
  prompt: string;
  timeoutMs?: number;
  count?: number;
  size?: string;
  metadata?: Record<string, unknown>;
  cfg?: Record<string, unknown>;
};

export type GenerationResult = {
  buffers: Buffer[];
  mimeType: string;
  model?: string;
  metadata?: Record<string, unknown>;
};

export type GenerationProvider = {
  id: string;
  supportedTypes: GenerationType[];
  generate: (req: GenerationRequest) => Promise<GenerationResult>;
};
