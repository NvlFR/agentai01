import { describe, expect, it } from 'bun:test'
import { createLspService } from './lspService.js'

describe('createLspService', () => {
  it('stores diagnostics and broadcasts passive feedback hooks', () => {
    const seen: string[] = []
    const service = createLspService()
    service.onDiagnostic(diagnostic => {
      seen.push(diagnostic.message)
    })

    service.publish('file:///test.ts', [{ uri: 'file:///test.ts', severity: 'warning', message: 'unused symbol' }])
    expect(service.list('file:///test.ts')).toHaveLength(1)
    expect(seen).toEqual(['unused symbol'])
  })
})
