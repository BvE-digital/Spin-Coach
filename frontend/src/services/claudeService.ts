import { msalInstance, loginRequest } from '../config/msalConfig'
import { ENDPOINTS } from '../config/apiConfig'
import type { ChatMessage, SpinExtraction } from '../types/session'
import type { SessionContext } from '../types/claude'
import { apiClient } from './apiClient'

const DEMO_MODE = !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === ''

async function getToken(): Promise<string> {
  if (DEMO_MODE) return '' // mock fetch intercepts /api/* without auth
  const accounts = msalInstance.getAllAccounts()
  if (accounts.length === 0) throw new Error('Not authenticated')
  const result = await msalInstance.acquireTokenSilent({
    scopes: loginRequest.scopes,
    account: accounts[0],
  })
  return result.accessToken
}

export const claudeService = {
  // SSE streaming chat — uses fetch (EventSource doesn't support POST/auth headers)
  async *streamChat(
    messages: ChatMessage[],
    sessionContext: SessionContext
  ): AsyncGenerator<{ type: 'text'; text: string } | { type: 'stage'; stage: string }> {
    const token = await getToken()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const response = await fetch(ENDPOINTS.claudeChat, {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages, sessionContext }),
    })

    if (!response.ok) throw new Error(`Claude chat failed: ${response.status}`)

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') return
        try {
          const parsed = JSON.parse(data) as Record<string, unknown>
          if (parsed['type'] === 'stage' && typeof parsed['stage'] === 'string') {
            yield { type: 'stage', stage: parsed['stage'] }
          } else if (typeof parsed['text'] === 'string') {
            yield { type: 'text', text: parsed['text'] }
          }
        } catch {
          // ignore malformed chunk
        }
      }
    }
  },

  async extractSpinData(
    transcript: string,
    sessionContext: SessionContext
  ): Promise<SpinExtraction> {
    const res = await apiClient.post<SpinExtraction>(ENDPOINTS.claudeExtract, {
      transcript,
      sessionContext,
    })
    return res.data
  },
}
