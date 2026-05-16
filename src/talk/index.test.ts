import { describe, expect, it } from 'bun:test'

import { createVoiceConversation, type VoiceConversationEvent } from './index.js'

describe('createVoiceConversation', () => {
  it('tracks voice session lifecycle, turn-taking, and immutable snapshots', () => {
    const events: VoiceConversationEvent[] = []
    let tick = 0
    const conversation = createVoiceConversation({
      id: 'voice-session-1',
      now: () => new Date(1_000 + tick++),
      createTurnId: () => `turn-${tick}`,
      onEvent: (event) => events.push(event),
    })

    conversation.startListening()
    const operatorTurn = conversation.beginTurn('operator', 'hello')
    conversation.appendToActiveTurn(' agent')
    const completed = conversation.completeActiveTurn()
    conversation.startThinking()
    conversation.startSpeaking()
    conversation.beginTurn('assistant', 'hello operator')
    const ended = conversation.end()

    expect(operatorTurn.text).toBe('hello')
    expect(completed.text).toBe('hello agent')
    expect(ended.state).toBe('ended')
    expect(ended.turns).toHaveLength(2)
    expect(ended.turns[1]?.interrupted).toBe(true)
    expect(events.map((event) => event.type)).toEqual([
      'session_started',
      'state_changed',
      'turn_started',
      'turn_completed',
      'state_changed',
      'state_changed',
      'turn_started',
      'turn_interrupted',
      'session_ended',
    ])
  })

  it('prevents overlapping turns and changes after session end', () => {
    const conversation = createVoiceConversation({
      id: 'voice-session-2',
      createTurnId: () => 'turn-1',
    })

    conversation.beginTurn('operator')
    expect(() => conversation.beginTurn('assistant')).toThrow(
      'Cannot begin a new voice turn while another turn is active',
    )

    conversation.end()
    expect(() => conversation.startListening()).toThrow('Voice session has already ended')
  })
})
