export type LazyAsync<T> = () => Promise<T>

export function createLazyAsync<T>(factory: () => Promise<T>): LazyAsync<T> {
  let promise: Promise<T> | undefined
  return () => {
    promise ??= factory()
    return promise
  }
}
