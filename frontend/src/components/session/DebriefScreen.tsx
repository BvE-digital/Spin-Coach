import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../../store/sessionStore'
import { useDebriefSession } from '../../hooks/useDebriefSession'
import { useSpeech } from '../../hooks/useSpeech'
import { useTTS } from '../../hooks/useTTS'
import { SpinIndicator } from './SpinIndicator'
import { MicButton } from './MicButton'
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

  const lastAiMessage = [...store.messages].reverse().find((m) => m.role === 'assistant')
  const displayText = store.isProcessing ? store.streamingResponse : lastAiMessage?.content ?? ''

  const { start: startRecording, stop: stopRecording, isRecording } = useSpeech({
    onTranscript: (text) => store.setPartialTranscript(text),
    onSubmit: async (text) => {
      await sendMessage(text)
    },
    onError: (err) => console.error('Speech error:', err),
  })

  useEffect(() => {
    if (hasStarted.current || store.messages.length > 0) return
    hasStarted.current = true
    const openingPrompt = `Begin the SPIN debrief for ${sessionContext.customerName}. Ask the opening Situation question.`
    void sendMessage(openingPrompt)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  if (!store.sessionId || !store.selectedAccount) {
    navigate('/session/setup')
    return null
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">

      {/* Header strip */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Debriefing</p>
          <p className="font-semibold text-nutreco-neutral text-sm truncate max-w-[200px]">
            {store.selectedAccount.name}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowEndConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-nutreco-red border border-nutreco-red/30 hover:bg-nutreco-red/5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
          </svg>
          End
        </button>
      </div>

      {/* SPIN indicator */}
      <div className="mb-6">
        <SpinIndicator current={store.currentSpinStage} completed={completedStages} />
      </div>

      {/* AI response area */}
      <div className="flex-1 flex flex-col justify-center gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 min-h-[130px] flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-nutreco-blue flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-nutreco-blue mb-1.5">SPIN Coach</p>
            {store.isProcessing && !displayText ? (
              <div className="flex items-center gap-1.5 pt-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-nutreco-blue/40 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-nutreco-neutral text-base leading-relaxed">{displayText}</p>
            )}
          </div>
        </div>

        {/* Rep transcript */}
        {(isRecording || store.partialTranscript) && (
          <div className="bg-nutreco-blue/5 border border-nutreco-blue/20 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-nutreco-magenta mt-2 animate-pulse flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-nutreco-blue mb-1">You</p>
              <p className="text-nutreco-neutral text-sm leading-relaxed">
                {store.partialTranscript || '…listening'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-5 pt-6 pb-4">
        {isPaused ? (
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 text-amber-700 text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
              Session paused
            </div>
            <button
              type="button"
              onClick={handlePause}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-nutreco-blue text-white rounded-xl font-semibold text-sm hover:bg-blue-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Resume Session
            </button>
          </div>
        ) : (
          <MicButton
            isRecording={isRecording}
            isDisabled={store.isProcessing}
            onClick={handleMicClick}
          />
        )}

        <button
          type="button"
          onClick={handlePause}
          className="flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-nutreco-neutral transition-colors"
        >
          {isPaused ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Resume
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              Pause
            </>
          )}
        </button>
      </div>

      {/* End confirmation modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-nutreco-blue/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-nutreco-blue" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-nutreco-neutral text-center mb-1">End this session?</h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              Claude will extract and summarise your debrief for review before pushing to D365.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 flex items-center justify-center py-3 px-4 rounded-xl border-2 border-gray-200 text-nutreco-neutral font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => void handleEndSession()}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-nutreco-blue text-white font-semibold text-sm hover:bg-blue-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                End &amp; Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
