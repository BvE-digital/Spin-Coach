export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface SessionContext {
  repName: string
  customerName: string
  visitDate: string
  opportunityMode: 'new' | 'existing'
  existingOpportunityName?: string
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
    urgency: ExtractedField<'low' | 'medium' | 'high'>
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

export interface D365SyncPayload {
  session: {
    id: string
    repId: string
    repName: string
    account: { accountid: string; name: string }
    visitDate: string
    opportunityMode: 'new' | 'existing'
    opportunityId?: string
    messages: ChatMessage[]
    extraction?: SpinExtraction
  }
}
