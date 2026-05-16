import { describe, expect, test } from 'bun:test'

import { estimateModelCost, selectModel, type ModelMetadata } from './index.js'

describe('model-catalog', () => {
  test('selects the cheapest capable model and estimates cost', () => {
    const catalog: ModelMetadata[] = [
      { id: 'large', provider: 'p', displayName: 'Large', capabilities: ['chat', 'json'], contextWindow: 128_000, pricing: { inputPerMillion: 5, outputPerMillion: 10 } },
      { id: 'mini', provider: 'p', displayName: 'Mini', capabilities: ['chat', 'json'], contextWindow: 32_000, pricing: { inputPerMillion: 1, outputPerMillion: 2 } },
    ]
    const model = selectModel(catalog, { requiredCapabilities: ['chat', 'json'], minContextWindow: 16_000 })

    expect(model?.id).toBe('mini')
    expect(estimateModelCost(model!, 1_000_000, 500_000)).toBe(2)
  })
})
