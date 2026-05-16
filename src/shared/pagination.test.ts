import { describe, expect, it } from 'bun:test'

import { paginate } from './pagination.js'

describe('paginate', () => {
  it('returns the requested page with navigation metadata', () => {
    expect(paginate(['a', 'b', 'c'], { page: 2, pageSize: 2 })).toEqual({
      items: ['c'],
      page: 2,
      pageSize: 2,
      totalItems: 3,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    })
  })

  it('normalizes invalid page numbers and page sizes to one', () => {
    expect(paginate(['a', 'b'], { page: 0, pageSize: 0 })).toEqual({
      items: ['a'],
      page: 1,
      pageSize: 1,
      totalItems: 2,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    })
  })
})
