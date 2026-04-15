export type SpinStage = 'S' | 'P' | 'I' | 'N'
export type SyncStatus = 'in_progress' | 'pending_sync' | 'syncing' | 'synced' | 'error' | 'discarded'
export type OpportunityMode = 'new' | 'existing'
export type Urgency = 'low' | 'medium' | 'high'
export type Confidence = 'high' | 'medium' | 'low'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ExtractedField<T> {
  value: T | null
  confidence: number
}

export interface SpinExtraction {
  situation: {
    herdSize: ExtractedField<number>
    productionSystem: ExtractedField<string>
    currentProducts: ExtractedField<string[]>
    feedingRegime: ExtractedField<string>
    additionalContext: ExtractedField<string>
  }
  problem: {
    mainChallenge: ExtractedField<string>
    painPoints: ExtractedField<string[]>
    currentSuppliersIssues: ExtractedField<string>
  }
  implication: {
    financialImpact: ExtractedField<string>
    operationalImpact: ExtractedField<string>
    urgency: ExtractedField<Urgency>
  }
  needPayoff: {
    desiredOutcome: ExtractedField<string>
    perceivedValue: ExtractedField<string>
    decisionTimeline: ExtractedField<string>
    nextSteps: ExtractedField<string[]>
  }
  opportunity: {
    estimatedValue: ExtractedField<number>
    currency: ExtractedField<string>
    closeDate: ExtractedField<string>
  }
  overallSpinCoverage: {
    situationScore: number
    problemScore: number
    implicationScore: number
    needPayoffScore: number
  }
}

export interface D365Account {
  accountid: string
  name: string
  primarycontactid?: string
  telephone1?: string
}

export interface D365Opportunity {
  opportunityid: string
  name: string
  statecode: number
}

export interface D365SyncIds {
  opportunityId?: string
  phoneCallId?: string
  noteId?: string
  taskIds?: string[]
}

export interface Session {
  id: string
  repId: string
  repName: string
  account: D365Account
  visitDate: string
  opportunityMode: OpportunityMode
  opportunityId?: string
  messages: ChatMessage[]
  extraction?: SpinExtraction
  userEdits?: Partial<SpinExtraction>
  syncStatus: SyncStatus
  syncError?: string
  d365Ids?: D365SyncIds
  createdAt: string
  updatedAt: string
}
