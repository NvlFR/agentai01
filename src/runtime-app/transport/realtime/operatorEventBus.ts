import { EventEmitter } from 'eventemitter3'

export type OperatorEvent = {
  type: string
  payload: Record<string, unknown>
}

export class OperatorEventBus {
  private readonly emitter = new EventEmitter<{
    event: [OperatorEvent]
  }>()

  publish(event: OperatorEvent): void {
    this.emitter.emit('event', event)
  }

  subscribe(listener: (event: OperatorEvent) => void): () => void {
    this.emitter.on('event', listener)
    return () => {
      this.emitter.off('event', listener)
    }
  }
}
