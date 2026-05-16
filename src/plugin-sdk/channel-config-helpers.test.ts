import { describe, expect, it } from 'bun:test'
import { 
  normalizeChannelDmPolicy, 
  ensureOpenDmPolicyAllowFromWildcard,
  normalizeLegacyDmAliases 
} from './channel-config-helpers.js'

describe('channel-config-helpers', () => {
  describe('normalizeChannelDmPolicy', () => {
    it('should normalize valid policies', () => {
      expect(normalizeChannelDmPolicy('pairing')).toBe('pairing')
      expect(normalizeChannelDmPolicy('open')).toBe('open')
      expect(normalizeChannelDmPolicy('invalid')).toBeUndefined()
    })
  })

  describe('ensureOpenDmPolicyAllowFromWildcard', () => {
    it('should add wildcard if policy is open', () => {
      const entry = { dmPolicy: 'open', allowFrom: ['user1'] }
      const changes: string[] = []
      ensureOpenDmPolicyAllowFromWildcard({
        entry,
        mode: 'topOnly',
        pathPrefix: 'test',
        changes
      })
      expect(entry.allowFrom).toContain('*')
      expect(changes.length).toBe(1)
    })

    it('should not add wildcard if already present', () => {
      const entry = { dmPolicy: 'open', allowFrom: ['*'] }
      const changes: string[] = []
      ensureOpenDmPolicyAllowFromWildcard({
        entry,
        mode: 'topOnly',
        pathPrefix: 'test',
        changes
      })
      expect(entry.allowFrom).toEqual(['*'])
      expect(changes.length).toBe(0)
    })
  })

  describe('normalizeLegacyDmAliases', () => {
    it('should migrate dm.policy to dmPolicy', () => {
      const entry = { dm: { policy: 'open' } }
      const changes: string[] = []
      const result = normalizeLegacyDmAliases({
        entry,
        pathPrefix: 'test',
        changes
      })
      expect(result.changed).toBe(true)
      expect(result.entry.dmPolicy).toBe('open')
      expect(result.entry.dm).toBeUndefined()
    })
  })
})
