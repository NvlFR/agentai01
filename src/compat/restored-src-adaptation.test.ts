import { describe, expect, it } from 'bun:test'

import {
  collectLandingPaths,
  findRestoredSrcAdaptationEntry,
  listContextFabricSourcePatterns,
  listMandatoryCapabilityCoverage,
  REQUIRED_RESTORED_SRC_CAPABILITIES,
  RESTORED_SRC_ADAPTATION_BASELINE,
} from './restored-src-adaptation.js'

describe('RESTORED_SRC_ADAPTATION_BASELINE', () => {
  it('covers every mandatory restored-src capability group', () => {
    const coverage = listMandatoryCapabilityCoverage()

    expect(coverage).toHaveLength(REQUIRED_RESTORED_SRC_CAPABILITIES.length)
    expect(coverage.every(entry => entry.covered)).toBe(true)
    expect(coverage.every(entry => entry.landingPaths.length > 0)).toBe(true)
  })

  it('keeps landing paths inside the repo integration surfaces', () => {
    const landingPaths = collectLandingPaths()

    expect(landingPaths).toContain('src/runtime')
    expect(landingPaths).toContain('src/runtime-app')
    expect(landingPaths).toContain('src/tools')
    expect(landingPaths).toContain('src/model-catalog')
  })

  it('classifies context/query/message/suggestion capability for the prompt fabric', () => {
    expect(listContextFabricSourcePatterns()).toEqual([
      'restored-src/src/context/*',
      'restored-src/src/query/*',
      'restored-src/src/query.ts',
      'restored-src/src/utils/processUserInput/*',
      'restored-src/src/utils/messages/*',
      'restored-src/src/utils/suggestions/*',
      'restored-src/src/services/PromptSuggestion/*',
    ])
  })

  it('marks query adaptation as an enhancement over existing runtime surfaces', () => {
    const entry = findRestoredSrcAdaptationEntry('query')

    expect(entry).toBeDefined()
    expect(entry?.classification).toBe('enhancement')
    expect(entry?.landingPaths).toContain('src/runtime')
    expect(entry?.landingPaths).toContain('src/runtime-app/prompt')
  })

  it('keeps the baseline free from duplicate capability ids', () => {
    const ids = RESTORED_SRC_ADAPTATION_BASELINE.map(entry => entry.capabilityId)

    expect(new Set(ids).size).toBe(ids.length)
  })
})
