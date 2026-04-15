import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ChatMessage, D365Account, D365Opportunity, OpportunityMode, SpinExtraction, SpinStage } from '../types/session'

interface SessionState {
  // Setup form
  selectedAccount: D365Account | null
  visitDate: string
  opportunityMode: OpportunityMode
  opportunityId: string | null
  opportunityName: string | null

  // Active debrief
  sessionId: string | null
  messages: ChatMessage[]
  currentSpinStage: SpinStage
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  partialTranscript: string
  streamingResponse: string

  // Extraction result
  extraction: SpinExtraction | null

  // Actions
  setAccount: (account: D365Account) => void
  setVisitDate: (date: string) => void
  setOpportunityMode: (mode: OpportunityMode) => void
  setOpportunity: (id: string, name: string) => void
  setSessionId: (id: string) => void
  appendMessage: (msg: ChatMessage) => void
  setStage: (stage: SpinStage) => void
  setListening: (v: boolean) => void
  setSpeaking: (v: boolean) => void
  setProcessing: (v: boolean) => void
  setPartialTranscript: (t: string) => void
  setStreamingResponse: (t: string) => void
  appendStreamingChunk: (chunk: string) => void
  commitStreamingResponse: () => void
  setExtraction: (data: SpinExtraction) => void
  resetSession: () => void
}

const defaultState = {
  selectedAccount: null,
  visitDate: new Date().toISOString().slice(0, 16),
  opportunityMode: 'new' as OpportunityMode,
  opportunityId: null,
  opportunityName: null,
  sessionId: null,
  messages: [] as ChatMessage[],
  currentSpinStage: 'S' as SpinStage,
  isListening: false,
  isSpeaking: false,
  isProcessing: false,
  partialTranscript: '',
  streamingResponse: '',
  extraction: null,
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      setAccount: (account) => set({ selectedAccount: account }),
      setVisitDate: (date) => set({ visitDate: date }),
      setOpportunityMode: (mode) => set({ opportunityMode: mode }),
      setOpportunity: (id, name) => set({ opportunityId: id, opportunityName: name }),
      setSessionId: (id) => set({ sessionId: id }),

      appendMessage: (msg) =>
        set((s) => ({ messages: [...s.messages, msg] })),

      setStage: (stage) => set({ currentSpinStage: stage }),
      setListening: (v) => set({ isListening: v }),
      setSpeaking: (v) => set({ isSpeaking: v }),
      setProcessing: (v) => set({ isProcessing: v }),
      setPartialTranscript: (t) => set({ partialTranscript: t }),
      setStreamingResponse: (t) => set({ streamingResponse: t }),

      appendStreamingChunk: (chunk) =>
        set((s) => ({ streamingResponse: s.streamingResponse + chunk })),

      commitStreamingResponse: () => {
        const text = get().streamingResponse
        if (text.trim()) {
          set((s) => ({
            messages: [...s.messages, { role: 'assistant', content: text }],
            streamingResponse: '',
          }))
        }
      },

      setExtraction: (data) => set({ extraction: data }),

      resetSession: () =>
        set({
          sessionId: null,
          messages: [],
          currentSpinStage: 'S',
          isListening: false,
          isSpeaking: false,
          isProcessing: false,
          partialTranscript: '',
          streamingResponse: '',
          extraction: null,
        }),
    }),
    {
      name: 'spin-coach-session',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist data-level state, not transient UI flags
      partialize: (s) => ({
        selectedAccount: s.selectedAccount,
        visitDate: s.visitDate,
        opportunityMode: s.opportunityMode,
        opportunityId: s.opportunityId,
        opportunityName: s.opportunityName,
        sessionId: s.sessionId,
        messages: s.messages,
        currentSpinStage: s.currentSpinStage,
        extraction: s.extraction,
      }),
    }
  )
)
