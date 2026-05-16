export type ServiceHealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export type ServiceHealth = {
  serviceId: string
  status: ServiceHealthStatus
  message?: string
}

export type ServiceDefinition<T = unknown> = {
  id: string
  dependencies?: readonly string[]
  start: (container: ServiceContainer) => Promise<T> | T
  stop?: (instance: T) => Promise<void> | void
  health?: (instance: T) => Promise<ServiceHealth> | ServiceHealth
}

export type BootHealthReport = {
  status: ServiceHealthStatus
  services: ServiceHealth[]
}

export class ServiceContainer {
  private readonly instances = new Map<string, unknown>()

  set<T>(id: string, instance: T): void {
    this.instances.set(id, instance)
  }

  get<T>(id: string): T {
    if (!this.instances.has(id)) {
      throw new Error(`Service is not registered: ${id}`)
    }

    return this.instances.get(id) as T
  }

  has(id: string): boolean {
    return this.instances.has(id)
  }
}

export class BootstrapRegistry {
  private readonly services = new Map<string, ServiceDefinition>()
  private readonly container = new ServiceContainer()
  private readonly started: string[] = []

  register<T>(definition: ServiceDefinition<T>): void {
    if (this.services.has(definition.id)) {
      throw new Error(`Service already registered: ${definition.id}`)
    }

    this.services.set(definition.id, definition as ServiceDefinition)
  }

  plan(): string[] {
    return orderServices(this.services)
  }

  async boot(): Promise<ServiceContainer> {
    for (const id of this.plan()) {
      if (this.container.has(id)) {
        continue
      }

      const definition = this.requireDefinition(id)
      const instance = await definition.start(this.container)
      this.container.set(id, instance)
      this.started.push(id)
    }

    return this.container
  }

  async shutdown(): Promise<void> {
    for (const id of [...this.started].reverse()) {
      const definition = this.requireDefinition(id)
      await definition.stop?.(this.container.get(id))
    }
    this.started.length = 0
  }

  async health(): Promise<BootHealthReport> {
    const services: ServiceHealth[] = []
    for (const id of this.started) {
      const definition = this.requireDefinition(id)
      if (!definition.health) {
        services.push({ serviceId: id, status: 'healthy' })
        continue
      }

      services.push(await definition.health(this.container.get(id)))
    }

    return {
      status: aggregateServiceHealth(services),
      services,
    }
  }

  private requireDefinition(id: string): ServiceDefinition {
    const definition = this.services.get(id)
    if (!definition) {
      throw new Error(`Service is not registered: ${id}`)
    }

    return definition
  }
}

export function createBootstrapRegistry(): BootstrapRegistry {
  return new BootstrapRegistry()
}

export function aggregateServiceHealth(
  services: readonly ServiceHealth[],
): ServiceHealthStatus {
  if (services.some(service => service.status === 'unhealthy')) {
    return 'unhealthy'
  }

  if (services.some(service => service.status === 'degraded')) {
    return 'degraded'
  }

  return 'healthy'
}

function orderServices(services: ReadonlyMap<string, ServiceDefinition>): string[] {
  const ordered: string[] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()

  for (const id of services.keys()) {
    visitService(id, services, visiting, visited, ordered)
  }

  return ordered
}

function visitService(
  id: string,
  services: ReadonlyMap<string, ServiceDefinition>,
  visiting: Set<string>,
  visited: Set<string>,
  ordered: string[],
): void {
  if (visited.has(id)) {
    return
  }

  if (visiting.has(id)) {
    throw new Error(`Circular service dependency detected at ${id}.`)
  }

  const definition = services.get(id)
  if (!definition) {
    throw new Error(`Missing service dependency: ${id}`)
  }

  visiting.add(id)
  for (const dependency of definition.dependencies ?? []) {
    visitService(dependency, services, visiting, visited, ordered)
  }
  visiting.delete(id)
  visited.add(id)
  ordered.push(id)
}
