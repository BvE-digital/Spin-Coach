import type { ChatMessage, SpinExtraction } from './session'

export interface SessionContext {
  repName: string
  customerName: string
  visitDate: string
  opportunityMode: 'new' | 'existing'
  existingOpportunityName?: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  sessionContext: SessionContext
}

export interface ExtractRequest {
  transcript: string
  sessionContext: SessionContext
}

export interface ExtractResponse extends SpinExtraction {}

export interface SSEChunk {
  type: 'text' | 'stage' | 'done'
  text?: string
  stage?: string
}
