export type ModelCapability = 'chat' | 'vision' | 'tools' | 'json' | 'embedding'

export type ModelPricing = {
  inputPerMillion: number
  outputPerMillion: number
}

export type ModelMetadata = {
  id: string
  provider: string
  displayName: string
  capabilities: readonly ModelCapability[]
  contextWindow: number
  pricing?: ModelPricing
}

export type ModelSelectionRequest = {
  requiredCapabilities: readonly ModelCapability[]
  minContextWindow?: number
  maxInputPerMillion?: number
}

export function selectModel(catalog: readonly ModelMetadata[], request: ModelSelectionRequest): ModelMetadata | null {
  const candidates = catalog.filter(model =>
    request.requiredCapabilities.every(capability => model.capabilities.includes(capability)) &&
    model.contextWindow >= (request.minContextWindow ?? 0) &&
    (!request.maxInputPerMillion || !model.pricing || model.pricing.inputPerMillion <= request.maxInputPerMillion),
  )

  return [...candidates].sort((left: ModelMetadata, right: ModelMetadata) => {
    const leftPrice = left.pricing?.inputPerMillion ?? Number.POSITIVE_INFINITY
    const rightPrice = right.pricing?.inputPerMillion ?? Number.POSITIVE_INFINITY
    return leftPrice - rightPrice || right.contextWindow - left.contextWindow
  })[0] ?? null
}

export function estimateModelCost(model: ModelMetadata, inputTokens: number, outputTokens: number): number | null {
  if (!model.pricing) {
    return null
  }

  return (inputTokens / 1_000_000) * model.pricing.inputPerMillion +
    (outputTokens / 1_000_000) * model.pricing.outputPerMillion
}
