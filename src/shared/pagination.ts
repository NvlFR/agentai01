export type PageRequest = {
  page: number
  pageSize: number
}

export type Page<T> = {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export function paginate<T>(items: readonly T[], request: PageRequest): Page<T> {
  const page = Math.max(1, Math.trunc(request.page))
  const pageSize = Math.max(1, Math.trunc(request.pageSize))
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const start = (page - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}
