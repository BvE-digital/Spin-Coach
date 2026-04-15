import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../../store/sessionStore'
import { useDebriefSession } from '../../hooks/useDebriefSession'
import { useSpeech } from '../../hooks/useSpeech'
import { useTTS } from '../../hooks/useTTS'
import { SpinIndicator } from './SpinIndicator'
import { MicButton } from './MicButton'
import { Button } from '../ui/Button'
import type { SpinStage } from '../../types/session'

const STAGE_ORDER: SpinStage[] = ['S', 'P', 'I', 'N']

export function DebriefScreen() {
  const navigate = useNavigate()
  const store = useSessionStore()
  const { sendMessage, endSession, sessionContext } = useDebriefSession()
  const { speak, cancel: cancelTTS } = useTTS()
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const hasStarted = useRef(false)

  const completedStages = STAGE_ORDER.slice(0, STAGE_ORDER.indexOf(store.currentSpinStage))

  // Get the latest AI message to display
  const lastAiMessage = [...store.messages].reverse().find((m) => m.role === 'assistant')
  const displayText = store.isProcessing ? store.streamingResponse : lastAiMessage?.content ?? ''

  const { start: startRecording, stop: stopRecording, isRecording } = useSpeech({
    onTranscript: (text) => store.setPartialTranscript(text),
    onSubmit: async (text) => {
      await sendMessage(text)
    },
    onError: (err) => console.error('Speech error:', err),
  })

  // Kick off the session with the opening question on first load
  useEffect(() => {
    if (hasStarted.current || store.messages.length > 0) return
    hasStarted.current = true

    const openingPrompt = `Begin the SPIN debrief for ${sessionContext.customerName}. Ask the opening Situation question.`
    void sendMessage(openingPrompt)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // When AI finishes responding, speak the response and enable mic
  useEffect(() => {
    const lastMsg = store.messages[store.messages.length - 1]
    if (lastMsg?.role === 'assistant' && !store.isProcessing && lastMsg.content.trim()) {
      speak(lastMsg.content, () => {
        if (!isPaused) startRecording()
      })
    }
  }, [store.messages.length, store.isProcessing]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleMicClick() {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  function handlePause() {
    stopRecording()
    cancelTTS()
    setIsPaused(!isPaused)
  }

  async function handleEndSession() {
    stopRecording()
    cancelTTS()
    await endSession()
  }

  // Redirect if no session is set up
  if (!store.sessionId || !store.selectedAccount) {
    navigate('/session/setup')
    return null
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] items-center">
      {/* SPIN stage indicator */}
      <div className="w-full pt-2 pb-6">
        <SpinIndicator current={store.currentSpinStage} completed={completedStages} />
      </div>

      {/* AI question display */}
      <div className="flex-1 w-full flex flex-col items-center justify-center px-2">
        <div className="bg-nutreco-teal/10 border border-nutreco-teal/20 rounded-2xl p-6 w-full max-w-md min-h-[120px] flex items-center">
          {store.isProcessing && !displayText ? (
            <div className="flex items-center gap-3 text-nutreco-teal">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-nutreco-teal rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-sm text-nutreco-teal/70">SPIN Coach is thinking…</span>
            </div>
          ) : (
            <p className="text-nutreco-neutral text-lg leading-relaxed">{displayText}</p>
          )}
        </div>

        {/* Rep transcript */}
        {(isRecording || store.partialTranscript) && (
          <div className="mt-4 w-full max-w-md bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">You're saying…</p>
            <p className="text-nutreco-neutral text-base">
              {store.partialTranscript || '…'}
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full flex flex-col items-center gap-6 pb-6 pt-4">
        {isPaused ? (
          <div className="text-center">
            <p className="text-nutreco-neutral text-sm mb-3">Session paused</p>
            <Button onClick={handlePause} variant="secondary">
              Resume Session
            </Button>
          </div>
        ) : (
          <MicButton
            isRecording={isRecording}
            isDisabled={store.isProcessing}
            onClick={handleMicClick}
          />
        )}

        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={handlePause}>
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowEndConfirm(true)}
          >
            End Session
          </Button>
        </div>
      </div>

      {/* End session confirmation modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-nutreco-neutral mb-2">End this session?</h3>
            <p className="text-gray-500 text-sm mb-6">
              The AI will extract and summarise your debrief for review before pushing to D365.
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowEndConfirm(false)}
              >
                Continue
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => void handleEndSession()}
              >
                End &amp; Review
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
