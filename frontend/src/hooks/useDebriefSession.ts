import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import { claudeService } from '../services/claudeService'
import { saveSession } from '../db/sessionDb'
import { useMsal } from '@azure/msal-react'
import type { SpinStage } from '../types/session'

export function useDebriefSession() {
  const navigate = useNavigate()
  const { accounts } = useMsal()
  const store = useSessionStore()

  const sessionContext = {
    repName: accounts[0]?.name ?? 'Rep',
    customerName: store.selectedAccount?.name ?? '',
    visitDate: store.visitDate,
    opportunityMode: store.opportunityMode,
    existingOpportunityName: store.opportunityName ?? undefined,
  }

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim()) return

      // Append user message
      store.appendMessage({ role: 'user', content: userText })
      store.setPartialTranscript('')
      store.setProcessing(true)

      try {
        const messages = [
          ...store.messages,
          { role: 'user' as const, content: userText },
        ]

        store.setStreamingResponse('')

        for await (const chunk of claudeService.streamChat(messages, sessionContext)) {
          if (chunk.type === 'text') {
            store.appendStreamingChunk(chunk.text)
          } else if (chunk.type === 'stage') {
            store.setStage(chunk.stage as SpinStage)
          }
        }

        store.commitStreamingResponse()
      } catch (err) {
        console.error('Claude error:', err)
      } finally {
        store.setProcessing(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.messages, sessionContext]
  )

  const endSession = useCallback(async () => {
    const { sessionId, selectedAccount, visitDate, opportunityMode, opportunityId, messages } = store
    if (!sessionId || !selectedAccount) return

    const account = accounts[0]
    const session = {
      id: sessionId,
      repId: account?.localAccountId ?? 'unknown',
      repName: account?.name ?? 'Unknown Rep',
      account: selectedAccount,
      visitDate,
      opportunityMode,
      opportunityId: opportunityId ?? undefined,
      messages,
      syncStatus: 'pending_sync' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await saveSession(session)
    navigate('/session/summary')
  }, [store, accounts, navigate])

  return { sendMessage, endSession, sessionContext }
}
