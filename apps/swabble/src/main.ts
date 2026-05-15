// apps/swabble/src/main.ts
// Swabble main logic: Mic input, runtime comms, TTS playback.

const micBtn = document.getElementById('mic-btn') as HTMLButtonElement
const micIcon = document.getElementById('mic-icon')
const waveforms = document.getElementById('waveforms')
const chatHistory = document.getElementById('chat-history')
const fallbackInput = document.getElementById('fallback-input') as HTMLInputElement
const statusDot = document.getElementById('status-dot')
const statusText = document.getElementById('status-text')

let isListening = false
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []

// --- UI State Helpers ---

function updateStatus(state: 'connected' | 'disconnected' | 'processing' | 'listening' | 'speaking') {
  statusDot?.classList.remove('active')
  if (state === 'connected' || state === 'listening' || state === 'speaking') {
    statusDot?.classList.add('active')
  }
  if (statusText) statusText.innerText = state.charAt(0).toUpperCase() + state.slice(1)
}

function addMessage(text: string, sender: 'user' | 'assistant') {
  const msg = document.createElement('div')
  msg.className = `message ${sender}`
  msg.innerText = text
  chatHistory?.appendChild(msg)
  chatHistory?.scrollTo({ top: chatHistory.scrollHeight, behavior: 'smooth' })
}

// --- Voice Logic ---

async function startListening() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data)
    }

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      await processVoiceInput(audioBlob)
    }

    mediaRecorder.start()
    isListening = true
    micBtn?.classList.add('listening')
    waveforms?.classList.add('active')
    updateStatus('listening')
  } catch (err) {
    console.error('Failed to access microphone', err)
    addMessage('Could not access microphone. Check permissions.', 'assistant')
  }
}

function stopListening() {
  mediaRecorder?.stop()
  isListening = false
  micBtn?.classList.remove('listening')
  waveforms?.classList.remove('active')
  updateStatus('processing')
}

async function processVoiceInput(blob: Blob) {
  // Convert blob to base64 or send as FormData
  const formData = new FormData()
  formData.append('audio', blob)

  try {
    // Mocking runtime response for now
    // In real app: const res = await fetch('/api/speech/chat', { method: 'POST', body: formData })
    console.log('Sending audio to runtime...', blob.size)

    // Simulate network delay
    await new Promise(r => setTimeout(r, 1000))

    const mockText = "I've processed your voice request. This is a simulated response."
    addMessage('Voice Input Received', 'user')
    addMessage(mockText, 'assistant')

    // Simulate TTS playback
    await playMockTts(mockText)

    updateStatus('connected')
  } catch (err) {
    console.error('Processing failed', err)
    updateStatus('connected')
    addMessage('Something went wrong processing your voice.', 'assistant')
  }
}

async function playMockTts(text: string) {
  updateStatus('speaking')
  // Use browser native TTS as fallback/mock
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.onend = () => updateStatus('connected')
  window.speechSynthesis.speak(utterance)
}

// --- Event Listeners ---

micBtn?.addEventListener('click', () => {
  if (isListening) {
    stopListening()
  } else {
    startListening()
  }
})

fallbackInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && fallbackInput.value.trim()) {
    const text = fallbackInput.value.trim()
    addMessage(text, 'user')
    fallbackInput.value = ''

    // Mock assistant response
    setTimeout(async () => {
      const reply = "I hear you. I'm working on that task."
      addMessage(reply, 'assistant')
      await playMockTts(reply)
    }, 500)
  }
})

// Initialize
updateStatus('connected')
