export type VoiceSessionId = string

export type VoiceSessionState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'ended'

export type VoiceRole = 'operator' | 'assistant' | 'system'

export type VoiceTurn = {
  id: string
  role: VoiceRole
  text: string
  startedAt: Date
  endedAt?: Date
  interrupted?: boolean
}

export type VoiceSession = {
  id: VoiceSessionId
  state: VoiceSessionState
  startedAt: Date
  updatedAt: Date
  endedAt?: Date
  turns: readonly VoiceTurn[]
  metadata: Readonly<Record<string, string>>
}

export type VoiceSessionSnapshot = VoiceSession & {
  activeTurn?: VoiceTurn
}

export type VoiceConversationEvent =
  | { type: 'session_started'; session: VoiceSessionSnapshot }
  | { type: 'state_changed'; session: VoiceSessionSnapshot; from: VoiceSessionState; to: VoiceSessionState }
  | { type: 'turn_started'; session: VoiceSessionSnapshot; turn: VoiceTurn }
  | { type: 'turn_completed'; session: VoiceSessionSnapshot; turn: VoiceTurn }
  | { type: 'turn_interrupted'; session: VoiceSessionSnapshot; turn: VoiceTurn }
  | { type: 'session_ended'; session: VoiceSessionSnapshot }

export type VoiceSessionOptions = {
  id?: VoiceSessionId
  now?: () => Date
  createTurnId?: () => string
  metadata?: Readonly<Record<string, string>>
  onEvent?: (event: VoiceConversationEvent) => void
}

export type VoiceConversation = {
  snapshot(): VoiceSessionSnapshot
  startListening(): VoiceSessionSnapshot
  startThinking(): VoiceSessionSnapshot
  startSpeaking(): VoiceSessionSnapshot
  beginTurn(role: VoiceRole, text?: string): VoiceTurn
  appendToActiveTurn(text: string): VoiceTurn
  completeActiveTurn(text?: string): VoiceTurn
  interruptActiveTurn(): VoiceTurn
  end(): VoiceSessionSnapshot
}

export function createVoiceConversation(options: VoiceSessionOptions = {}): VoiceConversation {
  const now = options.now ?? (() => new Date())
  const createTurnId = options.createTurnId ?? (() => crypto.randomUUID())
  const sessionId = options.id ?? crypto.randomUUID()
  const startedAt = now()
  const events = options.onEvent
  let state: VoiceSessionState = 'idle'
  let updatedAt = startedAt
  let endedAt: Date | undefined
  let activeTurn: VoiceTurn | undefined
  const turns: VoiceTurn[] = []

  const emit = (event: VoiceConversationEvent): void => {
    events?.(event)
  }

  const snapshot = (): VoiceSessionSnapshot => ({
    id: sessionId,
    state,
    startedAt,
    updatedAt,
    ...(endedAt === undefined ? {} : { endedAt }),
    turns: turns.map(cloneTurn),
    metadata: options.metadata ?? {},
    ...(activeTurn === undefined ? {} : { activeTurn: cloneTurn(activeTurn) }),
  })

  const transition = (to: VoiceSessionState): VoiceSessionSnapshot => {
    assertOpen(state)
    if (state === to) {
      return snapshot()
    }

    const from = state
    state = to
    updatedAt = now()
    const next = snapshot()
    emit({ type: 'state_changed', session: next, from, to })
    return next
  }

  const conversation: VoiceConversation = {
    snapshot,
    startListening() {
      return transition('listening')
    },
    startThinking() {
      return transition('thinking')
    },
    startSpeaking() {
      return transition('speaking')
    },
    beginTurn(role, text = '') {
      assertOpen(state)
      if (activeTurn) {
        throw new Error('Cannot begin a new voice turn while another turn is active')
      }

      activeTurn = {
        id: createTurnId(),
        role,
        text,
        startedAt: now(),
      }
      updatedAt = activeTurn.startedAt
      const turn = cloneTurn(activeTurn)
      emit({ type: 'turn_started', session: snapshot(), turn })
      return turn
    },
    appendToActiveTurn(text) {
      assertActiveTurn(activeTurn)
      activeTurn = {
        ...activeTurn,
        text: `${activeTurn.text}${text}`,
      }
      updatedAt = now()
      return cloneTurn(activeTurn)
    },
    completeActiveTurn(text) {
      assertActiveTurn(activeTurn)
      const completedAt = now()
      const completed: VoiceTurn = {
        ...activeTurn,
        text: text ?? activeTurn.text,
        endedAt: completedAt,
      }
      turns.push(completed)
      activeTurn = undefined
      updatedAt = completedAt
      emit({ type: 'turn_completed', session: snapshot(), turn: cloneTurn(completed) })
      return cloneTurn(completed)
    },
    interruptActiveTurn() {
      assertActiveTurn(activeTurn)
      const interruptedAt = now()
      const interrupted: VoiceTurn = {
        ...activeTurn,
        interrupted: true,
        endedAt: interruptedAt,
      }
      turns.push(interrupted)
      activeTurn = undefined
      updatedAt = interruptedAt
      emit({ type: 'turn_interrupted', session: snapshot(), turn: cloneTurn(interrupted) })
      return cloneTurn(interrupted)
    },
    end() {
      assertOpen(state)
      if (activeTurn) {
        conversation.interruptActiveTurn()
      }
      state = 'ended'
      endedAt = now()
      updatedAt = endedAt
      const ended = snapshot()
      emit({ type: 'session_ended', session: ended })
      return ended
    },
  }

  emit({ type: 'session_started', session: snapshot() })
  return conversation
}

function cloneTurn(turn: VoiceTurn): VoiceTurn {
  return {
    ...turn,
    startedAt: new Date(turn.startedAt.getTime()),
    ...(turn.endedAt === undefined ? {} : { endedAt: new Date(turn.endedAt.getTime()) }),
  }
}

function assertOpen(state: VoiceSessionState): void {
  if (state === 'ended') {
    throw new Error('Voice session has already ended')
  }
}

function assertActiveTurn(turn: VoiceTurn | undefined): asserts turn is VoiceTurn {
  if (!turn) {
    throw new Error('No active voice turn')
  }
}
